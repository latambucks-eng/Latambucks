-- ============================================================
-- LatamBucks — FIX DEFINITIVO Y COMPLETO (ejecutar como UNA sola consulta)
-- Corrige TODOS los errores de una vez:
--   • get_ganadores_recientes → 400 (doble firma)
--   • get_mis_referidos      → 404 (firma legacy con parámetro)
-- Y deja ganadores SIN filtro de 7 días (todo el historial, LIMIT 50).
--
-- POR QUÉ ANTES NO FUNCIONABA:
--   Se usó CREATE OR REPLACE sin DROP previo. Al quedar firmas legacy
--   (get_ganadores_recientes(limite_filas) y get_mis_referidos(usuario_id))
--   aún ejecutables, PostgREST queda ambiguo → 400/404 y la versión con
--   filtro de 7 días seguía activa.
--
-- ESTE SCRIPT LO RESUELVE:
--   1) DROP ... CASCADE de TODAS las firmas de ambas funciones
--      (CASCADE limpia también los grants colgados).
--   2) CREATE la versión correcta SIN args (JSONB) de CADA una:
--      - get_ganadores_recientes(): TODAS las ganancias, sin fecha.
--      - get_mis_referidos(): referidos + comisiones del usuario actual.
--   3) GRANT EXECUTE solo a authenticated (anon denegado).
--
-- IDEMPOTENTE: se puede ejecutar varias veces sin riesgo.
-- ============================================================

-- ============ 1. ELIMINAR TODAS LAS FIRMAS (con CASCADE) ============
DROP FUNCTION IF EXISTS public.get_ganadores_recientes() CASCADE;
DROP FUNCTION IF EXISTS public.get_ganadores_recientes(limite_filas integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_ganadores_recientes(text) CASCADE;

DROP FUNCTION IF EXISTS public.get_mis_referidos() CASCADE;
DROP FUNCTION IF EXISTS public.get_mis_referidos(usuario_id text) CASCADE;

-- ============ 2. RECREAR LA VERSIÓN CORRECTA ============

-- get_ganadores_recientes() — TODAS las ganancias aprobadas de TODOS los
-- usuarios (sin filtro de 7 días), ordenadas de más reciente a más vieja.
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
      ORDER BY creado_el DESC
      LIMIT 50),
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

-- ============ 3. PERMISOS — solo authenticated (frontend logueado) ============
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;

-- ============ 4. VERIFICACIÓN — debe devolver UNA firma por función ============
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       COALESCE(r.rolname, 'PUBLIC') AS ejecutante
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) x ON true
LEFT JOIN pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public'
  AND p.proname IN ('get_ganadores_recientes','get_mis_referidos')
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);