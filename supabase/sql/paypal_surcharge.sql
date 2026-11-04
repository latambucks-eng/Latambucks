-- ============================================================
-- LatamBucks — Recargo de PayPal para anunciantes
-- ============================================================
-- El anunciante que paga con PayPal absorbe la comisión de procesamiento
-- de PayPal, además del 30% de comisión de la plataforma.
--
-- Fórmula: si el anunciante quiere invertir `monto` USD (base), el total
-- a cobrar para que la plataforma reciba `monto` neto tras PayPal es:
--   X = (monto + tarifa_fija) / (1 - tasa)
--   recargo = X - monto
--
-- El reintegro de saldo_promocion NO devuelve ni el 30% de comisión del
-- sitio ni el recargo de PayPal: solo devuelve el 70% del monto base por
-- cupo sobrante (la lógica existente en reintegrar_saldo_campana ya hace
-- esto correctamente, no se modifica).
--
-- EJECUTAR en el SQL Editor de Supabase. Idempotente.
-- ============================================================

-- 1) Columna para registrar el recargo de PayPal cobrado al anunciante
ALTER TABLE public.campanas_locales
  ADD COLUMN IF NOT EXISTS paypal_surcharge NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.campanas_locales.paypal_surcharge IS 'Recargo de PayPal cobrado al anunciante (tarifa de procesamiento). No se reembolsa al reintegrar saldo.';

-- 2) Configuración de la tarifa de PayPal en app_config
--    tasa: porcentaje que cobra PayPal (4.49% = 0.0449)
--    tarifa_fija: monto fijo por transacción (USD 0.30)
INSERT INTO public.app_config (key, value) VALUES
  ('paypal_fee_rate', '0.0449'),
  ('paypal_fee_fixed', '0.30')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3) Verificación (opcional — descomentar para revisar)
-- SELECT key, value FROM app_config WHERE key LIKE 'paypal%' ORDER BY key;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'campanas_locales' AND column_name = 'paypal_surcharge';