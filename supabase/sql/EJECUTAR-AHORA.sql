-- ============================================================
-- LATAMBUCKS — LO ÚNICO QUE FALTA EJECUTAR
-- ============================================================
-- Auditoría del 02/11/2026 contra la base de producción (proyecto real).
-- Ya está aplicado y verificado funcionando:
--   * tablas, columnas y triggers (bono de bienvenida 500 pts, giros, reversos,
--     protección de saldo y de rol, seguridad de retiros)
--   * todas las funciones que usa la app (caja sorpresa, check-in, videos,
--     referidos, campañas, tragamonedas, avisos, admin, TimeWall)
--   * permisos por fila (RLS): cada usuario ve solo lo suyo y NO puede
--     cambiarse el saldo ni el rol
--   * buckets de archivos: capturas-tareas, comprobantes-pagos
--   * las 12 Edge Functions responden
--
-- ESTE SCRIPT corrige los 3 puntos que quedaron pendientes:
--   1) función vieja que devuelve error 500
--   2) una función interna de "bypass" que un usuario logueado podía invocar
--   3) los 3 trabajos automáticos (cron) — se crean si no existen
--
-- Es idempotente: se puede correr las veces que quieras.
-- Pegar TODO en Supabase → SQL Editor → Run.
--
-- ORDEN RECOMENDADO DE EJECUCIÓN:
--   1) FIX_RPC_IDS_BIGINT.sql  (arregla aprobar/rechazar tareas, disputas y
--      rechazo de retiros — hoy fallan siempre)
--   2) Este archivo
-- ============================================================

BEGIN;

-- ============================================================
-- 1) LIMPIEZA: función legacy rota (devolvía HTTP 500)
--    Nada la usa: la pestaña Encuestas trabaja con la Edge Function
--    get-encuestas-disponibles.
-- ============================================================
DROP FUNCTION IF EXISTS public.get_encuestas_disponibles_final(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_encuestas_disponibles_bypass() CASCADE;

-- ============================================================
-- 2) SEGURIDAD: cerrar las funciones internas de bypass
--    handle_functions_v1_bypass() era ejecutable por cualquier usuario
--    logueado (se comprobó: respondía 500 en vez de "no existe").
--    Quedan solo para service_role (las Edge Functions siguen funcionando).
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'handle_functions_v1_bypass',
        'verify_supabase_token_bypass',
        'get_encuestas_disponibles_bypass',
        'forzar_guardado_timewall'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
  END LOOP;
END $$;

-- ============================================================
-- 3) TRABAJOS AUTOMÁTICOS (pg_cron)
--    Sin estos, nada acredita solo: ni las tareas aprobadas a las 48 h,
--    ni las comisiones de referidos, ni el ciclo de cobro semanal.
--    Se recrean con el mismo nombre, así que no se duplican.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3.1 Comisiones de referidos — cada hora
SELECT cron.unschedule('procesar-comisiones-pendientes')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'procesar-comisiones-pendientes');
SELECT cron.schedule(
  'procesar-comisiones-pendientes',
  '0 * * * *',
  $$SELECT public.procesar_comisiones_pendientes();$$
);

-- 3.2 Tareas vencidas (48 h) → aprobadas — cada hora
SELECT cron.unschedule('auto-aprobar-tareas-vencidas')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-aprobar-tareas-vencidas');
SELECT cron.schedule(
  'auto-aprobar-tareas-vencidas',
  '0 * * * *',
  $$SELECT public.auto_aprobar_tareas_vencidas();$$
);

-- 3.3 Ciclo de facturación/retiro automático — jueves 19:00 UTC (16:00 Argentina)
SELECT cron.unschedule('procesar-ciclo-facturacion')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'procesar-ciclo-facturacion');
SELECT cron.schedule(
  'procesar-ciclo-facturacion',
  '0 19 * * 4',
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

COMMIT;

-- ============================================================
-- 4) VERIFICACIÓN — un solo resultado con todo el estado
-- ============================================================
SELECT * FROM (
  -- trabajos automáticos
  SELECT '1. cron activo'::text AS bloque, jobname::text AS objeto,
         schedule::text AS detalle
  FROM cron.job

  UNION ALL
  -- triggers clave
  SELECT '2. trigger', t.tgname::text,
         CASE WHEN t.tgrelid = 'public.historial_tareas'::regclass
              THEN 'historial_tareas' ELSE 'perfiles' END
  FROM pg_trigger t
  WHERE NOT t.tgisinternal
    AND (t.tgname LIKE 'trigger_descontar_saldo%'
      OR t.tgname LIKE '%bono_bienvenida%'
      OR t.tgname LIKE '%proteger%')

  UNION ALL
  -- funciones que usa la app
  SELECT '3. función app', f.nombre::text,
         CASE WHEN EXISTS (SELECT 1 FROM pg_proc p
                           JOIN pg_namespace n ON n.oid = p.pronamespace
                           WHERE n.nspname = 'public' AND p.proname = f.nombre)
              THEN 'OK' ELSE 'FALTA' END
  FROM (VALUES
    ('abrir_caja_sorpresa'), ('reclamar_checkin'), ('iniciar_sesion_video'),
    ('registrar_video_con_limite'), ('buscar_referido'), ('registrar_referido_pro'),
    ('get_mis_referidos'), ('get_aviso_activo'), ('is_admin'),
    ('aprobar_prueba'), ('rechazar_prueba'), ('iniciar_disputa'),
    ('rechazar_retiro'), ('administrar_estado_campana'), ('reintegrar_saldo_campana'),
    ('activar_campana_con_saldo'), ('procesar_giro_tragamonedas'),
    ('get_ganadores_recientes'), ('get_timewall_mantenimiento'),
    ('set_timewall_mantenimiento'), ('auto_aprobar_tareas_vencidas'),
    ('procesar_comisiones_pendientes')
  ) AS f(nombre)

  UNION ALL
  -- el bypass quedó cerrado
  SELECT '4. seguridad', p.proname::text,
         CASE WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE')
              THEN 'ABIERTA (revisar)' ELSE 'cerrada' END
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('handle_functions_v1_bypass', 'verify_supabase_token_bypass')

  UNION ALL
  -- la función rota ya no existe
  SELECT '5. limpieza', 'get_encuestas_disponibles_final',
         CASE WHEN EXISTS (SELECT 1 FROM pg_proc p
                           JOIN pg_namespace n ON n.oid = p.pronamespace
                           WHERE n.nspname = 'public'
                             AND p.proname = 'get_encuestas_disponibles_final')
              THEN 'SIGUE (revisar)' ELSE 'eliminada' END
) AS v
ORDER BY bloque, objeto;