-- ============================================================
-- FIX: Recrear descontar_saldo_reverso (función de descuento por reverso)
-- ============================================================
-- PROBLEMA: La función fue modificada y ya no descuenta puntos del saldo.
-- Esta versión restaura la lógica original atómica con FOR UPDATE lock.
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Dropear la función modificada/rota
DROP FUNCTION IF EXISTS public.descontar_saldo_reverso(UUID, NUMERIC) CASCADE;

-- Recrear con la lógica original correcta
CREATE OR REPLACE FUNCTION public.descontar_saldo_reverso(
  p_user_id UUID,
  p_monto NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_disponible NUMERIC;
  v_pendiente NUMERIC;
  v_restante NUMERIC;
BEGIN
  -- Si el monto es 0 o negativo, no hay nada que descontar
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RETURN;
  END IF;

  -- Lock de fila para operación atómica
  SELECT COALESCE(saldo_disponible, 0), COALESCE(saldo_pendiente, 0)
    INTO v_disponible, v_pendiente
  FROM public.perfiles WHERE id = p_user_id FOR UPDATE;

  -- Si el usuario no existe, salir
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_restante := p_monto;

  -- 1. Descontar de saldo_disponible
  IF v_restante <= v_disponible THEN
    UPDATE public.perfiles
    SET saldo_disponible = v_disponible - v_restante
    WHERE id = p_user_id;
    RETURN;
  END IF;
  v_restante := v_restante - v_disponible;

  -- 2. Descontar de saldo_pendiente
  IF v_restante <= v_pendiente THEN
    UPDATE public.perfiles
    SET saldo_disponible = 0,
        saldo_pendiente = v_pendiente - v_restante
    WHERE id = p_user_id;
    RETURN;
  END IF;
  v_restante := v_restante - v_pendiente;

  -- 3. Deuda residual: saldo_disponible negativo
  UPDATE public.perfiles
  SET saldo_disponible = -v_restante,
      saldo_pendiente = 0
  WHERE id = p_user_id;
END;
$$;

-- Permisos: solo service_role puede ejecutar
ALTER FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) TO service_role;

-- ============================================================
-- También dropear la función rota aplicar_descuento_real_cpx
-- (ya no se usa después de este fix — la Edge Function vuelve a
-- usar descontar_saldo_reverso)
-- ============================================================
DROP FUNCTION IF EXISTS public.aplicar_descuento_real_cpx(UUID, NUMERIC) CASCADE;

-- ============================================================
-- VERIFICACIÓN: ejecutar después para confirmar que resta
-- ============================================================
-- SELECT public.descontar_saldo_reverso(
--   '4a84bf62-ccfd-4609-978c-277f780bef02'::uuid, 1
-- );
-- SELECT saldo_disponible FROM perfiles WHERE id = '4a84bf62-ccfd-4609-978c-277f780bef02';
-- (debe haber bajado 1 punto)