-- ============================================================
-- LatamBucks — Backfill saldo_bono para usuarios existentes
-- ============================================================
-- PROBLEMA detectado: 61 usuarios tienen bono_bienvenida en
-- historial_tareas pero saldo_bono = 0 en todos. Esto significa que
-- el trigger registrar_bono_bienvenida() era la versión VIEJA cuando
-- se registraron (solo acreditaba saldo_disponible, no saldo_bono).
--
-- Este script reconstruye saldo_bono para los usuarios existentes:
--   - Si NUNCA retiraron (ultimo_ciclo_procesado IS NULL): el bono
--     sigue en saldo_disponible, así que saldo_bono = LEAST(500, saldo_disponible).
--   - Si YA retiraron (ultimo_ciclo_procesado IS NOT NULL): el bono
--     ya se retiró, saldo_bono = 0 (sin exención falsa).
--
-- PRE-REQUISITO: ejecutar bono_bienvenida.sql (trigger actualizado)
-- PRIMERO, para que los nuevos registros sí acrediten saldo_bono.
--
-- EJECUTAR en el SQL Editor de Supabase. Idempotente.
-- ============================================================

-- 0. Verificación previa (cuántos necesitan backfill)
SELECT count(*) AS usuarios_sin_tracker
FROM public.perfiles p
WHERE EXISTS (
  SELECT 1 FROM public.historial_tareas h
  WHERE h.usuario_id = p.id
    AND h.proveedor = 'bono_bienvenida'
    AND h.estado = 'aprobado'
)
AND COALESCE(p.saldo_bono, 0) = 0;

-- 1. Backfill: setear saldo_bono solo para usuarios que recibieron el
--    bono, nunca retiraron, y todavía tienen saldo_disponible >= 1.
--    Cap a 500 (el bono original) o saldo_disponible si es menor.
UPDATE public.perfiles p
SET saldo_bono = LEAST(500, COALESCE(p.saldo_disponible, 0))
WHERE EXISTS (
  SELECT 1 FROM public.historial_tareas h
  WHERE h.usuario_id = p.id
    AND h.proveedor = 'bono_bienvenida'
    AND h.estado = 'aprobado'
)
AND COALESCE(p.saldo_bono, 0) = 0
AND p.ultimo_ciclo_procesado IS NULL
AND COALESCE(p.saldo_disponible, 0) > 0;

-- 2. Verificación posterior (cuántos quedaron con tracker)
SELECT count(*) AS usuarios_con_tracker,
       count(*) FILTER (WHERE saldo_bono = 500) AS con_bono_completo
FROM public.perfiles
WHERE saldo_bono > 0;

-- ============================================================
-- NOTA: Los usuarios que ya retiraron (ultimo_ciclo_procesado NOT NULL)
-- NO reciben backfill porque su bono ya salió de la plataforma.
-- El nuevo procesar_ciclo_usuario (de saldo_bono_columna.sql) ya
-- reinicia saldo_bono = 0 al retirar, así que los futuros retiros
-- limpiarán el tracker correctamente.
-- ============================================================