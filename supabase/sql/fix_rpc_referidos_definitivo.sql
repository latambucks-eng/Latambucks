-- ============================================================
-- LatamBucks — FIX DEFINITIVO RPC referidos / ganadores
-- ============================================================
-- Problema: 404 en get_mis_referidos y 400 (PGRST203) en
-- get_ganadores_recientes para usuarios autenticados.
-- Causa: quedaron firmas legacy CON parámetros que tienen EXECUTE
-- para authenticated y conviven con la versión sin-args. PostgREST
-- no sabe cuál invocar (400) o solo ve ejecutable la legacy (404).
--
-- Fix infalible: DROP por OID (elimina TODAS las firmas del nombre,
-- sin importar cómo se llamen sus parámetros) + REVOKE de EXECUTE,
-- luego se recrea UNICAMENTE la versión sin-args y se le da execute
-- solo a authenticated.
--
-- IDEMPOTENTE. Ejecutar TODO de una en el SQL Editor de Supabase.
-- ============================================================

-- ============ 1. DROP ROBUSTO POR OID (borra toda firma del nombre) ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_ganadores_recientes','get_mis_referidos','buscar_referido')
  LOOP
    EXECUTE format('DROP FUNCTION %s CASCADE', r.oid::regprocedure);
  END LOOP;
END $$;

-- ============ 2. REVOKE de seguridad: nadie fuera de lo que recreamos ============
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.buscar_referido(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.buscar_referido(TEXT) FROM authenticated;

-- ============ 3. CREAR LA ÚNICA FIRMA CORRECTA ============

-- get_ganadores_recientes() — ganadores aprobados de la última semana
CREATE FUNCTION public.get_ganadores_recientes()
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
        AND creado_el >= now() - interval '7 days'
      ORDER BY creado_el DESC
      LIMIT 30),
      '[]'::jsonb
    )
  );
END;
$$;

-- get_mis_referidos() — referidos + comisiones del usuario
CREATE FUNCTION public.get_mis_referidos()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT json_build_object(
    'success', true,
    'total_referidos', count(r),
    'total_ganado', COALESCE(sum(c.comision), 0),
    'total_pendiente', COALESCE(sum(cp.comision_estimada), 0),
    'referidos', json_agg(
      json_build_object(
        'id', r.id,
        'email', CASE
          WHEN r.email IS NULL OR r.email = '' THEN '—'
          ELSE left(split_part(r.email, '@', 1), 2) || '***@' || split_part(r.email, '@', 2)
        END,
        'comision_acreditada', COALESCE(c.comision, 0),
        'comision_pendiente', COALESCE(cp.comision_estimada, 0),
        'registrado', r.created_at
      )
    )
  )
  INTO v_result
  FROM public.perfiles r
  LEFT JOIN (
    SELECT usuario_id, sum(comision) AS comision
    FROM public.comisiones_referido
    WHERE sponsor_id = v_user_id
    GROUP BY usuario_id
  ) c ON c.usuario_id = r.id
  LEFT JOIN (
    SELECT usuario_id, sum(comision_estimada) AS comision_estimada
    FROM public.comisiones_pendientes
    WHERE procesado = false
    GROUP BY usuario_id
  ) cp ON cp.usuario_id = r.id
  WHERE r.referido_por = v_user_id;

  IF v_result IS NULL THEN
    RETURN json_build_object('success', true, 'total_referidos', 0, 'total_ganado', 0, 'total_pendiente', 0, 'referidos', '[]'::jsonb);
  END IF;

  RETURN v_result;
END;
$$;

-- buscar_referido(p_codigo TEXT)
CREATE FUNCTION public.buscar_referido(p_codigo TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sponsor_id UUID;
  v_caller_id UUID := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  SELECT id INTO v_sponsor_id
  FROM public.perfiles
  WHERE codigo_referido = p_codigo
  LIMIT 1;

  IF v_sponsor_id IS NULL THEN
    BEGIN
      SELECT id INTO v_sponsor_id
      FROM public.perfiles
      WHERE id = p_codigo::uuid
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      v_sponsor_id := NULL;
    END;
  END IF;

  IF v_sponsor_id = v_caller_id THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  RETURN json_build_object('sponsor_id', v_sponsor_id);
END;
$$;

-- ============ 4. PERMISOS — SOLO authenticated, anon denegado ============
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_referido(TEXT) TO authenticated;

-- ============ 5. VERIFICACIÓN — debe devolver EXACTAMENTE 3 filas, una por función ============
-- (sin la firma con parámetros = sin ambigüedad)
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