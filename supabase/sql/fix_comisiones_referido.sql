-- ============================================================
-- LATAMBUCKS — FIX DEFINITIVO: comisiones de referido NO acreditan
-- ============================================================
-- SINTOMA REPORTADO:
--   El sponsor ve la fila en comisiones_referido (ej. cpx_research,
--   comision=35) pero su saldo_disponible NO se incrementa y su
--   puntos_por_referidos queda en 0.
--
-- CAUSA RAIZ (confirmada empíricamente):
--   El script security_fix_rpc_advisor.sql cambió estas funciones
--   atómicas a SECURITY INVOKER:
--       acreditar_saldo_usuario, incrementar_saldo_referido,
--       descontar_saldo_reverso, reembolsar_retiro_usuario,
--       incrementar_visitas_campana
--   La intención era bloquear el fraude por llamada anónima, PERO ese
--   fraude ya estaba bloqueado por el REVOKE EXECUTE FROM anon/public
--   (las funciones no son alcanzables por PostgREST anónimo).
--   Con INVOKER, el UPDATE interno a public.perfiles queda sujeto a la
--   RLS de perfiles (perfiles_update: id=auth.uid() OR is_admin()). Al
--   ejecutarse con un rol NO owner (p. ej. service_role, o el orden de
--   ejecución que deja auth.uid() en NULL), la fila del sponsor es
--   INVISIBLE para el UPDATE → UPDATE ... WHERE id=... afecta 0 filas
--   → la RPC devuelve éxito (204/void) SIN acreditar nada.
--   El flujo que la llama (procesar_comisiones_pendientes, aprobar_prueba,
--   abrir_caja_sorpresa) inserta igualmente la fila en comisiones_referido
--   confiando en que la acreditación ocurrió. Resultado: fila registrada,
--   saldo intacto.
--
-- SOLUCION:
--   1. Restaurar las 5 funciones atómicas a SECURITY DEFINER. Correrán
--      como el dueño de la función (postgres, owner de perfiles) → el
--      UPDATE interno bypassa RLS y el trigger de protección las respeta
--      (current_user <> 'authenticated'). Es el comportamiento original
--      correcto. El REVOKE a anon/public YA está en su lugar → siguen
--      inalcanzables por el público.
--   2. Endurecer incrementar_saldo_referido y acreditar_saldo_usuario
--      para que LANZEN un error si el UPDATE no afectó filas, de modo
--      que si algo vuelve a fallar, el flujo lo detecte (EXCEPTION) y
--      NO vuelva a marcar 'acreditado=true' en falso.
--   3. Consulta de diagnóstico al final para dimensionar el alcance:
--      comisiones_referido cuyo sponsor no recibió el saldo.
--
-- EJECUTAR TODO EN ORDEN en el SQL Editor de Supabase. IDEMPOTENTE.
-- ============================================================

-- ------------------------------------------------------------
-- PARTE 1 — Restaurar a SECURITY DEFINER las funciones atómicas
-- ------------------------------------------------------------
ALTER FUNCTION public.acreditar_saldo_usuario(UUID, NUMERIC) SECURITY DEFINER;
ALTER FUNCTION public.incrementar_saldo_referido(UUID, NUMERIC) SECURITY DEFINER;
ALTER FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) SECURITY DEFINER;
ALTER FUNCTION public.reembolsar_retiro_usuario(UUID, NUMERIC) SECURITY DEFINER;
ALTER FUNCTION public.incrementar_visitas_campana(INTEGER) SECURITY DEFINER;

-- Los REVOKE/GRANT del fix de seguridad se conservan (bloquean anon).
-- Verificar que el público NO pueda ejecutarlas:
REVOKE EXECUTE ON FUNCTION public.acreditar_saldo_usuario(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.incrementar_saldo_referido(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reembolsar_retiro_usuario(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.incrementar_visitas_campana(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acreditar_saldo_usuario(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_saldo_referido(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_reverso(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.reembolsar_retiro_usuario(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_visitas_campana(INTEGER) TO service_role;

-- ------------------------------------------------------------
-- PARTE 2 — Endurecer acreditación de saldo y comisiones
--   (lanza error si el UPDATE no afectó filas: nunca más éxito mudo)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.incrementar_saldo_referido(
  p_sponsor_id UUID,
  p_comision NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + p_comision,
      puntos_por_referidos = COALESCE(puntos_por_referidos, 0) + p_comision
  WHERE id = p_sponsor_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'incrementar_saldo_referido: sponsor % no encontrado o sin permiso (0 filas)',
      p_sponsor_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.acreditar_saldo_usuario(
  p_user_id UUID,
  p_puntos NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + p_puntos
  WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'acreditar_saldo_usuario: usuario % no encontrado o sin permiso (0 filas)',
      p_user_id;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- PARTE 3 — DIAGNÓSTICO: dimensionar el alcance del daño
--   Comisiones que SÍ están en comisiones_referido con acreditado=true
--   (o del flujo cron) pero cuyo sponsor NO recibió el saldo.
--   Ejecutar y revisar el número de filas devueltas.
-- ------------------------------------------------------------
-- 3a. Sponsors cuyo puntos_por_referidos no coincide (aproximación):
--     comparamos la suma de comisiones_referido vs el campo del perfil.
SELECT
  p.id AS sponsor_id,
  p.email AS sponsor_email,
  COALESCE(p.puntos_por_referidos, 0) AS puntos_registrados,
  COALESCE(SUM(cr.comision), 0) AS suma_comisiones_referido,
  ROUND(COALESCE(SUM(cr.comision), 0) - COALESCE(p.puntos_por_referidos, 0), 4) AS faltante
FROM public.perfiles p
LEFT JOIN public.comisiones_referido cr ON cr.sponsor_id = p.id
GROUP BY p.id, p.email, p.puntos_por_referidos
HAVING ROUND(COALESCE(SUM(cr.comision), 0) - COALESCE(p.puntos_por_referidos, 0), 4) <> 0
ORDER BY faltante DESC;

-- 3b. (Opcional) Probar que la RPC ya acredita correctamente:
--     descomentar y ejecutar con un sponsor real, revisar que el saldo suba,
--     y luego revertir manualmente.
-- SELECT public.incrementar_saldo_referido('<sponsor_uuid>', 0.001);

-- ------------------------------------------------------------
-- PARTE 4 — REPARACIÓN: reponer puntos faltantes a los sponsors
--   afectados por el bug (puntos_por_referidos < suma de comisiones).
--   SE EJECUTA UNA SOLA VEZ. Repone solo la diferencia positiva.
--   (La diferencia negativa — puntos más que comisiones — no se toca,
--    corresponden a débitos manuales o ajustes previos.)
-- ------------------------------------------------------------
-- IMPORTANTE: revisá la salida de la consulta 3a antes de ejecutar 4a.
-- Si el listado coincide con los sponsors que sabés que estaban
-- pendientes, ejecutá 4a para reponer automáticamente.

-- 4a. Reponer automáticamente: para cada sponsor, sumar el faltante
--     (comisiones_referido total - puntos_por_referidos) solo si es > 0.
UPDATE public.perfiles p
SET
  saldo_disponible = COALESCE(p.saldo_disponible, 0) + GREATEST(v.faltante, 0),
  puntos_por_referidos = COALESCE(p.puntos_por_referidos, 0) + GREATEST(v.faltante, 0)
FROM (
  SELECT sponsor_id, ROUND(COALESCE(SUM(comision), 0), 4) AS suma_comisiones
  FROM public.comisiones_referido
  GROUP BY sponsor_id
) agg
JOIN public.perfiles sp ON sp.id = agg.sponsor_id
JOIN LATERAL (
  SELECT ROUND(agg.suma_comisiones - COALESCE(sp.puntos_por_referidos, 0), 4) AS faltante
) v ON TRUE
WHERE p.id = sp.id
  AND v.faltante > 0;

-- 4b. Verificación post-reparación: la consulta 3a ahora debería devolver 0 filas.
-- Reejecutá la consulta de la PARTE 3a para confirmar que ningún sponsor
-- sigue con faltante positivo.