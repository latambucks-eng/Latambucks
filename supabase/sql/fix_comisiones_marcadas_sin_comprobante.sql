-- ============================================================
-- LatamBucks — FIX: filas marcadas "acreditadas" sin comprobante
-- ============================================================
-- PROBLEMA: 26 filas de comisiones_pendientes quedaron con acreditado=true
--   pero SIN fila equivalente en comisiones_referido (no se pagó nada, y los
--   patrocinadores involucrados no tenían saldo de referidos). Se marcaron
--   así en el lote del 26–29/09 (antes del arreglo "sin patrocinador").
--
-- EFECTO: los reportes contaban 798.2 puntos de comisiones pagadas cuando
--   sólo se acreditaron 35 (la única fila con comprobante en el libro:
--   tarea_externa_id = 1001219033081, sponsor ad1a4fb4…, 35 puntos).
--
-- SOLUCIÓN: marcar como descartadas (acreditado=false) todas las filas
--   acreditadas que no tienen comprobante. NO mueve ningún saldo: sólo
--   corrige el tiquete para que la contabilidad cuadre.
--
-- EJECUTAR en el SQL Editor de Supabase (una sola vez).
-- ============================================================

UPDATE public.comisiones_pendientes cp
SET acreditado = false
WHERE cp.acreditado = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.comisiones_referido cr
    WHERE cr.tarea_id = cp.tarea_externa_id
      AND cr.proveedor = cp.proveedor
  );

-- Verificación esperada (datos del 11/11/2026):
--   acreditadas = 1 (la de 35 puntos, con comprobante)
--   descartadas = 148
--   sin procesar = 0
SELECT
  count(*) FILTER (WHERE acreditado)        AS acreditadas,
  count(*) FILTER (WHERE NOT acreditado)    AS descartadas,
  count(*) FILTER (WHERE NOT procesado)      AS sin_procesar,
  count(*)                                   AS total
FROM public.comisiones_pendientes;