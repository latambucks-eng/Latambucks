-- ============================================================
-- LatamBucks — Sesiones TheoremReach (transaction_id → user_id)
-- ============================================================
-- EJECUTAR en el SQL Editor de Supabase. Auto-contenido e idempotente.
--
-- POR QUÉ EXISTE:
--   El callback (postback) de TheoremReach NO envía {user_id} de forma
--   garantizada (solo llega si la URL del callback en el dashboard de TR
--   incluye el variable {user_id}; el ejemplo de producción por defecto es
--   `?transaction_id=&currency=&reward=&partner_id=&hash=` sin user_id).
--   Como la app genera un transaction_id aleatorio por entrada y nunca
--   persistía la relación transaction_id → user_id, cuando TR devolvía el
--   postback no había forma de saber a qué usuario acreditarle → el código
--   cortaba en "faltan parámetros" y respondía OK sin acreditar nada
--   (por eso el proveedor lo ve "en verde" pero no llegan los puntos).
--
--   Esta tabla guarda la sesión al abrir el offerwall: el Edge Function
--   get-theoremreach-url inserta aquí { transaction_id, user_id } cuando
--   construye la URL firmada. El Edge Function theoremreach-postback luego
--   resuelve el user_id a partir del transaction_id que recibe.
--
--   RLS: sin policies = denegación total para frontend (service_role bypass).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sesiones_theoremreach (
  transaction_id TEXT PRIMARY KEY,
  usuario_id UUID NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  completada BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.sesiones_theoremreach ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sesiones_theoremreach FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.sesiones_theoremreach TO service_role;
-- Sin policies: solo service_role (Edge Functions) puede leer/escribir.

-- Crear un índice para resolver rápido por usuario si hiciera falta
CREATE INDEX IF NOT EXISTS idx_sesiones_tr_usuario
  ON public.sesiones_theoremreach (usuario_id);

-- ============================================================
-- RPC — registrar_sesion_theoremreach
-- ============================================================
-- Inserta la sesión transaction_id → user_id (upsert idempotente).
-- Lo usa get-theoremreach-url con service_role al abrir el offerwall.
-- Devuelve JSONB de confirmación.
CREATE OR REPLACE FUNCTION public.registrar_sesion_theoremreach(
  p_transaction_id TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body$
BEGIN
  IF p_transaction_id IS NULL OR p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Parámetros incompletos');
  END IF;

  INSERT INTO public.sesiones_theoremreach (transaction_id, usuario_id)
  VALUES (p_transaction_id, p_user_id)
  ON CONFLICT (transaction_id) DO UPDATE SET usuario_id = EXCLUDED.usuario_id;

  RETURN json_build_object('success', true, 'transaction_id', p_transaction_id);
END;
$body$;
REVOKE ALL ON FUNCTION public.registrar_sesion_theoremreach(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_sesion_theoremreach(TEXT, UUID)
  TO service_role;

-- ============================================================
-- RPC — resolver_usuario_theoremreach
-- ============================================================
-- Resuelve el user_id a partir del transaction_id de un postback.
-- Lo usa theoremreach-postback con service_role.
-- Devuelve { user_id } o { error }.
CREATE OR REPLACE FUNCTION public.resolver_usuario_theoremreach(
  p_transaction_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_transaction_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'transaction_id requerido');
  END IF;

  SELECT usuario_id INTO v_user_id
  FROM public.sesiones_theoremreach
  WHERE transaction_id = p_transaction_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sesión no encontrada');
  END IF;

  RETURN json_build_object('success', true, 'user_id', v_user_id::text);
END;
$body$;
REVOKE ALL ON FUNCTION public.resolver_usuario_theoremreach(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_usuario_theoremreach(TEXT)
  TO service_role;