-- ============================================================
-- LatamBucks — FIX DE PERMISOS (causa raíz de 400/404 en el navegador)
-- ============================================================
-- DIAGNÓSTICO VERIFICADO EN LA BASE:
--   • Las funciones get_ganadores_recientes() y get_mis_referidos() EXISTEN
--     en su forma correcta SIN argumentos (no hay firmas legacy duplicadas).
--     La prueba directa lo confirma:
--       - get_ganadores_recientes()        → responde 200 (service role)
--       - get_ganadores_recientes(int)     → 404 (esa firma NO existe)
--       - get_mis_referidos()              → responde 200 (service role)
--       - get_mis_referidos(uuid)          → 404 (esa firma NO existe)
--   • Con service role responden 200, PERO desde el navegador fallan
--     (400 y 404) porque el rol 'authenticated' (el usuario logueado)
--     NO tiene permiso de ejecución. Los fix de seguridad previos
--     revocaron EXECUTE y dejaron las funciones solo para service role.
--
-- SOLUCIÓN DEFINITIVA (solo permisos — no toca las funciones):
--   Re-grantear EXECUTE SOLO a 'authenticated' (el frontend logueado),
--   y dejar 'anon' sin acceso. Idempotente y seguro de re-ejecutar.
-- ============================================================

-- 1) Asegurar que la firma correcta tenga EXECUTE para authenticated
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;

-- 2) Denegar a anon y PUBLIC (por capas de seguridad)
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM PUBLIC, anon;

-- ============================================================
-- 3) VERIFICACIÓN FINAL — DEBE DEVOLVER 2 FILAS (una por función)
--    donde el rol sea 'authenticated' (y NINGUNA fila con 'anon').
--    Si una función NO aparece con 'authenticated', el grant no quedó.
-- ============================================================
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       r.rolname AS ejecutante,
       CASE WHEN x.privilege_type IS NULL THEN 'NO' ELSE x.privilege_type END AS tiene
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) x ON true
LEFT JOIN pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public'
  AND p.proname IN ('get_ganadores_recientes','get_mis_referidos')
ORDER BY p.proname, r.rolname;