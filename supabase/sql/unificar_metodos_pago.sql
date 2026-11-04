-- ============================================================
-- LatamBucks — Unificación de métodos de pago (USD para todos)
-- ============================================================
-- Cambios:
-- 1. Agregar columna metodo_pago_preferido a perfiles
-- 2. Actualizar constraint de retiros.metodo_pago (agregar airtm, paypal)
-- 3. Actualizar cron job procesar-ciclo-facturacion para usar metodo_pago_preferido
-- 4. Agregar config de métodos de pago a app_config
--
-- EJECUTAR en el SQL Editor de Supabase (Ctrl+Enter)
-- ============================================================

-- 1. Agregar columna metodo_pago_preferido a perfiles
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS metodo_pago_preferido TEXT DEFAULT 'payoneer';

-- Migrar usuarios existentes: los de Argentina pasan a payoneer (ya no mercadopago)
UPDATE public.perfiles
SET metodo_pago_preferido = 'payoneer'
WHERE metodo_pago_preferido IS NULL OR metodo_pago_preferido = 'mercadopago';

-- 2. Actualizar constraint de retiros.metodo_pago
ALTER TABLE public.retiros DROP CONSTRAINT IF EXISTS retiros_metodo_pago_check;
ALTER TABLE public.retiros ADD CONSTRAINT retiros_metodo_pago_check
  CHECK (metodo_pago IN ('payoneer', 'airtm', 'paypal'));

-- 3. Actualizar cron job procesar-ciclo-facturacion
--    Usa metodo_pago_preferido del perfil en lugar de la lógica por país.
--    Jueves 16:00 Argentina (UTC-3) = 19:00 UTC → '0 19 * * 4'
SELECT cron.unschedule('procesar-ciclo-facturacion') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'procesar-ciclo-facturacion'
);
SELECT cron.schedule(
  'procesar-ciclo-facturacion',
  '0 19 * * 4',  -- Jueves 19:00 UTC = 16:00 Argentina
  $$
  SELECT count(*) FROM public.perfiles p
  WHERE p.saldo_disponible >= 5000
    AND COALESCE(p.retener_pagos, false) = false
    AND (
      p.ultimo_ciclo_procesado IS NULL
      OR p.ultimo_ciclo_procesado != (
        to_char(now() AT TIME ZONE 'America/Buenos_Aires', 'YYYY-MM-DD')
      )
    )
    AND public.procesar_ciclo_usuario(
      p.id,
      to_char(now() AT TIME ZONE 'America/Buenos_Aires', 'YYYY-MM-DD'),
      5000,
      COALESCE(p.metodo_pago_preferido, 'payoneer'),
      COALESCE(p.destino_pago, ''),
      COALESCE(p.titular_pago, '')
    ) = true
  $$
) AS success;  -- Renombra la columna de salida a "success"

-- 4. Config de métodos de pago en app_config
--    Los datos de las cuentas de pago (Payoneer, Airtm, PayPal) están
--    hardcodeados en el componente PaymentInstructions.jsx (fuente de
--    verdad para el usuario). NO se guardan en app_config para evitar
--    exponer identificadores de cuentas en archivos versionados.
--    Si en el futuro se necesita centralizarlos, cargarlos directamente
--    en el dashboard de Supabase (tabla app_config), nunca en SQL.
INSERT INTO public.app_config (key, value) VALUES
  ('paypal_fee_info', 'PayPal cobra una comisión estándar por recibir pagos por bienes y servicios. Tasa aproximada: 4.49% + tarifa fija (varía según el país). Consultá las comisiones vigentes en paypal.com/fees antes de elegir este método.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Limpiar claves obsoletas del esquema anterior (si existían)
DELETE FROM public.app_config WHERE key IN ('airtm_email', 'paypal_email', 'payoneer_email', 'airtm_username', 'paypal_me_link');

-- Verificación
-- SELECT key, value FROM app_config ORDER BY key;
-- SELECT proname FROM pg_proc WHERE proname = 'procesar_ciclo_usuario';