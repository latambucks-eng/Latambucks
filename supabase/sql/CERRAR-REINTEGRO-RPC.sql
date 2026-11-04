/*
  LATAMBUCKS — CERRAR reintegrar_saldo_campana (dejarla solo de uso interno)

  QUÉ SE COMPROBÓ EN VIVO (03/11/2026, contra la base de producción)
    Se creó un usuario común (sin admin, sin ser el anunciante de nada) y se
    llamó /rpc/reintegrar_saldo_campana con un id inexistente. En vez de
    responder 401, respondió "Campaña no encontrada": es decir, la función
    SÍ se ejecuta con cualquier sesión.

    Eso importa porque la función no valida nada por dentro (no mira
    auth.uid(), no compara con el dueño) y sobre la campaña que le pasen:
      · devuelve el sobrante al saldo_promocion del anunciante,
      · la marca reintegrado = true y activa = false.
    Los ids de campaña son enteros consecutivos, así que se pueden probar uno
    por uno. Cualquier usuario podría apagar campañas ajenas y dejarlas
    marcadas como reintegradas (y ya no se pueden reintegrar dos veces).

    La puerta correcta es administrar_estado_campana, que sí valida admin o
    dueño, y es la única que usa el panel del anunciante.

  QUÉ HACE ESTE SCRIPT
    Le quita el permiso al público (PUBLIC, anon) y a los usuarios comunes
    (authenticated), y se lo deja solo a service_role.
    Es idempotente: se puede correr las veces que quieras.

  POR QUÉ NO ROMPE NADA
    · El navegador NO llama esta función en ninguna pantalla: el panel del
      anunciante entra por administrar_estado_campana.
    · Los que la llaman por dentro —administrar_estado_campana y
      auto_aprobar_tareas_vencidas— son SECURITY DEFINER: se ejecutan como
      dueñas y no dependen de este permiso.
    · Los cron no la llaman directamente.

  CÓMO EJECUTARLO
    Supabase → SQL Editor → New query → pegar TODO → Run.
*/


-- ============================================================
-- 1) Cerrar la función
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'reintegrar_saldo_campana'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
    RAISE NOTICE 'Cerrada al público (la llaman los definer): %', r.firma;
  END LOOP;
END $$;


-- ============================================================
-- 2) VERIFICACIÓN — qué debe salir
--    anon_puede     = false   (nadie sin sesión)
--    usuario_puede  = false   (ningún usuario común)
--    servicio_puede = true    (los definer y el cron siguen pudiendo)
-- ============================================================
SELECT p.proname                                                 AS funcion,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_puede,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS usuario_puede,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS servicio_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'reintegrar_saldo_campana';


-- ============================================================
-- 3) ALARMA — y comprobación de que la puerta buena sigue abierta
--    administrar_estado_campana (la que usa el panel del anunciante) DEBE
--    seguir disponible para usuarios con sesión, o el botón "pausar y
--    reintegrar" dejaría de funcionar.
-- ============================================================
DO $$
DECLARE
  r record;
  v_fallos int := 0;
  v_pausar_ok boolean := false;
  v_hay_reintegrar boolean := false;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('reintegrar_saldo_campana', 'administrar_estado_campana')
  LOOP
    IF r.proname = 'reintegrar_saldo_campana' THEN
      v_hay_reintegrar := true;
      IF has_function_privilege('authenticated', r.oid, 'EXECUTE') THEN
        RAISE WARNING 'PELIGRO: reintegrar_saldo_campana sigue abierta a usuarios comunes.';
        v_fallos := v_fallos + 1;
      END IF;
      IF NOT has_function_privilege('service_role', r.oid, 'EXECUTE') THEN
        RAISE WARNING 'PELIGRO: perdió el permiso de servicio: los definer no podrían reintegrar.';
        v_fallos := v_fallos + 1;
      END IF;
    ELSE
      v_pausar_ok := has_function_privilege('authenticated', r.oid, 'EXECUTE');
    END IF;
  END LOOP;

  IF NOT v_hay_reintegrar THEN
    RAISE NOTICE 'La función no existe en esta base: nada que cerrar.';
  END IF;

  IF NOT v_pausar_ok THEN
    RAISE WARNING 'PELIGRO: administrar_estado_campana quedó cerrada y el panel del anunciante no podría pausar.';
    v_fallos := v_fallos + 1;
  END IF;

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO OK: el reintegro quedó solo para uso interno y pausar/reintegrar desde el panel sigue funcionando.';
  ELSE
    RAISE WARNING 'ATENCION: % revisión(es) fallaron. Avisame cuál aparece.', v_fallos;
  END IF;
END $$;