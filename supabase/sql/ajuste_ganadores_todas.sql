-- ============================================================
-- LatamBucks — AJUSTE get_ganadores_recientes() SIN filtro de fecha
-- Devuelve TODAS las ganancias aprobadas de TODOS los usuarios
-- del historial_tareas (sin límite de 7 días).
-- Pegar y ejecutar como consulta única en el SQL Editor de Supabase.
-- ============================================================

-- get_ganadores_recientes() — todas las ganancias, sin filtro de semana
CREATE OR REPLACE FUNCTION public.get_ganadores_recientes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ganadores', '[]'::jsonb);
  END IF;
  RETURN json_build_object(
    'ganadores',
    COALESCE(
      (SELECT json_agg(json_build_object(
        'userId', left(usuario_id::text, 8),
        'puntos', puntos_ganados,
        'proveedor', CASE proveedor
          WHEN 'tarea_local' THEN 'Tarea local'
          WHEN 'monetag_video' THEN 'Video patrocinado'
          WHEN 'caja_sorpresa' THEN 'Caja sorpresa'
          WHEN 'cpx_research' THEN 'Encuesta CPX'
          WHEN 'theoremreach' THEN 'Encuesta TheoremReach'
          WHEN 'timewall' THEN 'TimeWall'
          ELSE COALESCE(proveedor, 'Tarea')
        END,
        'creado_el', creado_el
      ))
      FROM public.historial_tareas
      WHERE estado = 'aprobado' AND puntos_ganados > 0
      ORDER BY creado_el DESC
      LIMIT 50),
      '[]'::jsonb
    )
  );
END;
$$;

-- Permiso: solo usuarios logueados (authenticated)
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;

-- Verificación: debe devolver 1 fila, sin ambiguar
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       COALESCE(r.rolname, 'PUBLIC') AS ejecutante
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) x ON true
LEFT JOIN pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public'
  AND p.proname = 'get_ganadores_recientes'
  AND r.rolname = 'authenticated'
  AND x.privilege_type = 'EXECUTE'
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);