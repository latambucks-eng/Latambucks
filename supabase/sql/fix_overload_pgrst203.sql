-- ============================================================
-- LatamBucks — FIX PGRST203 (ambigüedad por doble firma) + 42P13
-- ============================================================
-- PROBLEMA 1 (PGRST203): el frontend llama estas RPC SIN argumentos:
--   rpcGetGanadores()   → /rpc/get_ganadores_recientes
--   rpcGetMisReferidos()→ /rpc/get_mis_referidos
--   Pero existen DOS firmas por cada una (heredada legacy + la correcta):
--     get_ganadores_recientes()                              ← requerida
--     get_ganadores_recientes(limite_filas integer)          ← heredada, sobra
--     get_mis_referidos()
--     get_mis_referidos(usuario_id text)                     ← heredada, sobra
--   PostgREST no sabe cuál elegir → 300 PGRST203. Slider de ganadores
--   y panel de referidos quedan rotos.
--
-- PROBLEMA 2 (42P13): la versión SIN args ya existe en la base con un
--   tipo de retorno distinto. CREATE OR REPLACE no puede cambiar el tipo
--   de retorno de una función existente → error. Por eso usamos DROP
--   explícito de TODAS las firmas antes de CREATE.
--
-- SOLUCIÓN (garantizada, idempotente):
--   1) DROP FUNCTION IF EXISTS de TODAS las firmas (sin args + con params),
--      para eliminar la ambigüedad Y el bloqueo de tipo de retorno.
--   2) CREATE la versión correcta SIN args (JSONB = lo que espera el frontend).
--   3) Permisos: authenticated (frontend logueado) ejecuta, anon denegado.
--
-- NO AFECTA (verificado):
--   - get-encuestas-disponibles  → Edge Function de Supabase, no se toca.
--   - get_encuestas_disponibles_bypass/final → legacy sin uso, no se toca.
--   - ejecutar_cron_base44() → cron legacy de la era Base44, no se usa y no se toca.
--   - Resto de la lógica (saldo, retiros, tareas, disputas, check-in,
--     cajas, avisos, timewall) → intacta.
--
-- IDEMPOTENTE: se puede ejecutar varias veces sin riesgo.
-- Ejecutar de una en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================
-- 1. DROP EXPLÍCITO DE TODAS LAS FIRMAS (idempotente)
--    Resuelve tanto el PGRST203 (quita la firma con parámetros) como el
--    42P13 (permite re-crear con nuevo tipo de retorno sin conflicto).
-- ============================================================
DROP FUNCTION IF EXISTS public.get_ganadores_recientes();
DROP FUNCTION IF EXISTS public.get_ganadores_recientes(limite_filas integer);

DROP FUNCTION IF EXISTS public.get_mis_referidos();
DROP FUNCTION IF EXISTS public.get_mis_referidos(usuario_id text);

-- ============================================================
-- 2. CREAR LA VERSIÓN CORRECTA SIN ARGS
--    get_ganadores_recientes() — ganadores aprobados de la última semana (JSONB)
-- ============================================================
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

-- ============================================================
-- 3. CREAR LA VERSIÓN CORRECTA SIN ARGS
--    get_mis_referidos() — referidos + comisiones del usuario (JSONB)
-- ============================================================
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

-- ============================================================
-- 4. PERMISOS — solo authenticated (frontend logueado), anon denegado
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_mis_referidos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mis_referidos() TO authenticated;

-- ============================================================
-- VERIFICACIÓN — debe devolver UNA sola firma por cada nombre:
--   get_ganadores_recientes()   y   get_mis_referidos()
-- (sin la firma con parámetros, sin ambigüedad)
-- ============================================================
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname IN ('get_ganadores_recientes','get_mis_referidos')
-- ORDER BY p.proname;