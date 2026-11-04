-- ============================================================
-- FIX DEFINITIVO: TODO REVERSO DESCUENTA SALDO
-- ============================================================
-- SÍNTOMA: había reversos registrados en historial_tareas que NO bajaban el
-- saldo del usuario.
--
-- CAUSA: el único descuento automático era un trigger de UPDATE
-- (trigger_descontar_saldo_reverso). Si el reverso entra como fila NUEVA ya
-- con estado = 'reversado' (ajustes, filas creadas por scripts, o un proveedor
-- que reporta el reverso como registro aparte), el trigger de UPDATE nunca se
-- dispara y el saldo queda intacto. Verificado en producción: insertar una
-- fila 'reversado' de 1 punto no descontaba nada.
--
-- FIX:
--   1) Trigger de UPDATE (ya existía): se recrea aceptando la lista de
--      proveedores cuyo reverso NO lo descuenta su propia función.
--   2) Trigger de INSERT (nuevo): si la fila nace 'reversado', descuenta.
--
-- TheoremReach y TimeWall quedan EXCLUIDOS a propósito: sus Edge Functions ya
-- descuentan con la RPC descontar_saldo_reverso (incluirlos descontaría doble).
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr varias veces.
-- ============================================================

BEGIN;

-- 1. Proveedores cuyo reverso debe descontar el trigger
--    (todo lo que NO sea theoremreach ni timewall).
CREATE OR REPLACE FUNCTION public.reverso_descuenta_por_trigger(p_proveedor TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_proveedor, '') IN (
    'cpx_research',
    'cpagrip',
    'tarea_local',
    'monetag_video',
    'caja_sorpresa',
    'bono_bienvenida'
  );
$$;

-- 2. Trigger de UPDATE: la fila pasa de 'aprobado' a 'reversado'
CREATE OR REPLACE FUNCTION public.descontar_saldo_on_reverso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'reversado'
     AND OLD.estado = 'aprobado'
     AND public.reverso_descuenta_por_trigger(NEW.proveedor)
     AND COALESCE(NEW.puntos_ganados, 0) <> 0 THEN
    -- Una sola implementación del descuento (disponible → pendiente → deuda).
    PERFORM public.descontar_saldo_reverso(NEW.usuario_id, abs(NEW.puntos_ganados));
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger de INSERT: el reverso se registra como fila nueva ya reversada
CREATE OR REPLACE FUNCTION public.descontar_saldo_on_reverso_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'reversado'
     AND public.reverso_descuenta_por_trigger(NEW.proveedor)
     AND COALESCE(NEW.puntos_ganados, 0) <> 0 THEN
    PERFORM public.descontar_saldo_reverso(NEW.usuario_id, abs(NEW.puntos_ganados));
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Crear / recrear los triggers
DROP TRIGGER IF EXISTS trigger_descontar_saldo_reverso ON public.historial_tareas;
CREATE TRIGGER trigger_descontar_saldo_reverso
  BEFORE UPDATE ON public.historial_tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_saldo_on_reverso();

DROP TRIGGER IF EXISTS trigger_descontar_saldo_reverso_insert ON public.historial_tareas;
CREATE TRIGGER trigger_descontar_saldo_reverso_insert
  BEFORE INSERT ON public.historial_tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_saldo_on_reverso_insert();

-- 5. Permisos: las funciones son SECURITY DEFINER, nadie debe ejecutarlas a mano
REVOKE EXECUTE ON FUNCTION public.descontar_saldo_on_reverso() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.descontar_saldo_on_reverso_insert() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reverso_descuenta_por_trigger(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_on_reverso() TO service_role;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_on_reverso_insert() TO service_role;
GRANT EXECUTE ON FUNCTION public.reverso_descuenta_por_trigger(TEXT) TO service_role, authenticated;

COMMIT;

-- ============================================================
-- VERIFICACIÓN 1: deben aparecer los DOS triggers
-- ============================================================
SELECT t.tgname AS trigger_name,
       CASE WHEN t.tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END AS momento,
       CASE WHEN t.tgtype & 4 = 4 THEN 'INSERT'
            WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
            ELSE 'otro' END AS evento
FROM pg_trigger t
WHERE t.tgrelid = 'public.historial_tareas'::regclass
  AND t.tgname LIKE 'trigger_descontar_saldo%';

-- ============================================================
-- VERIFICACIÓN 2: debe devolver true
-- ============================================================
SELECT public.reverso_descuenta_por_trigger('cpx_research') AS cpx,
       public.reverso_descuenta_por_trigger('timewall') AS timewall_debe_ser_false,
       public.reverso_descuenta_por_trigger('theoremreach') AS theoremreach_debe_ser_false;

-- ============================================================
-- DIAGNÓSTICO: cuentas cuyo saldo supera lo que ganaron (posibles reversos
-- sin descontar de antes de este fix). Revisar antes de tocar saldos: una
-- diferencia puede venir también de un retiro o de un ajuste manual.
-- ============================================================
-- WITH g AS (
--   SELECT usuario_id,
--          SUM(CASE WHEN estado = 'aprobado'  THEN COALESCE(puntos_ganados, 0) ELSE 0 END) AS aprobado,
--          SUM(CASE WHEN estado = 'reversado' THEN COALESCE(puntos_ganados, 0) ELSE 0 END) AS reversado
--   FROM public.historial_tareas
--   GROUP BY usuario_id
-- )
-- SELECT p.id,
--        ROUND(COALESCE(p.saldo_disponible, 0), 2) AS saldo,
--        ROUND(COALESCE(g.aprobado, 0) - COALESCE(g.reversado, 0), 2) AS ganado_neto,
--        ROUND(COALESCE(p.saldo_disponible, 0) - (COALESCE(g.aprobado, 0) - COALESCE(g.reversado, 0)), 2) AS diferencia
-- FROM public.perfiles p
-- LEFT JOIN g ON g.usuario_id = p.id
-- WHERE COALESCE(p.saldo_disponible, 0) - (COALESCE(g.aprobado, 0) - COALESCE(g.reversado, 0)) > 5
-- ORDER BY diferencia DESC;