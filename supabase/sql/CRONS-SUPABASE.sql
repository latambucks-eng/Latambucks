-- ============================================================
-- LATAMBUCKS — TRABAJOS AUTOMÁTICOS 100% SUPABASE (pg_cron)
-- ============================================================
-- Este es el archivo definitivo de los horarios. Reemplaza cualquier
-- trabajo que hubiera quedado de la etapa Base44: acá no hay ninguna
-- llamada al backend viejo, todo es SQL que corre dentro de Supabase.
--
-- QUEDAN EXACTAMENTE 3 TRABAJOS:
--   1) procesar-ciclo-facturacion       jueves 19:00 UTC = 16:00 Argentina
--        Junta a todos los usuarios con $5 (5000 puntos) o más, que no
--        tengan retenidos los pagos, y les crea el retiro pendiente.
--   2) auto-aprobar-tareas-vencidas     cada hora
--        Aprueba las pruebas de tareas de anunciantes con más de 48 h sin
--        revisar, acredita el saldo, paga la comisión al referidor y
--        devuelve el saldo sobrante de las campañas que se quedaron sin cupos.
--   3) procesar-comisiones-pendientes   cada hora
--        Paga las comisiones de referidos con más de 24 h de antigüedad y
--        descarta las que el proveedor revirtió.
--
-- Idempotente: se puede ejecutar las veces que quieras. Borra y vuelve a
-- crear cada trabajo con el mismo nombre, así que nunca se duplican.
-- Pegar TODO en Supabase → SQL Editor → Run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1) COBRO SEMANAL (jueves 16:00 Argentina)
-- ============================================================
SELECT cron.unschedule('procesar-ciclo-facturacion')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'procesar-ciclo-facturacion');

SELECT cron.schedule(
  'procesar-ciclo-facturacion',
  '0 19 * * 4',   -- jueves 19:00 UTC = 16:00 en Argentina
  $$
  SELECT count(*) FROM public.perfiles p
  WHERE p.saldo_disponible >= 5000
    AND COALESCE(p.retener_pagos, false) = false
    AND (
      p.ultimo_ciclo_procesado IS NULL
      OR p.ultimo_ciclo_procesado != to_char(now() AT TIME ZONE 'America/Buenos_Aires', 'YYYY-MM-DD')
    )
    AND public.procesar_ciclo_usuario(
      p.id,
      to_char(now() AT TIME ZONE 'America/Buenos_Aires', 'YYYY-MM-DD'),
      5000,
      COALESCE(p.metodo_pago_preferido, 'payoneer'),
      COALESCE(p.destino_pago, ''),
      COALESCE(p.titular_pago, '')
    ) = true
  $$
);

-- ============================================================
-- 2) AUTO APROBAR TAREAS VENCIDAS (cada hora)
-- ============================================================
SELECT cron.unschedule('auto-aprobar-tareas-vencidas')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-aprobar-tareas-vencidas');

SELECT cron.schedule(
  'auto-aprobar-tareas-vencidas',
  '0 * * * *',
  $$SELECT public.auto_aprobar_tareas_vencidas();$$
);

-- ============================================================
-- 3) COMISIONES DE REFERIDOS (cada hora)
-- ============================================================
SELECT cron.unschedule('procesar-comisiones-pendientes')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'procesar-comisiones-pendientes');

SELECT cron.schedule(
  'procesar-comisiones-pendientes',
  '0 * * * *',
  $$SELECT public.procesar_comisiones_pendientes();$$
);

-- ============================================================
-- VERIFICACIÓN — deben aparecer exactamente estos 3, con active = true
-- ============================================================
SELECT jobname, schedule, active, command
FROM cron.job
ORDER BY schedule, jobname;