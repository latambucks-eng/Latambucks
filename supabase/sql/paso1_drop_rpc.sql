-- ============================================================
-- LatamBucks — FIX FINAL RPC ganadores/referidos (3 PASOS)
-- ============================================================
-- Cada paso se pega y ejecuta POR SEPARADO. Ejecutar en orden.
-- No encadenarlos en una sola consulta: si una línea falla, el
-- resto se aborta y las funciones quedan inexistentes (error 42883).

-- ============================================================
-- PASO 1 — Eliminar TODAS las firmas (por OID) SIN fallar.
-- No usa REVOKE sobre funciones que ya no existen.
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_ganadores_recientes','get_mis_referidos','buscar_referido')
  LOOP
    EXECUTE format('DROP FUNCTION %s CASCADE', r.oid::regprocedure);
  END LOOP;
END $$;