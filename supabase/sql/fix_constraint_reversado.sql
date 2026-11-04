-- ============================================================
-- FIX: Permitir estado 'reversado' en historial_tareas
-- ------------------------------------------------------------
-- El CHECK constraint actual bloquea el UPDATE a estado='reversado'
-- que hace el postback de CPX Research (status=2 / chargeback).
-- Sin este fix, el reverso nunca se materializa y la comisión
-- pendiente se acredita incorrectamente a las 24h.
--
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Es idempotente (DROP IF EXISTS + ADD).
-- ============================================================

BEGIN;

-- 1) Eliminar el constraint viejo (cualquiera de los dos nombres posibles)
ALTER TABLE public.historial_tareas
  DROP CONSTRAINT IF EXISTS historial_tareas_estado_check;

ALTER TABLE public.historial_tareas
  DROP CONSTRAINT IF EXISTS historial_tareas_estado_check1;

-- 2) Recrear con 'reversado' incluido
ALTER TABLE public.historial_tareas
  ADD CONSTRAINT historial_tareas_estado_check
  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'reversado', 'expirado'));

-- 3) Verificación rápida (opcional, solo lectura)
-- Debe listar los 5 estados permitidos incluyendo 'reversado'.
SELECT pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'public.historial_tareas'::regclass
  AND conname = 'historial_tareas_estado_check';

COMMIT;

-- ============================================================
-- POST-FIX: Re-procesar los reversos que quedaron trabados
-- ------------------------------------------------------------
-- Después de aplicar el constraint, disparar de nuevo los
-- postbacks de CPX con status=2 (o ejecutar el UPDATE a mano
-- para los trans_id已知os). El cron de comisiones_pendientes
-- verá estado='reversado' y descartará la comisión (no la
-- acredita al sponsor).
--
-- Ejemplo manual para los dos trans_id de prueba:
-- ============================================================

-- UPDATE public.historial_tareas
--   SET estado = 'reversado'
--   WHERE tarea_externa_id IN ('1001219032675', '1001219038361')
--     AND proveedor = 'cpx_research'
--     AND estado = 'aprobado';
--
-- -- Descontar el saldo reversado (vía RPC atómica):
-- SELECT public.descontar_saldo_reverso(
--   'eb688586-bbc9-4e72-a24f-c3c260c38604'::uuid,
--   700
-- );