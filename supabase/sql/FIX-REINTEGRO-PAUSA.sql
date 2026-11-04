/*
  LATAMBUCKS — FIX: el reintegro deja la campaña pausada, también cuando está llena

  QUÉ SE COMPROBÓ EN VIVO (03/11/2026)
    Con una campaña de prueba llena (2 cupos, 2 entregados), el reintegro
    devolvió lo correcto (0, "Sin cupos sobrantes") pero la dejó así:
        reintegrado = true   y   activa = true
    Por el panel no se nota, porque administrar_estado_campana la pausa antes
    de llamar. Pero por el camino directo (cron, o cualquier llamada interna)
    la campaña quedaba marcada como reintegrada y al mismo tiempo ACTIVA: una
    campaña cerrada que sigue apareciendo en la lista para los usuarios.

  QUÉ HACE ESTE SCRIPT
    En la rama "no hay cupos sobrantes" agrega activa = false al UPDATE, así
    la campaña queda igual por los dos caminos: reintegrada y pausada.
    Todo lo demás del cuerpo queda IGUAL (misma firma, mismo SECURITY DEFINER,
    misma conversión a puntos, mismos mensajes). Con cupos sobrantes ya ponía
    activa = false, así que los dos casos quedan coherentes.

  NO CAMBIA NADA MÁS
    · No toca saldos ni la fórmula del 70%.
    · No toca los cron.
    · CREATE OR REPLACE conserva los permisos que ya tenga la función.
    · Al final vuelve a cerrarla al público por las dudas (mismo cierre que
      CERRAR-REINTEGRO-RPC.sql): el navegador no la usa, y los que la llaman
      por dentro son SECURITY DEFINER.
    · Es idempotente.

  CÓMO EJECUTARLO
    Supabase → SQL Editor → New query → pegar TODO el archivo → Run.
*/


-- ============================================================
-- 1) Función corregida
-- ============================================================
CREATE OR REPLACE FUNCTION public.reintegrar_saldo_campana(p_campana_id INTEGER)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campana RECORD;
  v_cupos_sobrantes integer;
  v_valor_neto_cupo numeric;
  v_reintegro numeric;
  v_reintegro_pts numeric;
  v_anunciante_id uuid;
BEGIN
  SELECT * INTO v_campana FROM campanas_locales WHERE id = p_campana_id LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Campaña no encontrada');
  END IF;

  IF v_campana.reintegrado THEN
    RETURN json_build_object('success', false, 'error', 'La campaña ya fue reintegrada');
  END IF;

  v_cupos_sobrantes := GREATEST(0, COALESCE(v_campana.visitas_compradas, 0) - COALESCE(v_campana.visitas_actuales, 0));

  IF v_cupos_sobrantes = 0 OR COALESCE(v_campana.visitas_compradas, 0) = 0 THEN
    -- LATAMBUCKS-PAUSA-SIN-CUPOS: sin cupos no hay plata que devolver, pero
    -- la campaña SÍ se apaga (antes quedaba reintegrada y activa a la vez).
    UPDATE campanas_locales SET reintegrado = true, activa = false WHERE id = p_campana_id;
    RETURN json_build_object('success', true, 'reintegro', 0, 'mensaje', 'Sin cupos sobrantes');
  END IF;

  v_valor_neto_cupo := (COALESCE(v_campana.monto_invertido_ars, 0) * 0.70) / v_campana.visitas_compradas;
  v_reintegro := ROUND(v_cupos_sobrantes * v_valor_neto_cupo, 2);
  -- Convertir USD a puntos (1000 pts = 1 USD): saldo_promocion se guarda en PUNTOS.
  v_reintegro_pts := v_reintegro * 1000;

  SELECT id INTO v_anunciante_id FROM perfiles WHERE email = v_campana.anunciante_email LIMIT 1;

  IF v_anunciante_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Anunciante no encontrado en perfiles');
  END IF;

  UPDATE perfiles SET saldo_promocion = COALESCE(saldo_promocion, 0) + v_reintegro_pts WHERE id = v_anunciante_id;
  UPDATE campanas_locales SET reintegrado = true, activa = false WHERE id = p_campana_id;

  RETURN json_build_object('success', true, 'reintegro', v_reintegro, 'cupos_sobrantes', v_cupos_sobrantes, 'anunciante_id', v_anunciante_id);
END;
$$;


-- ============================================================
-- 2) Dejarla solo de uso interno (idempotente)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) TO service_role;


-- ============================================================
-- 3) VERIFICACIÓN — todo debe decir OK
--    tiene_pausa = true          (el arreglo quedó puesto)
--    una fila                     (no se duplicó la función)
--    usuario_puede = false        (solo uso interno)
--    servicio_puede = true        (los definer siguen pudiendo)
-- ============================================================
SELECT p.proname                                                 AS funcion,
       position('LATAMBUCKS-PAUSA-SIN-CUPOS' in pg_get_functiondef(p.oid)) > 0 AS tiene_pausa,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS usuario_puede,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS servicio_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'reintegrar_saldo_campana';


-- ============================================================
-- 4) ALARMA FINAL
-- ============================================================
DO $$
DECLARE
  r record;
  v_n int := 0;
  v_pausa boolean := false;
  v_servicio boolean := false;
  v_usuario boolean := true;
  v_fallos int := 0;
BEGIN
  FOR r IN
    SELECT p.oid,
           position('LATAMBUCKS-PAUSA-SIN-CUPOS' in pg_get_functiondef(p.oid)) > 0 AS pausa
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'reintegrar_saldo_campana'
  LOOP
    v_n := v_n + 1;
    v_pausa := v_pausa OR r.pausa;
    v_servicio := v_servicio OR has_function_privilege('service_role', r.oid, 'EXECUTE');
    v_usuario := v_usuario AND has_function_privilege('authenticated', r.oid, 'EXECUTE');
  END LOOP;

  IF v_n <> 1 THEN
    RAISE WARNING 'PELIGRO: hay % versiones de la función (debe ser 1).', v_n;
    v_fallos := v_fallos + 1;
  END IF;
  IF NOT v_pausa THEN
    RAISE WARNING 'PELIGRO: el arreglo no quedó aplicado. Revisá la VERIFICACIÓN 3.';
    v_fallos := v_fallos + 1;
  END IF;
  IF NOT v_servicio THEN
    RAISE WARNING 'PELIGRO: perdió el permiso de servicio: no se podría reintegrar.';
    v_fallos := v_fallos + 1;
  END IF;
  IF v_usuario THEN
    RAISE WARNING 'PELIGRO: quedó ejecutable por usuarios comunes.';
    v_fallos := v_fallos + 1;
  END IF;

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO OK: el reintegro ahora siempre deja la campaña pausada, haya o no cupos sobrantes.';
  ELSE
    RAISE WARNING 'ATENCION: % revisión(es) fallaron. Avisame cuál aparece.', v_fallos;
  END IF;
END $$;