-- ============================================================
-- LATAMBUCKS — REVERSO DESCUENTA LA COMISIÓN DEL REFERIDO
-- ============================================================
-- QUÉ HACE:
--   Cuando una tarea pasa a estado 'reversado' en historial_tareas, además de
--   descontarle los puntos al usuario, ahora también se le DESCUENTA al
--   patrocinador la comisión de referido que ya tenía acreditada por ESA tarea.
--
--   - Descuenta con la misma función de siempre (descontar_saldo_reverso):
--     saldo_disponible → saldo_pendiente → deuda, con lock FOR UPDATE.
--   - Baja también el contador puntos_por_referidos (nunca por debajo de 0).
--   - Marca la comisión como reversada (reversada = true) para que NO se pueda
--     descontar dos veces: el descuento es idempotente por diseño.
--   - Si la comisión todavía estaba en retención de 24 h (comisiones_pendientes),
--     no hay nada que descontar: el cron ya la descarta al ver el reverso.
--   - Si el reverso llegara dos veces (fila repetida, PATCH repetido, o un
--     reintento del proveedor), las filas ya marcadas no se vuelven a tocar.
--   - Un fallo del descuento NO rompe el reverso: se registra como WARNING y el
--     reverso de los puntos del usuario se aplica igual.
--
-- ALCANCE: comisiones guardadas en public.comisiones_referido (encuestas:
-- CPX, TheoremReach, TimeWall, CPAGrip). Es la tabla que usan los reversos
-- reales del sistema.
--
-- EJECUTAR en Supabase → SQL Editor. Es IDEMPOTENTE: se puede correr varias veces.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Marca de reverso en la tabla de comisiones
-- ------------------------------------------------------------
ALTER TABLE public.comisiones_referido
  ADD COLUMN IF NOT EXISTS reversada BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.comisiones_referido
  ADD COLUMN IF NOT EXISTS reversada_el TIMESTAMPTZ;

-- Índice para ubicar la comisión de una tarea puntual sin recorrer la tabla.
CREATE INDEX IF NOT EXISTS idx_comisiones_referido_tarea
  ON public.comisiones_referido (tarea_id, proveedor)
  WHERE reversada = false;

-- ------------------------------------------------------------
-- 2. Función que revierte la comisión de una tarea
--    Devuelve cuántas comisiones descontó (0 = no había comisión acreditada).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revertir_comision_referido(
  p_tarea_id TEXT,
  p_proveedor TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_com       RECORD;
  v_monto     NUMERIC;
  v_total     INT := 0;
BEGIN
  -- Sin identificador de tarea no hay comisión que revertir.
  IF p_tarea_id IS NULL OR btrim(p_tarea_id) = '' THEN
    RETURN 0;
  END IF;

  FOR v_com IN
    SELECT id, sponsor_id, comision
      FROM public.comisiones_referido
     WHERE tarea_id = p_tarea_id
       AND COALESCE(proveedor, '') = COALESCE(p_proveedor, '')
       AND reversada = false
       AND COALESCE(comision, 0) > 0
     FOR UPDATE
  LOOP
    v_monto := COALESCE(v_com.comision, 0);
    CONTINUE WHEN v_monto <= 0;

    -- Descuento real del saldo del patrocinador (misma función que usa el
    -- reverso del usuario: disponible → pendiente → deuda, atómico).
    PERFORM public.descontar_saldo_reverso(v_com.sponsor_id, v_monto);

    -- Contador de comisiones del perfil: baja lo revertido, nunca negativo.
    UPDATE public.perfiles
       SET puntos_por_referidos = GREATEST(COALESCE(puntos_por_referidos, 0) - v_monto, 0)
     WHERE id = v_com.sponsor_id;

    -- Marca la comisión como revertida: impide cualquier segundo descuento.
    UPDATE public.comisiones_referido
       SET reversada = true,
           reversada_el = now()
     WHERE id = v_com.id;

    v_total := v_total + 1;
  END LOOP;

  RETURN v_total;
END;
$$;

-- ------------------------------------------------------------
-- 3. Trigger: se dispara cuando la tarea queda reversada
--    (UPDATE aprobado → reversado, o fila NUEVA ya reversada)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_reverso_comision_referido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo interesa el estado reversado.
  IF NEW.estado IS DISTINCT FROM 'reversado' THEN
    RETURN NEW;
  END IF;

  -- UPDATE sobre una fila que ya estaba reversada: nada nuevo que revertir.
  -- (Se anida para no tocar OLD en un INSERT, donde OLD no existe.)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.estado = 'reversado' THEN
      RETURN NEW;
    END IF;
  END IF;

  -- El descuento de la comisión es independiente del proveedor: si la comisión
  -- se pagó, se descuenta. Un error acá nunca bloquea el reverso de la tarea.
  BEGIN
    PERFORM public.revertir_comision_referido(NEW.tarea_externa_id, NEW.proveedor);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'on_reverso_comision_referido: no se pudo revertir la comisión de la tarea % (proveedor %) — %',
        NEW.tarea_externa_id, NEW.proveedor, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reverso_comision_referido ON public.historial_tareas;
CREATE TRIGGER trigger_reverso_comision_referido
  BEFORE UPDATE OF estado ON public.historial_tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.on_reverso_comision_referido();

DROP TRIGGER IF EXISTS trigger_reverso_comision_referido_insert ON public.historial_tareas;
CREATE TRIGGER trigger_reverso_comision_referido_insert
  BEFORE INSERT ON public.historial_tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.on_reverso_comision_referido();

-- ------------------------------------------------------------
-- 4. Permisos: nadie desde el frontend puede descontarle saldo a un sponsor
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.revertir_comision_referido(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_reverso_comision_referido() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revertir_comision_referido(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.on_reverso_comision_referido() TO service_role;

COMMIT;

-- ============================================================
-- VERIFICACIÓN 1: deben aparecer los DOS triggers nuevos
-- ============================================================
SELECT t.tgname AS trigger_name,
       CASE WHEN t.tgtype & 4 = 4 THEN 'INSERT' ELSE 'UPDATE' END AS evento
FROM pg_trigger t
WHERE t.tgrelid = 'public.historial_tareas'::regclass
  AND t.tgname LIKE 'trigger_reverso_comision_referido%'
ORDER BY trigger_name;

-- ============================================================
-- VERIFICACIÓN 2: deben aparecer las dos funciones
-- ============================================================
SELECT p.proname AS funcion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('revertir_comision_referido', 'on_reverso_comision_referido')
ORDER BY funcion;

-- ============================================================
-- VERIFICACIÓN 3: cuántas comisiones ya quedaron marcadas como revertidas
-- (0 es lo normal en una instalación nueva)
-- ============================================================
SELECT COUNT(*) FILTER (WHERE reversada) AS comisiones_revertidas,
       COUNT(*) AS comisiones_totales
FROM public.comisiones_referido;

-- ============================================================
-- PRUEBA REAL (opcional, NO deja cambios): descomentar todo este bloque y
-- ejecutarlo. Crea una comisión de prueba, verifica que el saldo del sponsor
-- baja exactamente lo esperado y luego hace ROLLBACK.
-- ============================================================
-- BEGIN;
--   DO $$
--   DECLARE
--     v_sponsor UUID;
--     v_antes NUMERIC;
--     v_despues NUMERIC;
--     v_comision NUMERIC := 3;
--     v_tarea TEXT := 'prueba-reverso-' || gen_random_uuid();
--   BEGIN
--     SELECT id, COALESCE(saldo_disponible, 0) INTO v_sponsor, v_antes
--       FROM public.perfiles WHERE COALESCE(saldo_disponible, 0) >= v_comision
--       ORDER BY id LIMIT 1;
--     IF v_sponsor IS NULL THEN
--       RAISE NOTICE 'Sin sponsors con saldo suficiente para la prueba';
--       RETURN;
--     END IF;
--
--     INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
--     VALUES (v_tarea, v_sponsor, v_sponsor, v_comision, 'cpx_research');
--
--     PERFORM public.revertir_comision_referido(v_tarea, 'cpx_research');
--
--     SELECT COALESCE(saldo_disponible, 0) INTO v_despues FROM public.perfiles WHERE id = v_sponsor;
--     RAISE NOTICE 'saldo antes %, después %, diferencia %', v_antes, v_despues, v_antes - v_despues;
--
--     -- Segunda llamada: no debe descontar otra vez (idempotente)
--     PERFORM public.revertir_comision_referido(v_tarea, 'cpx_research');
--     PERFORM 1 FROM public.comisiones_referido WHERE tarea_id = v_tarea AND reversada = true;
--     IF NOT FOUND THEN
--       RAISE EXCEPTION 'La comisión de prueba no quedó marcada como reversada';
--     END IF;
--   END $$;
-- ROLLBACK;