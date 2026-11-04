-- ============================================================
-- TRIGGER: Descontar saldo automáticamente al reversar una tarea CPX
-- ============================================================
-- Este trigger descuenta los puntos del usuario cuando una tarea en
-- historial_tareas cambia de estado a 'reversado'.
-- SOLO se dispara para proveedor = 'cpx_research' para no interferir
-- con TheoremReach (que descuenta por su propia RPC) ni TimeWall.
-- Es la ÚNICA vía de descuento de CPX: la Edge Function cpx-postback NO
-- debe llamar también a descontar_saldo_reverso (descontaba el doble).
-- ============================================================

-- 1. Función del trigger (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.descontar_saldo_on_reverso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo descontar cuando:
  -- 1) El estado CAMBIA a 'reversado' (evita doble descuento)
  -- 2) El estado anterior era 'aprobado' (solo revertir tareas acreditadas)
  -- 3) El proveedor es 'cpx_research' (TheoremReach descuenta por su RPC)
  -- 4) Hay puntos reales que descontar (con NULL o 0 no se toca el saldo)
  IF NEW.estado = 'reversado' 
     AND OLD.estado = 'aprobado'
     AND NEW.proveedor = 'cpx_research'
     AND COALESCE(NEW.puntos_ganados, 0) <> 0 THEN
    -- Delegar en la RPC verificada: una sola implementación del descuento,
    -- la misma que usa TimeWall (disponible → pendiente → deuda).
    -- Antes se restaba a mano de saldo_disponible sin COALESCE: si el saldo
    -- era NULL lo dejaba en NULL, y con un retiro en proceso quedaba en
    -- negativo sin tocar saldo_pendiente.
    PERFORM public.descontar_saldo_reverso(NEW.usuario_id, abs(NEW.puntos_ganados));
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS trigger_descontar_saldo_reverso ON public.historial_tareas;
CREATE TRIGGER trigger_descontar_saldo_reverso
  BEFORE UPDATE ON public.historial_tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_saldo_on_reverso();

-- 3. Permisos: la función es SECURITY DEFINER, así que nadie debe poder
--    ejecutarla a mano (el trigger la invoca igual, sin necesitar EXECUTE).
REVOKE EXECUTE ON FUNCTION public.descontar_saldo_on_reverso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_on_reverso() TO service_role;

-- 4. Verificar que existe la RPC de la que depende el trigger
SELECT proname AS rpc_disponible FROM pg_proc WHERE proname = 'descontar_saldo_reverso';
SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'trigger_descontar_saldo_reverso';