-- ============================================================
-- LatamBucks — Security Advisor Fix (DINÁMICO)
-- ============================================================
-- Resuelve las advertencias del Security Advisor de Supabase
-- SIN romper ningún flujo del sitio.
--
-- Enfoque DINÁMICO: consulta pg_proc para revocar EXECUTE solo
-- sobre las funciones que REALMENTE EXISTEN en la base de datos.
-- No requiere conocer las firmas exactas de antemano.
--
-- EJECUTAR en el SQL Editor de Supabase (todo en orden).
-- ============================================================

-- ============================================================
-- 1. FIX: Function Search Path Mutable
-- ============================================================
-- procesar_comisiones_pendientes ya está definida con search_path
-- explícito en migracion_supabase.sql (versión JSONB que inserta en
-- comisiones_referido). NO redefinir aquí con la versión VOID vieja.

-- ============================================================
-- 2. REVOKE EXECUTE FROM PUBLIC en TODAS las funciones
--    SECURITY DEFINER del schema public (dinámico)
-- ============================================================
-- Recorre pg_proc y revoca EXECUTE de PUBLIC en cada función
-- SECURITY DEFINER que exista realmente. Si una función no existe,
-- simplemente no se procesa (no hay error).

DO $$
DECLARE
  fn_rec RECORD;
  fn_sig TEXT;
BEGIN
  FOR fn_rec IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true  -- SECURITY DEFINER
  LOOP
    fn_sig := format('%I.%s(%s)', 'public', fn_rec.proname, fn_rec.args);
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn_sig);
      RAISE NOTICE 'Revoked PUBLIC EXECUTE on %', fn_sig;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped % (error: %)', fn_sig, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================================
-- 3. REVOKE EXECUTE FROM authenticated en funciones que SOLO
--    usa pg_cron o service_role (dinámico)
-- ============================================================
-- Estas funciones NO se llaman desde el frontend. Se ejecutan vía
-- pg_cron (corre como postgres) o Base44 backend functions (service_role).
-- Revocar EXECUTE de authenticated es seguro.
--
-- Lista de nombres de funciones a revocar de authenticated:
-- (si no existen, se ignoran silenciosamente)
-- NOTA: auto_aprobar_tareas_vencidas NO se revoca porque el frontend
-- la llama vía PostgREST desde AdminTab y AnunciantePanel.

DO $$
DECLARE
  fn_names TEXT[] := ARRAY[
    'procesar_comisiones_pendientes',
    'liberar_saldos_pendientes_cron',
    'registrar_bono_bienvenida'
  ];
  fn_name TEXT;
  fn_rec RECORD;
  fn_sig TEXT;
BEGIN
  FOREACH fn_name IN ARRAY fn_names LOOP
    FOR fn_rec IN
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = fn_name
        AND p.prosecdef = true
    LOOP
      fn_sig := format('%I.%s(%s)', 'public', fn_rec.proname, fn_rec.args);
      BEGIN
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', fn_sig);
        RAISE NOTICE 'Revoked authenticated EXECUTE on %', fn_sig;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped % (error: %)', fn_sig, SQLERRM;
      END;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- 4. RE-GRANT EXECUTE TO authenticated en funciones que el frontend
--    llama vía PostgREST (necesarias para que la app funcione)
-- ============================================================
-- El paso 2 revocó EXECUTE de PUBLIC en TODAS las SECURITY DEFINER.
-- Sin este re-grant, el frontend recibe 403 en cada RPC.

DO $$
DECLARE
  fn_names TEXT[] := ARRAY[
    'is_admin',
    'get_user_email',
    'iniciar_sesion_video',
    'registrar_video_con_limite',
    'reclamar_checkin',
    'abrir_caja_sorpresa',
    'aprobar_prueba',
    'rechazar_prueba',
    'iniciar_disputa',
    'rechazar_retiro',
    'buscar_referido',
    'get_ganadores_recientes',
    'get_mis_referidos',
    'get_aviso_activo',
    'get_timewall_mantenimiento',
    'set_timewall_mantenimiento',
    'reintegrar_saldo_campana',
    'auto_aprobar_tareas_vencidas'
  ];
  fn_name TEXT;
  fn_rec RECORD;
  fn_sig TEXT;
BEGIN
  FOREACH fn_name IN ARRAY fn_names LOOP
    FOR fn_rec IN
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = fn_name
    LOOP
      fn_sig := format('%I.%s(%s)', 'public', fn_rec.proname, fn_rec.args);
      BEGIN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn_sig);
        RAISE NOTICE 'Granted authenticated EXECUTE on %', fn_sig;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped % (error: %)', fn_sig, SQLERRM;
      END;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- 5. Extensiones pg_net y http en schema public
-- ============================================================
-- NO se pueden mover: ALTER EXTENSION SET SCHEMA no es soportado.
-- DROP + CREATE rompería los jobs de pg_cron.
-- El riesgo es mínimo (pg_cron las usa como superuser).
-- → Advertencia conocida, no se puede resolver.

-- ============================================================
-- RESUMEN
-- ============================================================
-- ✅ Search Path Mutable: procesar_comisiones_pendientes (en migracion_supabase.sql)
-- ✅ Public Can Execute: TODAS las SECURITY DEFINER (revocado PUBLIC)
-- ✅ Signed-In Can Execute: 3 funciones solo pg_cron/service_role
-- ✅ Frontend RPCs: 18 funciones re-granted a authenticated
-- ⚠️ Extensiones pg_net / http: no se pueden mover
-- ============================================================