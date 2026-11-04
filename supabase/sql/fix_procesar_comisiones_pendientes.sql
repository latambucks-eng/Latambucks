-- ============================================================
-- LatamBucks — FIX: procesar_comisiones_pendientes
-- ============================================================
-- PROBLEMA: La función en producción NO tiene el chequeo "sin patrocinador".
--   Cuando un usuario sin referido_por completa una tarea, la función
--   intenta INSERT en comisiones_referido con sponsor_id=NULL, pero la
--   tabla tiene NOT NULL en sponsor_id → SQLSTATE 23502 → EXCEPTION
--   → la fila queda procesado=false y reintenta para siempre.
--
-- SOLUCIÓN: Re-crear la función con el chequeo "sin patrocinador" que
--   descarta la comisión (procesado=true, acreditado=false) en lugar de
--   intentar el INSERT. Esto detiene los reintentos infinitos.
--
-- EJECUTAR en el SQL Editor de Supabase (una sola vez).
-- ============================================================

DROP FUNCTION IF EXISTS public.procesar_comisiones_pendientes();
CREATE OR REPLACE FUNCTION public.procesar_comisiones_pendientes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_reverted INT;
  v_sponsor_id UUID;
  v_errm TEXT;
  v_errstate TEXT;
  v_procesadas INT := 0;
  v_descartadas INT := 0;
  v_fallidas INT := 0;
  v_limite TIMESTAMPTZ := now() - interval '24 hours';
BEGIN
  FOR v_pending IN
    SELECT cp.id, cp.usuario_id, cp.tarea_externa_id, cp.proveedor, cp.comision_estimada
    FROM public.comisiones_pendientes cp
    WHERE cp.procesado = false AND cp.creado_el < v_limite
  LOOP
    -- Aislamiento del fallo por fila: un error aislado no aborta el ciclo.
    BEGIN
      -- Verificar si la tarea fue revertida
      SELECT count(*) INTO v_reverted
      FROM public.historial_tareas
      WHERE tarea_externa_id = v_pending.tarea_externa_id
        AND proveedor = v_pending.proveedor
        AND estado = 'reversado';

      IF v_reverted > 0 THEN
        -- Descartar (no acreditar comisión)
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- Buscar patrocinador
      SELECT referido_por INTO v_sponsor_id
      FROM public.perfiles WHERE id = v_pending.usuario_id LIMIT 1;

      IF v_sponsor_id IS NULL THEN
        -- Trazabilidad: el usuario no tiene patrocinador. No es pagable.
        RAISE WARNING 'procesar_comisiones_pendientes: comisión % (tarea %, proveedor %) sin patrocinador (usuario % no tiene referido_por); se marca descartada para evitar re-procesos',
          v_pending.id, v_pending.tarea_externa_id, v_pending.proveedor, v_pending.usuario_id;
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- Sponsor eliminado: el patrocinador ya no existe en perfiles.
      PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
      IF NOT FOUND THEN
        RAISE WARNING 'procesar_comisiones_pendientes: comisión % (tarea %, proveedor %) con patrocinador eliminado (sponsor % no existe en perfiles); se marca descartada para evitar re-procesos',
          v_pending.id, v_pending.tarea_externa_id, v_pending.proveedor, v_sponsor_id;
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- Acreditar comisión (10%)
      PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_pending.comision_estimada);
      INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
      VALUES (v_pending.tarea_externa_id, v_pending.usuario_id, v_sponsor_id, v_pending.comision_estimada, v_pending.proveedor);

      -- Marcar como procesado SOLO tras acreditar correctamente
      UPDATE public.comisiones_pendientes
      SET procesado = true, procesado_el = now(), acreditado = true
      WHERE id = v_pending.id;
      v_procesadas := v_procesadas + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Aislamiento del fallo: se registra el detalle, la fila queda
        -- procesado=false y se reintenta en el próximo ciclo. El resto del
        -- lote continúa pagándose en esta misma ejecución.
        GET STACKED DIAGNOSTICS v_errm = MESSAGE_TEXT, v_errstate = RETURNED_SQLSTATE;
        RAISE WARNING 'procesar_comisiones_pendientes: falló el procesamiento de la comisión % (tarea %, proveedor %) — SQLSTATE %, detalle: %. Se deja pendiente para reintento en el próximo ciclo',
          v_pending.id, v_pending.tarea_externa_id, v_pending.proveedor, v_errstate, v_errm;
        v_fallidas := v_fallidas + 1;
    END;
  END LOOP;

  RETURN json_build_object('procesadas', v_procesadas, 'descartadas', v_descartadas, 'fallidas', v_fallidas);
END;
$$;

-- Verificar que se actualizó correctamente.
-- Debe decir: ARREGLO APLICADO. Si dice NO APLICADO, el script se corrió en
-- otro proyecto de Supabase (o no llegó a ejecutarse el CREATE de arriba).
SELECT proname,
       pg_get_function_result(oid) AS return_type,
       CASE WHEN prosrc LIKE '%sin patrocinador%'
            THEN 'ARREGLO APLICADO'
            ELSE 'NO APLICADO — probablemente estás en otro proyecto' END AS estado
FROM pg_proc
WHERE proname = 'procesar_comisiones_pendientes';