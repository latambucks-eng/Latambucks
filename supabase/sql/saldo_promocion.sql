-- ============================================================
-- Saldo de Promoción para Anunciantes
-- Gestiona el dinero invertido en campañas y reintegra cupos
-- sobrantes como saldo interno (no reembolsable, solo para
-- futuras campañas). Ver política de reembolsos en /reembolsos.
-- ============================================================

-- 1. Columna saldo_promocion en perfiles (billetera interna del anunciante)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS saldo_promocion numeric DEFAULT 0;

-- 2. Marca de reintegro en campanas_locales (evita doble reintegro)
ALTER TABLE public.campanas_locales ADD COLUMN IF NOT EXISTS reintegrado boolean DEFAULT false;

-- 2b. Marca de financiamiento en campanas_locales: true cuando la campaña se
-- creó usando el saldo_promocion del anunciante (flujo "Usar mi saldo" en
-- AnunciarAqui), false cuando se pagó por vía externa (comprobante). Solo
-- lectura/trazabilidad — no almacena saldo, el saldo vive en perfiles.
ALTER TABLE public.campanas_locales ADD COLUMN IF NOT EXISTS pago_con_saldo boolean DEFAULT false;

-- ============================================================
-- NOTA: La función reintegrar_saldo_campana(p_campana_id INTEGER)
-- está definida en migracion_supabase.sql. No redefinir aquí.
-- ============================================================