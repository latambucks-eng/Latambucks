-- ============================================================
-- LATAMBUCKS — BLINDAJE DE RPCs DE DINERO (correr UNA vez)
-- ============================================================
-- HALLAZGO DE LA AUDITORÍA (comprobado contra la base en producción,
-- llamando por REST SIN sesión, es decir con el rol `anon`):
--
--   1) acreditar_saldo_usuario(uuid, puntos)      → respondió 200
--      Cualquiera podía regalarse (o regalar) puntos sin límite.
--
--   2) aplicar_resta_reverso_cpx(uuid, monto)     → respondió 200
--      Cualquiera podía restar saldo a la cuenta de otro usuario.
--
--   3) registrar_video_con_limite(..., p_user_id) → respondió 409 de FK
--      Es la versión VIEJA del RPC de videos: acredita a un usuario
--      arbitrario y no valida la sesión de 15 segundos. La versión que
--      usa la app (p_sesion_id) sí está bien cerrada.
--
--   El resto de las RPC de dinero ya estaba correcto (devolvían
--   401 / permission denied para `anon`): incrementar_saldo_referido,
--   incrementar_visitas_campana, descontar_saldo_reverso,
--   reembolsar_retiro_usuario, procesar_ciclo_usuario,
--   liberar_saldos_pendientes_cron, procesar_cierre_ciclo_weekly.
--
-- NINGUNA de estas funciones se llama desde el navegador: solo las usan
-- las Edge Functions (cpagrip-postback, cpx-postback, timewall-postback,
-- rapidoreach-webhook, recargar-giros-smartlink) con service_role.
-- Por eso revocarlas NO rompe ninguna pantalla de la app.
--
-- ¿Y LOS POSTBACKS DE LOS PROVEEDORES? Verificado: ningún proveedor
-- (CPAGrip, CPX, TimeWall, RapidoReach, TheoremReach) escribe ni lee
-- tablas directamente. Todos llegan a su Edge Function, y esa Edge
-- Function llama a la RPC con service_role. Por eso este script
-- REVOCA al público pero vuelve a CONCEDER explícitamente a
-- service_role: sin ese GRANT, al quitar el permiso heredado de PUBLIC
-- se romperían TODOS los postbacks (401 permission denied).
--
-- Orden correcto en cada función: REVOKE ... FROM PUBLIC, anon,
-- authenticated  +  GRANT EXECUTE ... TO service_role.
--
-- Idempotente. Pegar TODO en Supabase → SQL Editor → Run.
-- ============================================================


-- ============================================================
-- 1) CERRAR LAS RPC DE DINERO QUE USAN LAS EDGE FUNCTIONS
--    Se revoca a PUBLIC, anon y authenticated en TODAS sus variantes.
-- ============================================================
DO $$
DECLARE
  r record;
  v_lista text[] := ARRAY[
    'acreditar_saldo_usuario',
    'aplicar_resta_reverso_cpx',
    'incrementar_saldo_referido',
    'incrementar_visitas_campana',
    'descontar_saldo_reverso',
    'reembolsar_retiro_usuario',
    'procesar_ciclo_usuario',
    'liberar_saldos_pendientes_cron',
    'procesar_cierre_ciclo_weekly',
    'procesar_reverso_proveedor',
    'procesar_evento_theoremreach',
    'procesar_postback_theoremreach',
    'registrar_sesion_theoremreach',
    'resolver_usuario_theoremreach'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (v_lista)
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
      -- CLAVE PARA LOS POSTBACKS: service_role tiene que seguir pudiendo
      -- ejecutarla. Se concede explícitamente porque al revocar PUBLIC se
      -- pierde el permiso heredado.
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
      RAISE NOTICE 'Blindada (queda solo para service_role): %', r.firma;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo blindar %: %', r.firma, SQLERRM;
    END;
  END LOOP;
END $$;


-- ============================================================
-- 2) VERSIÓN VIEJA DEL RPC DE VIDEOS (la que acredita por p_user_id)
--    Se deja intacta la de p_sesion_id, que es la que usa la app y sí
--    valida los 15 segundos.
-- ============================================================
DO $$
DECLARE
  r record;
  v_encontrada boolean := false;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'registrar_video_con_limite'
      AND 'p_user_id' = ANY (COALESCE(p.proargnames, ARRAY[]::text[]))
  LOOP
    v_encontrada := true;
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
      RAISE NOTICE 'Blindada versión vieja de videos (solo service_role): %', r.firma;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo blindar %: %', r.firma, SQLERRM;
    END;
  END LOOP;

  IF NOT v_encontrada THEN
    RAISE NOTICE 'La versión vieja de videos ya no existe: nada que hacer.';
  END IF;
END $$;


-- ============================================================
-- 3) VERIFICACIÓN — el resultado esperado es:
--      anon_puede      = false   (nadie sin sesión)
--      usuario_puede   = false   (ningún usuario común)
--      servicio_puede  = true    (los postbacks de los proveedores siguen funcionando)
--    Si alguna fila muestra servicio_puede = false, ESE proveedor dejaría
--    de acreditar: avisame y lo revisamos.
-- ============================================================
SELECT p.proname                                        AS funcion,
       p.oid::regprocedure::text                        AS firma,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_puede,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS usuario_puede,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS servicio_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname IN (
      'acreditar_saldo_usuario',
      'aplicar_resta_reverso_cpx',
      'incrementar_saldo_referido',
      'incrementar_visitas_campana',
      'descontar_saldo_reverso',
      'reembolsar_retiro_usuario',
      'procesar_ciclo_usuario',
      'liberar_saldos_pendientes_cron',
      'procesar_cierre_ciclo_weekly',
      'procesar_reverso_proveedor',
      'procesar_evento_theoremreach',
      'procesar_postback_theoremreach',
      'registrar_sesion_theoremreach',
      'resolver_usuario_theoremreach'
    )
    OR (p.proname = 'registrar_video_con_limite'
        AND 'p_user_id' = ANY (COALESCE(p.proargnames, ARRAY[]::text[])))
  )
ORDER BY p.proname;


-- ============================================================
-- 4) CONTROL: las RPC que SÍ usa la app deben seguir abiertas
--    para usuarios con sesión (usuario_puede = true).
-- ============================================================
SELECT p.proname                                        AS funcion_de_la_app,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS usuario_puede,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'abrir_caja_sorpresa',
    'reclamar_checkin',
    'procesar_giro_tragamonedas',
    'iniciar_sesion_video',
    'registrar_video_con_limite',
    'aprobar_prueba',
    'rechazar_prueba',
    'iniciar_disputa',
    'activar_campana_con_saldo',
    'administrar_estado_campana',
    'rechazar_retiro',
    'registrar_referido_pro',
    'buscar_referido',
    'get_mis_referidos',
    'get_ganadores_recientes',
    'get_aviso_activo',
    'is_admin'
  )
ORDER BY p.proname;