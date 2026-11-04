-- ============================================================
-- LatamBucks — FIX 0028 (grupo adicional)
-- ============================================================
-- Estas 7 funciones NO son llamadas por el frontend (verificado en
-- src/lib/supabaseClient.js). Son triggers, helpers backend o el
-- webhook SQL de CPX. Se revoca EXECUTE a anon y public; solo
-- service_role puede ejecutarlas.
--
-- Usa un DO block que itera por proname para no depender de firmas
-- exactas (algunas son triggers sin args, otras con args).
-- Ejecutar en el SQL Editor de Supabase. Idempotente.
-- ============================================================

DO $$
DECLARE
  fn_names TEXT[] := ARRAY[
    'actualizar_puntos_perfil',
    'calcular_visitas_comision_latambucks',
    'capturar_ip_automatica_latambucks',
    'capturar_ip_y_dispositivo_latambucks',
    'check_acceso_prueba_tarea',
    'cpx_postback_webhook',
    'crear_perfil_automatico'
  ];
  fn_name TEXT;
  r RECORD;
BEGIN
  FOREACH fn_name IN ARRAY fn_names LOOP
    FOR r IN
      SELECT format('%I.%I(%s)', n.nspname, p.proname,
        pg_get_function_identity_arguments(p.oid)) AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fn_name
    LOOP
      -- Revocar de anon y PUBLIC
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
      -- Garantizar acceso al service_role (Edge Functions / backend)
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
      RAISE NOTICE 'Hardened: %', r.sig;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICACIÓN — debe devolver 0 filas
-- ============================================================
-- SELECT p.proname, r.rolname
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- JOIN pg_depend d
--   ON d.classid = 'pg_proc'::regclass AND d.objid = p.oid
--  AND d.deptype = 'X'
-- JOIN pg_authid r ON r.oid = d.refobjid
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'actualizar_puntos_perfil','calcular_visitas_comision_latambucks',
--     'capturar_ip_automatica_latambucks','capturar_ip_y_dispositivo_latambucks',
--     'check_acceso_prueba_tarea','cpx_postback_webhook','crear_perfil_automatico'
--   )
--   AND r.rolname = 'anon';