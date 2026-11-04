-- ============================================================
-- LATAMBUCKS — DIAGNÓSTICO: por qué fallan las comisiones de referidos
-- ============================================================
-- El trabajo automático devuelve "fallidas: 54" pero no dice el motivo:
-- la función solo lleva un contador y esconde el mensaje de error.
--
-- Este script hace dos cosas:
--   1. Muestra quién es el dueño de la función y si es SECURITY DEFINER
--      (si el dueño no es el que administra las tablas, cada fila falla
--      con "permission denied").
--   2. Reemplaza la función por la misma lógica, pero devolviendo hasta
--      5 mensajes de error reales, y la ejecuta una vez.
--
-- NO cambia ninguna regla de negocio: paga lo mismo, descarta lo mismo.
-- Ejecutar TODO y pegar el resultado de la última consulta.
-- ============================================================

-- ------------------------------------------------------------
-- 1) ESTADO DE LA FUNCIÓN (dueño y modo de seguridad)
--    duenio debe ser "postgres". security_definer debe ser true.
-- ------------------------------------------------------------
SELECT p.oid,
       p.prosecdef AS security_definer,
       p.proowner::regrole::text AS duenio,
       pg_get_function_result(p.oid) AS retorno
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'procesar_comisiones_pendientes';

-- ------------------------------------------------------------
-- 2) VERSIÓN CON DIAGNÓSTICO (misma lógica + motivos de error)
-- ------------------------------------------------------------
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
        v_fallidas := v_fallidas + 1;
        -- Se guardan hasta 5 motivos distintos, con el SQLSTATE real.
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
-- 3) EJECUTAR UNA VEZ Y VER EL RESULTADO
--    Pegá lo que devuelve: con el campo "motivos" ya sabemos la causa.
-- ------------------------------------------------------------
SELECT public.procesar_comisiones_pendientes() AS resultado;