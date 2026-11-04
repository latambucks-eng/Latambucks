-- LatamBucks / TheoremReach: ejecutar en SQL Editor de Supabase ANTES del deploy.
-- Mantiene 1000 puntos = 1 USD; reward llega convertido por TheoremReach.
-- Historial, saldo, auditoría y comisión comparten una sola transacción.
-- No modifica créditos históricos ni presume si una tarea antigua fue pagada.
BEGIN;

CREATE TABLE IF NOT EXISTS public.theoremreach_transacciones (
  tx_id TEXT PRIMARY KEY,
  usuario_id UUID,
  puntos NUMERIC NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('aprobado', 'reversado')),
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.theoremreach_transacciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.theoremreach_transacciones FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.theoremreach_transacciones TO service_role;

CREATE OR REPLACE FUNCTION public.procesar_postback_theoremreach(
  p_tx_id TEXT, p_user_id UUID, p_puntos NUMERIC, p_reversal BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event public.theoremreach_transacciones%ROWTYPE;
  v_original public.historial_tareas%ROWTYPE;
  v_user UUID;
  v_puntos NUMERIC;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Acceso denegado' USING ERRCODE = '42501';
  END IF;
  IF p_tx_id IS NULL OR length(p_tx_id) = 0 OR length(p_tx_id) > 512
    OR p_puntos IS NULL OR p_puntos::TEXT IN ('NaN', 'Infinity', '-Infinity') OR p_puntos <= 0
    OR p_reversal IS NULL THEN
    RAISE EXCEPTION 'Postback inválido';
  END IF;
  -- Serializa crédito/reverso/reenvíos de una misma recompensa.
  PERFORM pg_advisory_xact_lock(hashtextextended('theoremreach:' || p_tx_id, 0));
  SELECT * INTO v_event FROM public.theoremreach_transacciones WHERE tx_id = p_tx_id FOR UPDATE;
  IF FOUND THEN
    IF p_user_id IS NOT NULL AND v_event.usuario_id IS NOT NULL AND p_user_id <> v_event.usuario_id THEN
      RAISE EXCEPTION 'Transacción de otro usuario';
    END IF;
    IF v_event.estado = 'reversado' OR NOT p_reversal THEN
      RETURN jsonb_build_object('success', true, 'estado', 'duplicado');
    END IF;
  END IF;

  SELECT * INTO v_original FROM public.historial_tareas
  WHERE proveedor = 'theoremreach' AND tarea_externa_id = p_tx_id
  ORDER BY creado_el LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF p_user_id IS NOT NULL AND p_user_id <> v_original.usuario_id THEN
      RAISE EXCEPTION 'Transacción de otro usuario';
    END IF;
    IF NOT p_reversal OR v_original.estado = 'reversado' THEN
      -- Créditos del endpoint anterior: no acreditar de nuevo automáticamente.
      INSERT INTO public.theoremreach_transacciones (tx_id, usuario_id, puntos, estado)
      VALUES (p_tx_id, v_original.usuario_id, abs(v_original.puntos_ganados),
        CASE WHEN v_original.estado = 'reversado' THEN 'reversado' ELSE 'aprobado' END)
      ON CONFLICT (tx_id) DO NOTHING;
      RETURN jsonb_build_object('success', true, 'estado', 'duplicado');
    END IF;
  ELSIF p_reversal THEN
    -- Guardar reversos que llegan antes que el crédito; impedir crédito tardío.
    INSERT INTO public.theoremreach_transacciones (tx_id, usuario_id, puntos, estado)
    VALUES (p_tx_id, p_user_id, p_puntos, 'reversado');
    INSERT INTO public.registro_postbacks (proveedor, transaccion_externa_id, usuario_id, puntos_procesados)
    VALUES ('theoremreach', p_tx_id || ':reversal', p_user_id, 0);
    RETURN jsonb_build_object('success', true, 'estado', 'reverso_sin_credito');
  END IF;

  v_user := CASE WHEN p_reversal THEN v_original.usuario_id ELSE p_user_id END;
  v_puntos := CASE WHEN p_reversal THEN abs(v_original.puntos_ganados) ELSE p_puntos END;
  IF v_user IS NULL OR v_puntos IS NULL OR v_puntos <= 0 THEN
    RAISE EXCEPTION 'Recompensa sin propietario o importe válido';
  END IF;
  PERFORM 1 FROM public.perfiles WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil inexistente'; END IF;

  IF p_reversal THEN
    IF v_original.estado <> 'aprobado' THEN RAISE EXCEPTION 'Estado original no reversible'; END IF;
    PERFORM public.descontar_saldo_reverso(v_user, v_puntos);
    UPDATE public.historial_tareas SET estado = 'reversado' WHERE id = v_original.id;
    UPDATE public.comisiones_pendientes
      SET procesado = true, procesado_el = now(), acreditado = false
      WHERE proveedor = 'theoremreach' AND tarea_externa_id = p_tx_id AND procesado = false;
  ELSE
    INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
    VALUES (v_user, p_tx_id, 'theoremreach', v_puntos, 'aprobado');
    PERFORM public.acreditar_saldo_usuario(v_user, v_puntos);
    INSERT INTO public.comisiones_pendientes
      (usuario_id, tarea_externa_id, proveedor, puntos_tarea, comision_estimada)
    VALUES (v_user, p_tx_id, 'theoremreach', v_puntos, round(v_puntos * 0.10, 4));
  END IF;

  INSERT INTO public.registro_postbacks (proveedor, transaccion_externa_id, usuario_id, puntos_procesados)
  VALUES ('theoremreach', CASE WHEN p_reversal THEN p_tx_id || ':reversal' ELSE p_tx_id END,
    v_user, CASE WHEN p_reversal THEN -v_puntos ELSE v_puntos END);
  INSERT INTO public.theoremreach_transacciones (tx_id, usuario_id, puntos, estado)
  VALUES (p_tx_id, v_user, v_puntos, CASE WHEN p_reversal THEN 'reversado' ELSE 'aprobado' END)
  ON CONFLICT (tx_id) DO UPDATE SET estado = EXCLUDED.estado;
  RETURN jsonb_build_object('success', true, 'estado', CASE WHEN p_reversal THEN 'reversado' ELSE 'acreditado' END);
END;
$$;
REVOKE ALL ON FUNCTION public.procesar_postback_theoremreach(TEXT, UUID, NUMERIC, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_postback_theoremreach(TEXT, UUID, NUMERIC, BOOLEAN) TO service_role;
COMMIT;