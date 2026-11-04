-- ============================================================
-- LatamBucks — Agregar 'rapidoreach' al CHECK de historial_tareas.proveedor
-- ============================================================
-- El webhook rapidoreach-webhook inserta en historial_tareas con
-- proveedor = 'rapidoreach', pero el CHECK constraint actual no lo
-- incluye → el INSERT falla con 23514 (check_violation) y la tarea
-- no queda registrada (el saldo sí se acredita porque
-- acreditar_saldo_usuario no valida el proveedor, pero el historial
-- y el anti-duplicados quedan rotos).
--
-- Esta migración recrea el constraint con 'rapidoreach' agregado a
-- la lista. DROP + ADD es idempotente ( DROP IF EXISTS ).
--
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.historial_tareas DROP CONSTRAINT IF EXISTS historial_tareas_proveedor_check;

ALTER TABLE public.historial_tareas ADD CONSTRAINT historial_tareas_proveedor_check
  CHECK (proveedor IN (
    'tarea_local',
    'monetag_video',
    'caja_sorpresa',
    'cpx_research',
    'theoremreach',
    'timewall',
    'bono_bienvenida',
    'cpagrip',
    'cpalead',
    'checkin_diario',
    'referido',
    'rapidoreach'
  ));

-- Verificación
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'historial_tareas'
  AND con.conname = 'historial_tareas_proveedor_check';