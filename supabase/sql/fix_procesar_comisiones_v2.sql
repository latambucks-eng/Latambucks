-- FIX: procesar_comisiones_pendientes
-- Ejecutar TODO este bloque en el SQL Editor de Supabase (Ctrl+Enter)
-- Debe decir "Success. No rows returned." — NO mostrar una tabla de resultados.

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
    BEGIN
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

      SELECT referido_por INTO v_sponsor_id
      FROM public.perfiles WHERE id = v_pending.usuario_id LIMIT 1;

      IF v_sponsor_id IS NULL THEN
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
      IF NOT FOUND THEN
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_pending.comision_estimada);
      INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
      VALUES (v_pending.tarea_externa_id, v_pending.usuario_id, v_sponsor_id, v_pending.comision_estimada, v_pending.proveedor);

      UPDATE public.comisiones_pendientes
      SET procesado = true, procesado_el = now(), acreditado = true
      WHERE id = v_pending.id;
      v_procesadas := v_procesadas + 1;
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_errm = MESSAGE_TEXT, v_errstate = RETURNED_SQLSTATE;
        RAISE WARNING 'procesar_comisiones_pendientes: falló % — SQLSTATE %, %', v_pending.id, v_errstate, v_errm;
        v_fallidas := v_fallidas + 1;
    END;
  END LOOP;

  RETURN json_build_object('procesadas', v_procesadas, 'descartadas', v_descartadas, 'fallidas', v_fallidas);
END;
$$;