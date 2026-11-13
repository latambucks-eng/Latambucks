-- ============================================================
--  RECARGAS DE SALDO PUBLICITARIO
--  · Cripto (NOWPayments): automático, vía webhook firmado.
--  · PayPal Business (enlaces NCP): manual, con aprobación de admin.
--
--  Ambos métodos acreditan EXCLUSIVAMENTE en
--  public.perfiles.saldo_promocion (1 USD = 1.000 puntos).
--
--  NO se toca la lógica de campañas (activar_campana_con_saldo),
--  ni el cobro del 30%, ni el reintegro de cupos sobrantes
--  (reintegrar_saldo_campana): esas funciones quedan intactas.
--
--  La acreditación corre como owner (postgres) dentro de una RPC
--  SECURITY DEFINER, por lo que no la bloquea el trigger
--  lb_proteger_actualizacion_perfil (ese trigger solo bloquea
--  UPDATEs con current_user = 'authenticated').
--
--  Ejecutar TODO en el SQL Editor de Supabase. IDEMPOTENTE.
-- ============================================================

-- 1. Tabla de órdenes (la original de NOWPayments)
CREATE TABLE IF NOT EXISTS public.recargas_publicidad (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  monto_usd         numeric(12,2) NOT NULL CHECK (monto_usd > 0),
  puntos_promocion  numeric(12,2) NOT NULL CHECK (puntos_promocion > 0),
  payment_id        text UNIQUE,
  estado            text NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'completado', 'fallido')),
  creado_el         timestamptz NOT NULL DEFAULT now()
);

-- 1b. Columnas nuevas para el flujo manual de PayPal
ALTER TABLE public.recargas_publicidad
  ADD COLUMN IF NOT EXISTS metodo text NOT NULL DEFAULT 'nowpayments',
  ADD COLUMN IF NOT EXISTS comprobante_info text;

-- 1c. Integridad: método válido y, en PayPal, monto/puntos declarados
--     por el cliente no pueden ser inflados (siempre 1 USD = 1.000 pts).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recargas_metodo_chk'
  ) THEN
    ALTER TABLE public.recargas_publicidad
      ADD CONSTRAINT recargas_metodo_chk
      CHECK (metodo IN ('nowpayments', 'paypal'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recargas_paypal_chk'
  ) THEN
    ALTER TABLE public.recargas_publicidad
      ADD CONSTRAINT recargas_paypal_chk
      CHECK (
        metodo <> 'paypal' OR (
          monto_usd IN (5, 10, 20, 50, 100)
          AND puntos_promocion = monto_usd * 1000
          AND comprobante_info IS NOT NULL
          AND length(btrim(comprobante_info)) BETWEEN 4 AND 300
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recargas_publicidad_user
  ON public.recargas_publicidad (user_id, creado_el DESC);

CREATE INDEX IF NOT EXISTS idx_recargas_publicidad_pendientes
  ON public.recargas_publicidad (metodo, estado, creado_el ASC);

-- 2. RLS
ALTER TABLE public.recargas_publicidad ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve solo sus recargas
DROP POLICY IF EXISTS "recargas_select_propias" ON public.recargas_publicidad;
CREATE POLICY "recargas_select_propias" ON public.recargas_publicidad
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- El admin ve todas (para aprobar/rechazar las de PayPal)
DROP POLICY IF EXISTS "recargas_select_admin" ON public.recargas_publicidad;
CREATE POLICY "recargas_select_admin" ON public.recargas_publicidad
  FOR SELECT TO authenticated
  USING (COALESCE(public.is_admin(), false));

-- El usuario autenticado registra su solicitud de PayPal (y solo eso:
-- nunca puede escribir una orden de NOWPayments ni un estado distinto
-- de 'pendiente'). El UPDATE sigue reservado al service_role / RPCs.
DROP POLICY IF EXISTS "recargas_insert_paypal_propia" ON public.recargas_publicidad;
CREATE POLICY "recargas_insert_paypal_propia" ON public.recargas_publicidad
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND metodo = 'paypal'
    AND estado = 'pendiente'
    AND payment_id IS NULL
  );

-- 3. RPC de acreditación (idempotente) — usada por el webhook de
--    NOWPayments y por la aprobación manual de PayPal.
CREATE OR REPLACE FUNCTION public.acreditar_recarga_publicidad(
  p_order_id uuid,
  p_payment_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user   uuid;
  v_puntos numeric(12,2);
  v_estado text;
BEGIN
  -- Bloquea la fila de la orden durante toda la transacción
  SELECT user_id, puntos_promocion, estado
    INTO v_user, v_puntos, v_estado
  FROM public.recargas_publicidad
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Ya acreditada: no se suma dos veces
  IF v_estado = 'completado' THEN
    RETURN true;
  END IF;

  UPDATE public.recargas_publicidad
     SET estado = 'completado',
         payment_id = COALESCE(p_payment_id, payment_id)
   WHERE id = p_order_id;

  UPDATE public.perfiles
     SET saldo_promocion = COALESCE(saldo_promocion, 0) + v_puntos
   WHERE id = v_user;

  RETURN true;
END;
$$;

-- 4. Aprobación manual de una recarga PayPal (solo admins)
CREATE OR REPLACE FUNCTION public.aprobar_recarga_manual_admin(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metodo text;
  v_estado text;
  v_ok     boolean;
BEGIN
  IF auth.uid() IS NULL OR COALESCE(public.is_admin(), false) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores');
  END IF;

  SELECT metodo, estado
    INTO v_metodo, v_estado
  FROM public.recargas_publicidad
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'La solicitud no existe');
  END IF;

  IF v_metodo <> 'paypal' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No es una recarga PayPal');
  END IF;

  IF v_estado = 'completado' THEN
    RETURN jsonb_build_object('success', true, 'ya_acreditada', true);
  END IF;

  IF v_estado <> 'pendiente' THEN
    RETURN jsonb_build_object('success', false, 'error', 'La solicitud ya fue cerrada');
  END IF;

  -- Suma los puntos_promocion en perfiles.saldo_promocion (idempotente)
  v_ok := public.acreditar_recarga_publicidad(
    p_order_id,
    'paypal_manual_' || p_order_id::text
  );

  IF NOT v_ok THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se pudo acreditar la recarga');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. Rechazo manual de una recarga PayPal inválida (solo admins)
CREATE OR REPLACE FUNCTION public.rechazar_recarga_manual_admin(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metodo text;
BEGIN
  IF auth.uid() IS NULL OR COALESCE(public.is_admin(), false) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores');
  END IF;

  SELECT metodo INTO v_metodo
  FROM public.recargas_publicidad
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'La solicitud no existe');
  END IF;

  IF v_metodo <> 'paypal' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No es una recarga PayPal');
  END IF;

  UPDATE public.recargas_publicidad
     SET estado = 'fallido'
   WHERE id = p_order_id
     AND estado = 'pendiente';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'La solicitud ya fue cerrada');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Permisos
--    acreditar_* queda solo para service_role (webhook).
--    Las RPC de admin se exponen a authenticated, pero validan el rol adentro.
REVOKE ALL ON FUNCTION public.acreditar_recarga_publicidad(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acreditar_recarga_publicidad(uuid, text) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.acreditar_recarga_publicidad(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.aprobar_recarga_manual_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.aprobar_recarga_manual_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.rechazar_recarga_manual_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rechazar_recarga_manual_admin(uuid) TO authenticated;

-- 7. Verificación rápida
-- SELECT id, user_id, metodo, monto_usd, puntos_promocion, estado, comprobante_info, creado_el
-- FROM public.recargas_publicidad ORDER BY creado_el DESC LIMIT 20;
-- SELECT p.proname FROM pg_proc p
-- WHERE p.proname IN ('aprobar_recarga_manual_admin','rechazar_recarga_manual_admin');
