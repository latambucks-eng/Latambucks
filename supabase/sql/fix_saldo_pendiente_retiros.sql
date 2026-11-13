-- ============================================================
-- LatamBucks — FIX: el saldo pendiente se duplicaba en los retiros
-- ============================================================
-- PROBLEMA
--   Al crear un retiro, la RPC solicitar_retiro_canje mueve los puntos de
--   saldo_disponible → saldo_pendiente (correcto). Pero cuando el admin marca
--   ese retiro como "procesado" (pagado), NADIE resta esa cantidad de
--   saldo_pendiente: los triggers de este script no estaban creados en la base.
--   Resultado: el dinero ya pagado sigue contando como "saldo pendiente" y el
--   usuario ve el importe duplicado (una vez pagado y otra vez pendiente).
--
-- SOLUCIÓN
--   1) Crear (idempotente) el trigger que baja saldo_pendiente al pagarse.
--   2) Recalcular saldo_pendiente = suma de retiros en estado 'pendiente'.
--
-- EJECUTAR en el SQL Editor de Supabase. Idempotente: se puede correr de nuevo.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Trigger: bajar saldo_pendiente cuando el retiro se paga
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_retiro_pagado_bajar_pendiente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estados_finales text[] := ARRAY['procesado', 'pagado'];
BEGIN
  -- Solo cuando la fila ENTRA a un estado final de pago.
  IF NEW.estado = ANY (v_estados_finales)
     AND coalesce(OLD.estado, '') <> NEW.estado THEN
    UPDATE public.perfiles
       SET saldo_pendiente = greatest(
             0,
             coalesce(saldo_pendiente, 0) - coalesce(NEW.puntos_solicitados, 0)
           )
     WHERE id = NEW.user_id;
  END IF;

  -- Si el pago se revierte (vuelve a pendiente), el monto vuelve a pendiente.
  IF OLD.estado = ANY (v_estados_finales)
     AND NEW.estado = 'pendiente' THEN
    UPDATE public.perfiles
       SET saldo_pendiente = coalesce(saldo_pendiente, 0)
                           + coalesce(NEW.puntos_solicitados, 0)
     WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_retiro_pagado ON public.retiros;
CREATE TRIGGER trg_retiro_pagado
  AFTER UPDATE ON public.retiros
  FOR EACH ROW EXECUTE FUNCTION public.fn_retiro_pagado_bajar_pendiente();

-- ------------------------------------------------------------
-- 2. Recalcular el saldo pendiente de todos los usuarios
--    saldo_pendiente = suma de los retiros que siguen en 'pendiente'
-- ------------------------------------------------------------
UPDATE public.perfiles p
   SET saldo_pendiente = coalesce((
         SELECT sum(r.puntos_solicitados)
           FROM public.retiros r
          WHERE r.user_id = p.id
            AND r.estado = 'pendiente'
       ), 0)
 WHERE p.saldo_pendiente IS DISTINCT FROM coalesce((
         SELECT sum(r.puntos_solicitados)
           FROM public.retiros r
          WHERE r.user_id = p.id
            AND r.estado = 'pendiente'
       ), 0);

COMMIT;

-- ============================================================
-- VERIFICACIÓN 1: el trigger debe existir
-- ============================================================
SELECT t.tgname AS trigger_name, pg_get_triggerdef(t.oid) AS definicion
FROM pg_trigger t
WHERE t.tgrelid = 'public.retiros'::regclass
  AND t.tgname = 'trg_retiro_pagado';

-- ============================================================
-- VERIFICACIÓN 2: saldo_pendiente debe igualar los retiros pendientes
-- (devuelve 0 filas si todo quedó consistente)
-- ============================================================
SELECT p.id,
       p.saldo_pendiente,
       coalesce((
         SELECT sum(r.puntos_solicitados)
           FROM public.retiros r
          WHERE r.user_id = p.id AND r.estado = 'pendiente'
       ), 0) AS pendiente_real
FROM public.perfiles p
WHERE p.saldo_pendiente IS DISTINCT FROM coalesce((
        SELECT sum(r.puntos_solicitados)
          FROM public.retiros r
         WHERE r.user_id = p.id AND r.estado = 'pendiente'
      ), 0);
