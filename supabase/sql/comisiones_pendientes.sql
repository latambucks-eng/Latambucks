-- ============================================================
-- LatamBucks — Comisiones Pendientes (retención 24h para encuestas)
-- ============================================================
-- Tabla para retener comisiones de encuestas (CPX, TheoremReach, TimeWall)
-- 24 horas antes de acreditarlas al patrocinador. Esto permite detectar
-- reversiones por fraude/rechazo del proveedor antes de pagar la comisión.
--
-- La función procesar_comisiones_pendientes() y el pg_cron job están
-- definidos en migracion_supabase.sql (versión JSONB que inserta en
-- comisiones_referido). NO redefinir aquí para evitar sobreescribir.
--
-- EJECUTAR en el SQL Editor de Supabase.
-- ============================================================

-- 1. Tabla de comisiones pendientes
CREATE TABLE IF NOT EXISTS public.comisiones_pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  tarea_externa_id TEXT NOT NULL,
  proveedor TEXT NOT NULL,
  puntos_tarea NUMERIC NOT NULL,
  comision_estimada NUMERIC NOT NULL,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  procesado BOOLEAN NOT NULL DEFAULT false,
  procesado_el TIMESTAMPTZ,
  acreditado BOOLEAN,
  UNIQUE(tarea_externa_id, proveedor)
);

ALTER TABLE public.comisiones_pendientes ENABLE ROW LEVEL SECURITY;
-- Sin policies: acceso denegado para frontend. service_role bypass.

-- ============================================================
-- NOTA: La función procesar_comisiones_pendientes() y el pg_cron job
-- están definidos en migracion_supabase.sql. No redefinir aquí.
-- ============================================================