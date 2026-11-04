-- Ejecutar solo este archivo en el SQL Editor de Supabase.
-- 15 segundos de visualización y 20 anuncios diarios son límites distintos.
BEGIN;
CREATE OR REPLACE FUNCTION public.registrar_video_con_limite(
  p_limite INT DEFAULT 20,
  p_recompensa NUMERIC DEFAULT 1,
  p_sesion_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT;
  v_today TIMESTAMPTZ;
  v_fecha_inicio TIMESTAMPTZ;
  v_completada BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error_unauthorized');
  END IF;
  IF p_sesion_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error_sesion_requerida');
  END IF;
  -- Serializa las acreditaciones del mismo usuario para respetar el límite diario.
  PERFORM id FROM public.perfiles WHERE id = v_user_id FOR UPDATE;
  SELECT fecha_inicio, completada INTO v_fecha_inicio, v_completada
  FROM public.sesiones_video
  WHERE id = p_sesion_id AND usuario_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error_sesion_invalida');
  END IF;
  IF v_completada THEN
    RETURN jsonb_build_object('status', 'error_sesion_ya_usada');
  END IF;
  IF extract(epoch FROM (clock_timestamp() - v_fecha_inicio)) < 15 THEN
    RETURN jsonb_build_object('status', 'error_tiempo_incompleto');
  END IF;
  v_today := date_trunc('day', now() AT TIME ZONE 'America/Buenos_Aires') AT TIME ZONE 'America/Buenos_Aires';
  SELECT count(*) INTO v_count FROM public.historial_tareas
  WHERE usuario_id = v_user_id AND proveedor = 'monetag_video' AND creado_el >= v_today;
  IF v_count >= 20 THEN
    RETURN jsonb_build_object('status', 'error_limite_diario_alcanzado');
  END IF;
  INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
  VALUES (v_user_id, 'video_' || p_sesion_id::text, 'monetag_video', 1, 'aprobado');
  UPDATE public.sesiones_video SET completada = true WHERE id = p_sesion_id;
  PERFORM public.acreditar_saldo_usuario(v_user_id, 1);
  RETURN jsonb_build_object('status', 'video_registrado_exito');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.registrar_video_con_limite(INTEGER, NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_video_con_limite(INTEGER, NUMERIC, UUID) TO authenticated;
COMMIT;