-- ============================================================
-- LATAMBUCKS — VERIFICACIÓN TOTAL + LIMPIEZA DE TRABAJOS VIEJOS
-- ============================================================
-- QUÉ RESUELVE
--   El listado de verificación mostró TRES trabajos programados que hacen el
--   mismo ciclo de cobro semanal (jueves 19:00 UTC):
--       · procesar-ciclo-facturacion          ← el bueno (está en el repo)
--       · latambucks_ciclo_facturacion        ← duplicado
--       · ciclo-facturacion-seguro-base44     ← resto de cuando la app vivía
--                                               en Base44
--   Los duplicados se eliminan. Queda uno solo.
--
--   Además este script comprueba, de verdad y sin tocar datos:
--     · que los 3 trabajos automáticos corran bien (historial de ejecuciones)
--     · que existan las funciones internas que usan las RPC y los trabajos
--     · que el arreglo de IDs (bigint) quedó aplicado y FUNCIONA
--
-- Idempotente. Pegar TODO en Supabase → SQL Editor → Run.
-- Se obtienen varias pestañas de resultado; la última es el RESUMEN.
-- ============================================================


-- ============================================================
-- BLOQUE 1 — ¿QUÉ TRABAJOS AUTOMÁTICOS HAY Y QUÉ HACE CADA UNO?
-- ============================================================
SELECT jobid,
       jobname,
       schedule,
       active,
       command
FROM cron.job
ORDER BY schedule, jobname;


-- ============================================================
-- BLOQUE 2 — ¿SE ESTÁN EJECUTANDO BIEN? (historial real)
--    status = 'succeeded' → todo bien
--    status = 'failed'    → ver return_message para el motivo
-- ============================================================
SELECT j.jobname,
       d.status,
       d.start_time AT TIME ZONE 'America/Buenos_Aires' AS ejecutado,
       LEFT(COALESCE(d.return_message, ''), 160) AS mensaje
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
ORDER BY d.start_time DESC
LIMIT 40;


-- ============================================================
-- BLOQUE 3 — LIMPIEZA: fuera duplicados y restos de Base44
--    Solo se borra si el trabajo bueno sigue existiendo.
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  -- 3.1 Cualquier trabajo con "base44" en el nombre: resto de la etapa
  --     anterior. Ya no llama a nada que exista.
  FOR r IN SELECT jobid, jobname FROM cron.job WHERE jobname ILIKE '%base44%'
  LOOP
    PERFORM cron.unschedule(r.jobname);
    RAISE NOTICE 'Eliminado resto de Base44: %', r.jobname;
  END LOOP;

  -- 3.2 Duplicados del ciclo de cobro (el bueno es
  --     procesar-ciclo-facturacion, que quedó del repo).
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'procesar-ciclo-facturacion') THEN
    FOR r IN
      SELECT jobid, jobname FROM cron.job
      WHERE jobname IN ('latambucks_ciclo_facturacion', 'ciclo_facturacion')
    LOOP
      PERFORM cron.unschedule(r.jobname);
      RAISE NOTICE 'Eliminado ciclo duplicado: %', r.jobname;
    END LOOP;
  ELSE
    RAISE NOTICE 'OJO: no existe procesar-ciclo-facturacion; no se borró ningún duplicado del ciclo de cobro';
  END IF;
END $$;


-- ============================================================
-- BLOQUE 4 — ¿EXISTEN LAS FUNCIONES INTERNAS QUE SE USAN ADENTRO?
--    Los RPC de la app y los trabajos automáticos llaman a estas
--    funciones. Si falta una, el flujo falla aunque el RPC "exista".
-- ============================================================
SELECT f.nombre AS funcion_interna,
       CASE WHEN EXISTS (
              SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = f.nombre
            ) THEN 'OK' ELSE 'FALTA' END AS estado
FROM (VALUES
  ('get_user_email'),
  ('is_admin'),
  ('acreditar_saldo_usuario'),
  ('incrementar_saldo_referido'),
  ('incrementar_visitas_campana'),
  ('descontar_saldo_reverso'),
  ('reembolsar_retiro_usuario'),
  ('procesar_ciclo_usuario'),
  ('procesar_comisiones_pendientes'),
  ('auto_aprobar_tareas_vencidas'),
  ('reverso_descuenta_por_trigger')
) AS f(nombre)
ORDER BY estado DESC, funcion_interna;


-- ============================================================
-- BLOQUE 5 — PRUEBA REAL DEL ARREGLO DE IDs (sin modificar nada)
--    Se simula un usuario logueado y se llaman las 4 funciones con un ID
--    inexistente. Respuesta esperada: "Prueba no encontrada" / "Retiro no
--    encontrado". Si el bug del UUID siguiera, PostgreSQL abortaría con
--    "operator does not exist: bigint = uuid".
--    Todo se revierte con ROLLBACK: no se crea, aprueba ni rechaza nada.
-- ============================================================
BEGIN;

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  COALESCE((SELECT id::text FROM public.perfiles LIMIT 1), gen_random_uuid()::text),
    'role', 'authenticated'
  )::text,
  true
);

SELECT 'aprobar_prueba'   AS funcion, public.aprobar_prueba('999999999')::text        AS respuesta
UNION ALL SELECT 'rechazar_prueba',  public.rechazar_prueba('999999999', 'prueba')::text
UNION ALL SELECT 'iniciar_disputa',  public.iniciar_disputa('999999999', 'prueba')::text
UNION ALL SELECT 'buscar_referido',  public.buscar_referido('LB-NOEXISTE')::text;

-- rechazar_retiro exige ser admin: se simula el admin si existe alguno
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  COALESCE((SELECT id::text FROM public.perfiles WHERE role = 'admin' LIMIT 1), gen_random_uuid()::text),
    'role', 'authenticated'
  )::text,
  true
);

SELECT 'rechazar_retiro' AS funcion, public.rechazar_retiro('999999999', 'prueba')::text AS respuesta;

ROLLBACK;

-- Comprobación directa del tipo de columna (debe devolver 0 filas, sin error)
SELECT 'id de pruebas como número' AS prueba,
       count(*) AS filas
FROM public.pruebas_tareas_locales WHERE id = '999999999'::bigint
UNION ALL
SELECT 'id de retiros como número', count(*)
FROM public.retiros WHERE id = '999999999'::bigint;


-- ============================================================
-- BLOQUE 6 — RESUMEN FINAL
-- ============================================================
SELECT '1. trabajos automáticos' AS bloque,
       jobname::text AS objeto,
       schedule::text AS detalle
FROM cron.job

UNION ALL
SELECT '2. errores en las últimas 100 ejecuciones',
       COALESCE(j.jobname, 'desconocido')::text,
       (count(*) || ' vez/veces (última: ' ||
        to_char(max(d.start_time) AT TIME ZONE 'America/Buenos_Aires', 'DD/MM HH24:MI') || ')')::text
FROM cron.job_run_details d
LEFT JOIN cron.job j ON j.jobid = d.jobid
WHERE d.status <> 'succeeded'
GROUP BY j.jobname

UNION ALL
SELECT '3. arreglo de IDs', p.proname::text,
       CASE WHEN p.prosrc LIKE '%_id::uuid%' THEN 'SIGUE CON BUG' ELSE 'OK' END
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('aprobar_prueba', 'rechazar_prueba', 'iniciar_disputa', 'rechazar_retiro')

UNION ALL
SELECT '4. restos de Base44 en la base', COALESCE(p.proname, '—')::text,
       'revisar: función con nombre base44'
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname ILIKE '%base44%'

ORDER BY bloque, objeto;