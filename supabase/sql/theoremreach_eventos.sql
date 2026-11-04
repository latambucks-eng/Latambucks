-- ============================================================
-- LatamBucks / TheoremReach — Event Webhook (reversals + bans)
-- ------------------------------------------------------------
-- Ejecutar en el SQL Editor de Supabase ANTES de desplegar
-- supabase/functions/theoremreach-event-webhook.
--
-- El Event Webhook notifica reversals y bans (NO recompensas).
-- Requiere las RPCs y tablas de theoremreach_acreditacion_atomica.sql.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.theoremreach_eventos (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('reversal', 'ban', 'test')),
  usuario_id TEXT,
  payload JSONB NOT NULL,
  procesado BOOLEAN NOT NULL DEFAULT false,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.theoremreach_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.theoremreach_eventos FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.theoremreach_eventos TO service_role;

-- Tabla local de bloqueos del proveedor (no toca perfiles/auth):
-- registra usuarios bloqueados por TheoremReach para conciliación.
CREATE TABLE IF NOT EXISTS public.theoremreach_bloqueos (
  usuario_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, event_id)
);
ALTER TABLE public.theoremreach_bloqueos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.theoremreach_bloqueos FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.theoremreach_bloqueos TO service_role;

CREATE OR REPLACE FUNCTION public.procesar_evento_theoremreach(
  p_event_id TEXT, p_event_type TEXT, p_user_id TEXT, p_payload TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payload JSONB;
  v_data JSONB;
  v_tx JSONB;
  v_inserted TEXT;
  v_tx_id TEXT;
  v_user UUID;
  v_puntos NUMERIC;
  v_reverted INTEGER := 0;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Acceso denegado' USING ERRCODE = '42501';
  END IF;
  IF p_event_id IS NULL OR length(p_event_id) = 0 OR length(p_event_id) > 512
     OR p_event_type IS NULL OR p_event_type NOT IN ('reversal', 'ban', 'test')
     OR p_payload IS NULL OR octet_length(p_payload) > 262144 THEN
    RAISE EXCEPTION 'Evento inválido';
  END IF;
  v_payload := p_payload::JSONB;
  v_data := v_payload->'data';
  IF jsonb_typeof(v_data) IS DISTINCT FROM 'object'
     OR (v_data->>'event_type') IS DISTINCT FROM p_event_type
     OR (v_data->>'user_id') IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Datos del evento inconsistentes';
  END IF;
  IF p_event_type <> 'test' THEN
    IF p_user_id IS NULL OR p_user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Usuario inválido';
    END IF;
    v_user := p_user_id::UUID;
  END IF;

  -- La inserción y todos los efectos comparten transacción. Un fallo permite
  -- reintentar; dos entregas concurrentes no procesan el mismo evento dos veces.
  INSERT INTO public.theoremreach_eventos (event_id, event_type, usuario_id, payload, procesado)
  VALUES (p_event_id, p_event_type, p_user_id, v_payload, false)
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO v_inserted;
  IF v_inserted IS NULL THEN
    RETURN jsonb_build_object('success', true, 'estado', 'duplicado');
  END IF;

  IF p_event_type = 'ban' THEN
    INSERT INTO public.theoremreach_bloqueos (usuario_id, event_id)
    VALUES (p_user_id, p_event_id);
  ELSIF p_event_type = 'reversal' THEN
    IF jsonb_typeof(v_data->'reversed_transactions') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Falta reversed_transactions';
    END IF;
    IF jsonb_array_length(v_data->'reversed_transactions') NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'Cantidad de transacciones inválida';
    END IF;
    FOR v_tx IN
      SELECT elem FROM jsonb_array_elements(v_data->'reversed_transactions') AS t(elem)
      ORDER BY elem->>'transaction_id'
    LOOP
      v_tx_id := v_tx->>'transaction_id';
      IF v_tx_id IS NULL OR length(v_tx_id) = 0 OR length(v_tx_id) > 512 THEN
        RAISE EXCEPTION 'Transacción inválida';
      END IF;
      -- Si existe crédito, la operación usa sus puntos originales. El importe
      -- del proveedor permite registrar también reversos anteriores al crédito.
      v_puntos := abs((v_tx->>'amount_in_currency')::NUMERIC);
      IF v_puntos IS NULL OR v_puntos::TEXT IN ('NaN', 'Infinity', '-Infinity') OR v_puntos <= 0 THEN
        RAISE EXCEPTION 'Importe del reverso inválido';
      END IF;
      PERFORM public.procesar_postback_theoremreach(v_tx_id, v_user, v_puntos, true);
      v_reverted := v_reverted + 1;
    END LOOP;
  END IF;

  UPDATE public.theoremreach_eventos SET procesado = true WHERE event_id = p_event_id;
  RETURN jsonb_build_object('success', true, 'estado',
    CASE p_event_type WHEN 'ban' THEN 'ban_registrado'
      WHEN 'test' THEN 'test' ELSE 'reversado' END,
    'transacciones_procesadas', v_reverted);
END;
$$;
REVOKE ALL ON FUNCTION public.procesar_evento_theoremreach(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_evento_theoremreach(TEXT, TEXT, TEXT, TEXT)
  TO service_role;

COMMIT;