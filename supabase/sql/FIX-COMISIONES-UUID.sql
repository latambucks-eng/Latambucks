-- ============================================================
-- LATAMBUCKS — FIX DEFINITIVO: comisiones de referido (uuid vs texto)
-- ============================================================
-- CAUSA CONFIRMADA por el diagnóstico (SQLSTATE 42883):
--   "operator does not exist: uuid = text"
--
-- La columna comisiones_pendientes.usuario_id es de tipo TEXTO, pero:
--   · perfiles.id es UUID
--   · comisiones_referido.usuario_id es UUID
-- Por eso CUALQUIER fila fallaba al buscar el patrocinador (paso previo
-- al control de "sin patrocinador"), y por eso el resultado era
-- siempre "procesadas 0 / descartadas 0 / fallidas N".
--
-- QUÉ CORRIGE ESTE SCRIPT
--   1. Convierte usuario_id a UUID al consultar perfiles y al insertar
--      la comisión (::uuid en los dos lugares).
--   2. Descarta (sin fallar) las filas cuyo usuario_id no es un UUID
--      válido — hay datos de prueba como "SampleUser123" que hoy
--      rompen el trabajo cada hora.
--   3. Conserva el control de "sin patrocinador": esos casos se marcan
--      como procesados con acreditado = false (no se paga a nadie).
--   4. Mantiene el detalle de errores en el resultado para no volver a
--      quedarnos a ciegas si algo falla.
--
-- Idempotente. Ejecutar TODO y revisar el resultado final.
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
  v_errores JSONB := '[]'::jsonb;
  v_limite TIMESTAMPTZ := now() - interval '24 hours';
  v_re_uuid CONSTANT TEXT := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
BEGIN
  FOR v_pending IN
    SELECT cp.id, cp.usuario_id, cp.tarea_externa_id, cp.proveedor, cp.comision_estimada
    FROM public.comisiones_pendientes cp
    WHERE cp.procesado = false AND cp.creado_el < v_limite
  LOOP
    BEGIN
      -- 0) usuario_id debe ser un UUID real (usuario_id es texto en esta tabla)
      IF v_pending.usuario_id IS NULL OR v_pending.usuario_id !~* v_re_uuid THEN
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- 1) Si el proveedor revirtió la tarea, no hay comisión
      SELECT count(*) INTO v_reverted
      FROM public.historial_tareas
      WHERE tarea_externa_id = v_pending.tarea_externa_id
        AND proveedor = v_pending.proveedor
        AND estado = 'reversado';

      IF v_reverted > 0 THEN
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- 2) Patrocinador del usuario (perfiles.id es UUID)
      SELECT referido_por INTO v_sponsor_id
      FROM public.perfiles WHERE id = v_pending.usuario_id::uuid LIMIT 1;

      IF v_sponsor_id IS NULL THEN
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- 3) Acreditar saldo al patrocinador
      PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_pending.comision_estimada);

      -- 4) Registrar la comisión (usuario_id y sponsor_id son UUID)
      INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
      VALUES (v_pending.tarea_externa_id, v_pending.usuario_id::uuid, v_sponsor_id, v_pending.comision_estimada, v_pending.proveedor);

      UPDATE public.comisiones_pendientes
      SET procesado = true, procesado_el = now(), acreditado = true
      WHERE id = v_pending.id;
      v_procesadas := v_procesadas + 1;
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_errm = MESSAGE_TEXT, v_errstate = RETURNED_SQLSTATE;
        v_fallidas := v_fallidas + 1;
        IF jsonb_array_length(v_errores) < 5 THEN
          v_errores := v_errores || jsonb_build_object(
            'id', v_pending.id,
            'tarea', v_pending.tarea_externa_id,
            'sqlstate', v_errstate,
            'detalle', v_errm
          );
        END IF;
    END;
  END LOOP;

  RETURN json_build_object(
    'procesadas', v_procesadas,
    'descartadas', v_descartadas,
    'fallidas', v_fallidas,
    'motivos', v_errores
  );
END;
$$;

-- ------------------------------------------------------------
-- EJECUTAR UNA VEZ Y REVISAR
--   Esperado: fallidas = 0
--   procesadas: comisiones que sí se pagan (usuarios con patrocinador)
--   descartadas: sin patrocinador o usuario de prueba — no se paga a nadie
-- ------------------------------------------------------------
SELECT public.procesar_comisiones_pendientes() AS resultado;