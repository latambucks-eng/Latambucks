-- ============================================================
-- LatamBucks — Security Advisor 0028 (cierre final)
-- ============================================================
-- Revoca EXECUTE de anon/PUBLIC en las funciones con firma específica
-- que el script automático no agarró, y deja los permisos correctos:
--   * RPCs usadas por el frontend (usuario autenticado) → authenticated
--   * Cron viejo de Base44 → solo service_role
--
-- Ejecutar todo de una vez en el SQL Editor de Supabase.
-- ============================================================

-- 1) get_ganadores_recientes(limite_filas integer)
--    Frontend: rpcGetGanadores() la llama con token de usuario (sin args,
--    usa el default de limite_filas). Segura para authenticated.
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes(limite_filas integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes(limite_filas integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes(limite_filas integer) TO authenticated;

-- 2) get_mis_referidos(usuario_id text)
--    Frontend: rpcGetMisReferidos() la llama con token (usa auth.uid() por
--    dentro, usuario_id tiene default). Segura para authenticated.
REVOKE EXECUTE ON FUNCTION public.get_mis_referidos(usuario_id text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_mis_referidos(usuario_id text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos(usuario_id text) TO authenticated;

-- 3) get_encuestas_disponibles_bypass(payload jsonb)
--    Legacy — NO se usa desde el frontend (se reemplazó por la Edge
--    Function get-encuestas-disponibles). Se revoca de anon/PUBLIC y se
--    otorga solo a service_role + authenticated por compatibilidad, pero
--    como no hay UI que la invoque, no expone nada nuevo.
REVOKE EXECUTE ON FUNCTION public.get_encuestas_disponibles_bypass(payload jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_encuestas_disponibles_bypass(payload jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_encuestas_disponibles_bypass(payload jsonb) TO authenticated;

-- 4) get_encuestas_disponibles_final(payload jsonb)
--    Legacy — ídem (3).
REVOKE EXECUTE ON FUNCTION public.get_encuestas_disponibles_final(payload jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_encuestas_disponibles_final(payload jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_encuestas_disponibles_final(payload jsonb) TO authenticated;

-- 5) ejecutar_cron_base44()
--    Cron viejo de Base44 — no se acciona desde el frontend. Solo
--    service_role (pg_cron corre como service_role) puede ejecutarla.
REVOKE EXECUTE ON FUNCTION public.ejecutar_cron_base44() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ejecutar_cron_base44() FROM anon;
REVOKE EXECUTE ON FUNCTION public.ejecutar_cron_base44() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.ejecutar_cron_base44() TO service_role;

-- ============================================================
-- VERIFICACIÓN — debe devolver cero filas con grantee = 'anon'
-- ============================================================
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
--        r.grantee, r.privilege_type
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- JOIN information_schema.routine_privileges r
--   ON r.specific_schema = n.nspname AND r.routine_name = p.proname
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_ganadores_recientes','get_mis_referidos',
--     'get_encuestas_disponibles_bypass','get_encuestas_disponibles_final',
--     'ejecutar_cron_base44'
--   )
--   AND r.grantee = 'anon';