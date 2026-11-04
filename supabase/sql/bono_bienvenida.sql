-- ============================================================
-- LatamBucks — Bono de Bienvenida (500 pts) automático
-- ============================================================
-- Da 500 puntos a cada usuario nuevo al registrarse, una sola vez.
-- Se ejecuta automáticamente vía trigger AFTER INSERT en perfiles.
-- No cambia el flujo del frontend: el bono se acredita solo en la DB.
--
-- EJECUTAR en el SQL Editor de Supabase (orden).
-- ============================================================

-- 1. Agregar 'bono_bienvenida' al CHECK constraint de proveedor.
--    Usamos NOT VALID para que NO verifique las filas existentes (puede haber
--    proveedores como 'cpagrip', 'cpalead', 'checkin_diario' ya insertados).
--    Solo valida las NUEVAS inserciones a partir de ahora.
ALTER TABLE public.historial_tareas DROP CONSTRAINT IF EXISTS historial_tareas_proveedor_check;
ALTER TABLE public.historial_tareas ADD CONSTRAINT historial_tareas_proveedor_check
  CHECK (proveedor IN ('tarea_local', 'monetag_video', 'caja_sorpresa', 'cpx_research', 'theoremreach', 'timewall', 'bono_bienvenida', 'cpagrip', 'cpalead', 'checkin_diario', 'referido'))
  NOT VALID;

-- 2. Función SECURITY DEFINER — acredita el bono una sola vez
--    Deduplicación por tarea_externa_id = 'bono_<userId>' (estable).
--    Si el trigger se re-ejecuta, detecta el bono existente y no hace nada.
CREATE OR REPLACE FUNCTION public.registrar_bono_bienvenida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existe INT;
BEGIN
  -- Verificar que el perfil tenga id válido
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Deduplicación: si ya existe un bono para este usuario, salir
  SELECT count(*) INTO v_existe
  FROM public.historial_tareas
  WHERE usuario_id = NEW.id
    AND tarea_externa_id = 'bono_' || NEW.id::text;

  IF v_existe > 0 THEN
    RETURN NEW;
  END IF;

  -- Insertar en historial_tareas el bono de 500 pts (estado aprobado)
  INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
  VALUES (
    NEW.id,
    'bono_' || NEW.id::text,
    'bono_bienvenida',
    500,
    'aprobado'
  );

  -- Acreditar 500 pts al saldo_disponible del nuevo usuario (retirable)
  -- Y registrar en saldo_bono (tracker para eximir 30% de comisión al
  -- crear campañas). El bono es un SOLO pool de 500 pts: el usuario puede
  -- retirarlos O usarlos para crear campañas. NO se duplica.
  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + 500,
      saldo_bono = COALESCE(saldo_bono, 0) + 500
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 3. Trigger AFTER INSERT en perfiles
DROP TRIGGER IF EXISTS trigger_bono_bienvenida ON public.perfiles;
CREATE TRIGGER trigger_bono_bienvenida
  AFTER INSERT ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_bono_bienvenida();

-- ============================================================
-- Verificación (opcional — ejecutar para confirmar)
-- ============================================================
-- SELECT tgname, tgrelid::regclass, tgenabled
-- FROM pg_trigger WHERE tgname = 'trigger_bono_bienvenida';

-- Para usuarios EXISTENTES que no recibieron el bono (migración única):
-- Ejecutar una sola vez para acreditar el bono a usuarios ya registrados
-- sin bono. Seguro: respeta la deduplicación. Solo acredita saldo_disponible.
-- ============================================================
-- DO $$
-- DECLARE
--   r RECORD;
--   v_existe INT;
-- BEGIN
--   FOR r IN SELECT id FROM public.perfiles LOOP
--     SELECT count(*) INTO v_existe
--     FROM public.historial_tareas
--     WHERE usuario_id = r.id AND tarea_externa_id = 'bono_' || r.id::text;
--     IF v_existe = 0 THEN
--       INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
--       VALUES (r.id, 'bono_' || r.id::text, 'bono_bienvenida', 500, 'aprobado');
--       UPDATE public.perfiles
--       SET saldo_disponible = COALESCE(saldo_disponible, 0) + 500
--       WHERE id = r.id;
--     END IF;
--   END LOOP;
-- END;
-- $$;

-- ============================================================
-- NOTA: El bono se acredita en saldo_disponible (retirable) y se
-- registra en saldo_bono (tracker). activar_campana_con_saldo consume
-- primero la porción de saldo_bono SIN 30% de comisión, y luego el
-- resto (saldo_promocion + saldo_disponible no-bono) CON 30%.
-- Al retirar, procesar_ciclo_usuario reinicia saldo_bono a 0.
-- Para usuarios existentes con bono ya acreditado, ver
-- saldo_bono_columna.sql para la migración opcional de saldo_bono.
-- ============================================================