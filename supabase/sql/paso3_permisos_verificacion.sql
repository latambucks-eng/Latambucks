-- ============================================================
-- LatamBucks — PASO 3 — Permisos + verificación
-- Solo se ejecuta DESPUÉS de que el paso 2 terminó con éxito.
-- ============================================================

-- Permisos: SOLO authenticated puede ejecutar, anon denegado
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_referido(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM anon;
REVOKE EXECUTE ON FUNCTION public.buscar_referido(TEXT) FROM anon;

-- Verificación: debe devolver EXACTAMENTE 3 filas, una por función,
-- todas con args correctos (sin la firma con parámetros).
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       COALESCE(r.rolname, 'PUBLIC') AS ejecutante
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) x ON true
LEFT JOIN pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public'
  AND p.proname IN ('get_ganadores_recientes','get_mis_referidos','buscar_referido')
  AND r.rolname = 'authenticated'
  AND x.privilege_type = 'EXECUTE'
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);