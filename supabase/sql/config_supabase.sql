-- ============================================================
-- CONFIG TABLE — Valores que antes vivían como secrets de Base44
-- ============================================================
-- EJECUTAR en el SQL Editor de Supabase.
-- Reemplaza los secrets USD_TO_ARS_RATE y PAYONEER_EMAIL que antes
-- se leían vía backend functions (que consumen créditos de integración).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Read: cualquier usuario autenticado
DROP POLICY IF EXISTS app_config_select ON public.app_config;
CREATE POLICY app_config_select ON public.app_config
  FOR SELECT TO authenticated USING (true);

-- Write: solo admin
DROP POLICY IF EXISTS app_config_insert ON public.app_config;
CREATE POLICY app_config_insert ON public.app_config
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS app_config_update ON public.app_config;
CREATE POLICY app_config_update ON public.app_config
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS app_config_delete ON public.app_config;
CREATE POLICY app_config_delete ON public.app_config
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- VALORES INICIALES — ACTUALIZAR con los valores reales
-- ============================================================
-- Estos son placeholders. Cambiar los valores por los reales
-- en el SQL Editor antes de ejecutar, o actualizarlos después
-- con un UPDATE desde el panel de admin.
-- NOTA: NO pegar aquí el valor real del secret PAYONEER_EMAIL (se configuró
-- aparte en los secrets de la plataforma). Este archivo es un script de
-- migración y no debe contener datos sensibles en el repositorio.

INSERT INTO public.app_config (key, value) VALUES
  ('usd_to_ars_rate', '1000'),
  ('payoneer_email', 'tu-email-payoneer@dominio.com')
ON CONFLICT (key) DO NOTHING;

-- Para actualizar los valores:
-- UPDATE public.app_config SET value = 'VALOR_REAL' WHERE key = 'usd_to_ars_rate';
-- UPDATE public.app_config SET value = 'EMAIL_REAL' WHERE key = 'payoneer_email';