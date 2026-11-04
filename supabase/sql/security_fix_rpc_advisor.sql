-- ============================================================
-- LatamBucks — FIX Security Advisor (0028, 0011, 0014)
-- ============================================================
-- 0028_anon_security_definer_function_executable:
--   Las RPC críticas eran ejecutables por el rol `anon` vía PostgREST.
--   - Las atómicas solo-backend (acreditar_saldo_usuario, etc.) pasan a
--     SECURITY INVOKER + REVOKE EXECUTE FROM anon, public; GRANT a
--     service_role. Como el backend las llama con la Service Role Key
--     (BYPASSRLS), INVOKER sigue funcionando.
--   - Las de frontend (auth.uid) siguen SECURITY DEFINER (necesitan
--     bypass RLS / leer tablas ajenas) pero se les REVOKE FROM anon y
--     GRANT TO authenticated: solo usuarios logueados las pueden llamar.
--   - Los helpers de policies (is_admin, get_user_email, etc.) quedan
--     SECURITY DEFINER + ejecutables por anon y authenticated: los
--     necesitan las policies RLS para evaluar, y son seguros (leen
--     solo datos del propio usuario).
--
-- 0011_function_search_path_mutable:
--   Se fija SET search_path = public en TODAS las funciones del schema
--   public que no sean de extensiones.
--
-- 0014_extension_in_public (pg_net, http):
--   NO se mueven. ALTER EXTENSION SET SCHEMA no está soportado para
--   estas extensiones (ya se intentó). Quedan en public; son functions
--   de red de solo-lectura y el riesgo es bajo. Si se reinstalaran en
--   otro schema se romperían las llamadas salientes existentes.
--
-- IDEMPOTENTE. Ejecutar en el SQL Editor de Supabase.
-- No rompe el frontend: las funciones que el frontend llama vía RPC
-- quedan con GRANT TO authenticated (logueados con JWT).
-- ============================================================

-- ============================================================
-- 0. FIJAR search_path = public en todas las funciones propias
-- ============================================================
-- Excluye funciones que pertenecen a extensiones (pg_net, http, etc.)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT format('%I.%I(%s)', n.nspname, p.proname,
      pg_get_function_identity_arguments(p.oid)) AS fqn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d
      ON d.classid = 'pg_proc'::regclass
     AND d.objid = p.oid
     AND d.refclassid = 'pg_extension'::regclass
     AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND d.objid IS NULL  -- excluir funciones de extensiones
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.fqn);
  END LOOP;
END $$;

-- ============================================================
-- 1. FUNCIONES ATÓMICAS SOLO-BACKEND → SECURITY INVOKER
-- ============================================================
-- Solo las llaman las Edge Functions con la Service Role Key
-- (BYPASSRLS). INVOKER es seguro y elimina el riesgo de fraude por
-- llamada anónima directa (0028).

ALTER FUNCTION public.acreditar_saldo_usuario(UUID, NUMERIC) SECURITY INVOKER;
ALTER FUNCTION public.incrementar_saldo_referido(UUID, NUMERIC) SECURITY INVOKER;
ALTER FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) SECURITY INVOKER;
ALTER FUNCTION public.reembolsar_retiro_usuario(UUID, NUMERIC) SECURITY INVOKER;
ALTER FUNCTION public.incrementar_visitas_campana(INTEGER) SECURITY INVOKER;

-- REVOKE EXECUTE de anon y public; solo service_role puede llamarlas.
REVOKE EXECUTE ON FUNCTION public.acreditar_saldo_usuario(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.incrementar_saldo_referido(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reembolsar_retiro_usuario(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.incrementar_visitas_campana(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acreditar_saldo_usuario(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_saldo_referido(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.reembolsar_retiro_usuario(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_visitas_campana(INTEGER) TO service_role;

-- ============================================================
-- 2. FUNCIONES DEL CICLO (pg_cron) → SECURITY DEFINER + REVOKE anon
-- ============================================================
-- Las llama pg_cron (rol elevado) y, en el caso de auto_aprobar, también
-- el frontend admin. Se mantienen SECURITY DEFINER para que funcionen
-- sin depender de los privilegios del caller del cron, pero se revoca
-- EXECUTE de anon para que no sean ejecutables por la clave pública.

REVOKE EXECUTE ON FUNCTION public.procesar_ciclo_usuario(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.procesar_comisiones_pendientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.procesar_ciclo_usuario(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.procesar_comisiones_pendientes() TO service_role;

-- auto_aprobar_tareas_vencidas: frontend admin + cron
REVOKE EXECUTE ON FUNCTION public.auto_aprobar_tareas_vencidas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_aprobar_tareas_vencidas() TO authenticated;

-- ============================================================
-- 3. FUNCIONES DE FRONTEND (auth.uid) → REVOKE anon, GRANT authenticated
-- ============================================================
-- El frontend las llama con el JWT del usuario → PostgREST las corre
-- como rol `authenticated`. anon (sin login) no puede ejecutarlas.

REVOKE EXECUTE ON FUNCTION public.reclamar_checkin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamar_checkin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.abrir_caja_sorpresa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.abrir_caja_sorpresa() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.registrar_video_con_limite(INTEGER, NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_video_con_limite(INTEGER, NUMERIC, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.iniciar_sesion_video() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iniciar_sesion_video() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.aprobar_prueba(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprobar_prueba(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rechazar_prueba(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rechazar_prueba(TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.iniciar_disputa(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iniciar_disputa(TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.buscar_referido(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_referido(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_aviso_activo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_aviso_activo() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_timewall_mantenimiento() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_timewall_mantenimiento() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_timewall_mantenimiento(BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_timewall_mantenimiento(BOOLEAN, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rechazar_retiro(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rechazar_retiro(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 4. HELPERS DE POLICIES RLS → ejecutables por anon Y authenticated
-- ============================================================
-- Estas funciones las invocan las policies RLS al evaluar; el rol que
-- consulta (anon o authenticated) necesita EXECUTE. Son seguras: leen
-- solo el propio rol/email del usuario o hacen EXISTS acotados. Se
-- mantienen SECURITY DEFINER (las de cruce bypassan RLS para evitar
-- recursión infinita entre pruebas_tareas_locales y campanas_locales).

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_anunciante_campana(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_tiene_prueba_en_campana(INTEGER, UUID) TO anon, authenticated;

-- ============================================================
-- 5. TRIGGER FUNCTION — search_path ya fijado por el DO block
-- ============================================================
-- registrar_bono_bienvenida() es SECURITY DEFINER (trigger). El DO
-- block del paso 0 ya le fijó search_path = public. No se revoca
-- EXECUTE porque la llaman triggers, no PostgREST.

-- ============================================================
-- 6. VERIFICACIÓN
-- ============================================================
-- Funciones SECURITY DEFINER ejecutables por anon (debería quedar
-- solo is_admin, get_user_email, is_anunciante_campana,
-- usuario_tiene_prueba_en_campana, y los triggers):
--
-- SELECT p.proname, r.rolname
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- JOIN pg_depend d ON d.classid = 'pg_proc'::regclass AND d.objid = p.oid
-- JOIN pg_authid r ON r.oid = d.refobjid
-- WHERE n.nspname = 'public'
--   AND p.prosecdef = true
--   AND d.deptype = 'X'
--   AND r.rolname = 'anon';
--
-- Funciones con search_path no fijado (debe devolver 0):
--
-- SELECT p.proname
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- LEFT JOIN pg_depend d
--   ON d.classid = 'pg_proc'::regclass AND d.objid = p.oid
--  AND d.refclassid = 'pg_extension'::regclass
-- WHERE n.nspname = 'public'
--   AND d.objid IS NULL
--   AND p.proconfig IS NULL;