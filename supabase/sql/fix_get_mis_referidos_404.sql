-- ============================================================
-- LatamBucks — FIX COMPLETO (definitivo e idempotente)
-- Corrige: get_ganadores_recientes (400) y get_mis_referidos (404)
-- ============================================================
-- POR QUÉ SIGUE EL ERROR:
--   En la base quedaron firmas LEGACY que NUNCA se dropearon:
--     get_ganadores_recientes(limite_filas integer)
--     get_mis_referidos(usuario_id text)
--   Esas firmas tienen EXECUTE para authenticated (le fueron dadas por el
--   fix de seguridad previo). Resultado:
--     • get_mis_referidos: solo la firma legacy es ejecutable → la llamada
--       SIN args no matchea → 404.
--     • get_ganadores_recientes: DOS firmas ejecutables → ambigüedad PGRST203 → 400.
--
-- SOLUCIÓN (de una vez por todas):
--   1) DROP ... CASCADE de TODAS las firmas (la legacy + la correcta) de
--      ambas funciones. CASCADE elimina también los grants colgados.
--   2) CREATE la versión correcta SIN args (JSONB) de cada una.
--   3) GRANT EXECUTE solo a authenticated (anon denegado). Renunciar al
--      bug en que la firma '()' quedaba sin grant → prohibido que pase.
--
-- IDEMPOTENTE: se puede ejecutar infinitas veces sin riesgo.
-- Ejecutar en Supabase → SQL Editor → Run.
-- ============================================================

-- ============ 1. ELIMINAR TODAS LAS FIRMAS (con CASCADE) ============
DROP FUNCTION IF EXISTS public.get_ganadores_recientes() CASCADE;
DROP FUNCTION IF EXISTS public.get_ganadores_recientes(limite_filas integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_ganadores_recientes(text) CASCADE;

DROP FUNCTION IF EXISTS public.get_mis_referidos() CASCADE;
DROP FUNCTION IF EXISTS public.get_mis_referidos(usuario_id text) CASCADE;

DROP FUNCTION IF EXISTS public.buscar_referido(text) CASCADE;

-- ============ 2. RECREAR LA VERSIÓN CORRECTA ============

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

-- get_mis_referidos() — referidos + comisiones del usuario actual
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

-- buscar_referido(p_codigo TEXT) — re-creada también (ensamblada)
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
    SELECT id INTO v_sponsor_id
    FROM public.perfiles
    WHERE id = p_codigo::uuid
    LIMIT 1;
  END IF;

  IF v_sponsor_id = v_caller_id THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  RETURN json_build_object('sponsor_id', v_sponsor_id);
END;
$$;

-- ============ 3. PERMISOS — solo authenticated, anon DENEGADO ============
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.buscar_referido(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_referido(TEXT) TO authenticated;

-- ============ 4. VERIFICACIÓN (devuelve las firmas de las 3 funciones y quién puede ejecutarlas) ============
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       COALESCE(r.rolname, 'PUBLIC') AS ejecutante
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) x ON true
LEFT JOIN pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public'
  AND p.proname IN ('get_ganadores_recientes','get_mis_referidos','buscar_referido')
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);