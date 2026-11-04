-- ============================================================
-- LatamBucks — PASO 2 — Crear las 3 funciones correctas
-- Solo se ejecuta DESPUÉS de que el paso 1 terminó con éxito.
-- ============================================================

-- get_ganadores_recientes() — ganadores de la ÚLTIMA SEMANA (7 días)
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
        AND creado_el >= now() - interval '7 days'
      ORDER BY creado_el DESC
      LIMIT 30),
      '[]'::jsonb
    )
  );
END;
$$;

-- get_mis_referidos() — referidos + comisiones del usuario
CREATE OR REPLACE FUNCTION public.get_mis_referidos()
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
CREATE OR REPLACE FUNCTION public.buscar_referido(p_codigo TEXT)
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