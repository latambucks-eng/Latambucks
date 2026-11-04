-- ============================================================
-- LatamBucks — Columna saldo_bono + ajuste de retiros
-- ============================================================
-- saldo_bono es un TRACKER (no un pool separado): indica cuántos
-- puntos del saldo_disponible del usuario provienen del bono de
-- bienvenida que aún no fueron consumidos. Se usa para eximir esa
-- porción del 30% de comisión al crear campañas con saldo.
--
-- El bono se acredita en saldo_disponible (retirable) Y se registra
-- en saldo_bono (tracker). Al crear una campaña, activar_campana_
-- con_saldo consume primero la porción de saldo_bono (sin comisión)
-- y luego el resto (con 30% de comisión).
--
-- Al retirar (procesar_ciclo_usuario), se reinicia saldo_bono a 0
-- porque el bono se está retirando y ya no se puede usar para
-- eximir comisiones futuras.
--
-- EJECUTAR en el SQL Editor de Supabase. Idempotente.
-- ============================================================

-- 1. Columna saldo_bono en perfiles (tracker del bono de bienvenida)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS saldo_bono numeric DEFAULT 0;

COMMENT ON COLUMN perfiles.saldo_bono IS 'Tracker de cuánto del bono de bienvenida queda en saldo_disponible sin consumir. Se consume primero al crear campañas (sin 30% de comisión). Se reinicia a 0 al retirar.';

-- 2. Migración única: para usuarios existentes que ya recibieron el bono
--    en saldo_disponible pero no tienen saldo_bono seteado.
--    Solo ejecutar si hay usuarios con bono_bienvenida en historial_tareas
--    y saldo_bono = 0. Verifica antes de ejecutar.
-- ============================================================
-- DO $$
-- DECLARE
--   r RECORD;
-- BEGIN
--   FOR r IN
--     SELECT usuario_id FROM public.historial_tareas
--     WHERE proveedor = 'bono_bienvenida' AND estado = 'aprobado'
--   LOOP
--     UPDATE public.perfiles
--     SET saldo_bono = 500
--     WHERE id = r.usuario_id AND COALESCE(saldo_bono, 0) = 0;
--   END LOOP;
-- END;
-- $$;
-- ============================================================

-- 3. Modificar procesar_ciclo_usuario: al retirar todo el saldo_disponible,
--    reiniciar saldo_bono a 0 (el bono se está retirando).
CREATE OR REPLACE FUNCTION public.procesar_ciclo_usuario(
  p_user_id UUID,
  p_marker TEXT,
  p_min_points NUMERIC,
  p_metodo_pago TEXT,
  p_detalles TEXT,
  p_titular TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo NUMERIC;
  v_retener BOOLEAN;
  v_ultimo_ciclo TEXT;
BEGIN
  SELECT saldo_disponible, retener_pagos, ultimo_ciclo_procesado
    INTO v_saldo, v_retener, v_ultimo_ciclo
  FROM public.perfiles WHERE id = p_user_id FOR UPDATE;

  IF v_ultimo_ciclo = p_marker THEN RETURN FALSE; END IF;
  IF v_retener THEN RETURN FALSE; END IF;
  IF v_saldo IS NULL OR v_saldo < p_min_points THEN RETURN FALSE; END IF;

  INSERT INTO public.retiros (user_id, puntos_solicitados, metodo_pago, detalles_pago, titular_nombre, estado)
  VALUES (p_user_id, v_saldo, p_metodo_pago, p_detalles, p_titular, 'pendiente');

  UPDATE public.perfiles
  SET saldo_disponible = 0,
      saldo_bono = 0,
      saldo_pendiente = COALESCE(saldo_pendiente, 0) + v_saldo,
      ultimo_ciclo_procesado = p_marker
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Verificación
SELECT column_name FROM information_schema.columns
WHERE table_name = 'perfiles' AND column_name = 'saldo_bono';