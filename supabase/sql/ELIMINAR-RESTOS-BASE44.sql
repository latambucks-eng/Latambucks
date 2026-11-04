-- ============================================================
-- LATAMBUCKS — ELIMINAR TODO RESTO DE BASE44 (dejar solo Supabase)
-- ============================================================
-- LO QUE MOSTRÓ TU VERIFICACIÓN
--   1. Siguen 2 trabajos de cobro duplicados:
--        · ciclo-facturacion-seguro-base44   ← resto de Base44
--        · latambucks_ciclo_facturacion      ← duplicado
--   2. "11 ejecuciones fallidas" (última 01/10 03:00) con nombre
--      desconocido: son las corridas de ese trabajo viejo de Base44.
--   3. En la base quedó una función llamada ejecutar_cron_base44. Esa es
--      la que el trabajo llama todas las semanas y por eso falla: intenta
--      avisar al backend de Base44, que ya no se usa.
--
-- QUÉ HACE ESTE SCRIPT
--   · Borra los trabajos que sobran (queda solo procesar-ciclo-facturacion)
--   · Borra la función ejecutar_cron_base44
--   · Borra también los "puentes" que quedaron de la migración Base44
--     (handle_functions_v1_bypass, verify_supabase_token_bypass,
--     get_encuestas_disponibles_bypass / _final, forzar_guardado_timewall).
--     Ninguna la usa la app ni las Edge Functions: se comprobó en el código
--     del repositorio — no hay una sola referencia.
--   · Al final muestra el estado: si quedó algo "base44", lo ves ahí.
--
-- Idempotente. Pegar TODO y ejecutar en Supabase → SQL Editor → Run.
-- ============================================================


-- ============================================================
-- 1) TRABAJOS PROGRAMADOS: fuera el de Base44 y el duplicado
--    (se muestran las filas afectadas; si no aparece ninguna, ya no existía)
-- ============================================================
-- Se borra con la forma que exista en tu versión de pg_cron y, si ninguna
-- funciona, directamente de la tabla de trabajos. Nada puede romper.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT jobid, jobname FROM cron.job
    WHERE jobname ILIKE '%base44%'
       OR jobname IN ('latambucks_ciclo_facturacion', 'ciclo_facturacion')
  LOOP
    BEGIN
      PERFORM cron.unschedule(r.jobname);
      RAISE NOTICE 'Eliminado: %', r.jobname;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        PERFORM cron.unschedule(r.jobid);
        RAISE NOTICE 'Eliminado (por número): %', r.jobname;
      EXCEPTION WHEN OTHERS THEN
        DELETE FROM cron.job WHERE jobid = r.jobid;
        RAISE NOTICE 'Eliminado (directo): %', r.jobname;
      END;
    END;
  END LOOP;
END $$;


-- ============================================================
-- 2) FUNCIONES: borrar la de Base44 y los puentes de la migración
--    Se borran por firma real (sirve para cualquier variante de parámetros).
--    Si alguna no se puede borrar porque otra cosa depende de ella, se
--    informa y se sigue con las demás.
-- ============================================================
DO $$
DECLARE
  r        record;
  v_nombre text;
  v_lista  text[] := ARRAY[
    'ejecutar_cron_base44',
    'handle_functions_v1_bypass',
    'verify_supabase_token_bypass',
    'get_encuestas_disponibles_bypass',
    'get_encuestas_disponibles_final',
    'forzar_guardado_timewall'
  ];
BEGIN
  FOR v_nombre IN SELECT unnest(v_lista)
  LOOP
    FOR r IN
      SELECT p.oid::regprocedure AS firma
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = v_nombre
    LOOP
      BEGIN
        EXECUTE format('DROP FUNCTION %s', r.firma);
        RAISE NOTICE 'Eliminada: %', r.firma;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo eliminar %: % (avísame y lo revisamos)', r.firma, SQLERRM;
      END;
    END LOOP;
  END LOOP;
END $$;


-- ============================================================
-- 3) ¿QUEDÓ ALGO CON NOMBRE "BASE44" EN TODA LA BASE?
--    Debe salir VACÍO. Revisa funciones, tablas, columnas, triggers,
--    políticas y trabajos.
-- ============================================================
SELECT 'función'  AS tipo, p.proname::text AS nombre
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname ILIKE '%base44%'
UNION ALL
SELECT 'tabla', c.relname::text
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname ILIKE '%base44%'
UNION ALL
SELECT 'columna', table_name || '.' || column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name ILIKE '%base44%'
UNION ALL
SELECT 'trigger', tgname::text
FROM pg_trigger WHERE tgname ILIKE '%base44%'
UNION ALL
SELECT 'política', policyname::text
FROM pg_policies WHERE policyname ILIKE '%base44%'
UNION ALL
SELECT 'trabajo automático', jobname::text
FROM cron.job WHERE jobname ILIKE '%base44%'
ORDER BY tipo, nombre;


-- ============================================================
-- 4) ESTADO FINAL DE LOS TRABAJOS AUTOMÁTICOS
--    Deben quedar exactamente 3:
--      · procesar-ciclo-facturacion        (jueves 19:00 UTC)
--      · auto-aprobar-tareas-vencidas      (cada hora)
--      · procesar-comisiones-pendientes    (cada hora)
-- ============================================================
SELECT jobname,
       schedule,
       active,
       command
FROM cron.job
ORDER BY schedule, jobname;