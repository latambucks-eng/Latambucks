-- ============================================================
-- LatamBucks — BLOQUE ÚNICO DE PENDIENTES
-- ============================================================
-- Este archivo reúne SOLO lo que falta en la base para que quede
-- igual a los scripts del proyecto. Verificado contra el proyecto
-- real: faltaban 4 funciones y sus triggers.
--
--  1. registrar_bono_bienvenida()   → bono de 500 pts al registrarse
--  2. descontar_saldo_on_reverso()  → descuento al reversar una tarea CPX
--  3. lb_proteger_actualizacion_perfil() → bloquea que un usuario se
--     cambie el rol, el email o el saldo por API directa
--  4. proteger_saldo_directo()      → segunda barrera sobre el saldo
--
-- Cómo usarlo: copiar TODO este archivo, pegarlo en Supabase →
-- SQL Editor → Run. Es idempotente: se puede ejecutar más de una vez
-- sin romper nada ni duplicar plata.
--
-- Requisito previo: la columna perfiles.saldo_bono y la RPC
-- descontar_saldo_reverso ya existen en la base (confirmado).
-- ============================================================


-- ============================================================
-- 1) CHECK de proveedores en historial_tareas (incluye rapidoreach)
--    NOT VALID: no revisa las filas viejas, solo las nuevas.
-- ============================================================
ALTER TABLE public.historial_tareas DROP CONSTRAINT IF EXISTS historial_tareas_proveedor_check;
ALTER TABLE public.historial_tareas ADD CONSTRAINT historial_tareas_proveedor_check
  CHECK (proveedor IN (
    'tarea_local',
    'monetag_video',
    'caja_sorpresa',
    'cpx_research',
    'theoremreach',
    'timewall',
    'bono_bienvenida',
    'cpagrip',
    'cpalead',
    'checkin_diario',
    'referido',
    'rapidoreach'
  ))
  NOT VALID;


-- ============================================================
-- 2) BONO DE BIENVENIDA — 500 pts, una sola vez por usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_bono_bienvenida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existe INT;
BEGIN
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Deduplicación estable por usuario
  SELECT count(*) INTO v_existe
  FROM public.historial_tareas
  WHERE usuario_id = NEW.id
    AND tarea_externa_id = 'bono_' || NEW.id::text;

  IF v_existe > 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
  VALUES (
    NEW.id,
    'bono_' || NEW.id::text,
    'bono_bienvenida',
    500,
    'aprobado'
  );

  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + 500,
      saldo_bono       = COALESCE(saldo_bono, 0) + 500
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_bono_bienvenida ON public.perfiles;
CREATE TRIGGER trigger_bono_bienvenida
  AFTER INSERT ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_bono_bienvenida();


-- ============================================================
-- 3) DESCUENTO AUTOMÁTICO AL REVERSAR UNA TAREA CPX
--    Solo proveedor cpx_research, solo aprobado → reversado.
-- ============================================================
CREATE OR REPLACE FUNCTION public.descontar_saldo_on_reverso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'reversado'
     AND OLD.estado = 'aprobado'
     AND NEW.proveedor = 'cpx_research'
     AND COALESCE(NEW.puntos_ganados, 0) <> 0 THEN
    -- Una sola implementación del descuento (misma que usa TimeWall)
    PERFORM public.descontar_saldo_reverso(NEW.usuario_id, abs(NEW.puntos_ganados));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_descontar_saldo_reverso ON public.historial_tareas;
CREATE TRIGGER trigger_descontar_saldo_reverso
  BEFORE UPDATE ON public.historial_tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_saldo_on_reverso();

REVOKE EXECUTE ON FUNCTION public.descontar_saldo_on_reverso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.descontar_saldo_on_reverso() TO service_role;


-- ============================================================
-- 4) PROTECCIÓN DE COLUMNAS SENSIBLES DE PERFILES
--    Bloquea UPDATE directo desde el cliente sobre role, id, email,
--    referido_por, codigo_referido y los tres saldos.
--    Las RPC propias (SECURITY DEFINER) y el service_role no se tocan.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lb_proteger_actualizacion_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'No podés cambiar tu rol';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'No podés modificar tu id';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'No podés modificar tu email directamente';
  END IF;
  IF NEW.referido_por IS DISTINCT FROM OLD.referido_por THEN
    RAISE EXCEPTION 'No podés modificar tu referido';
  END IF;
  IF NEW.codigo_referido IS DISTINCT FROM OLD.codigo_referido THEN
    RAISE EXCEPTION 'No podés modificar tu código de referido';
  END IF;
  IF NEW.saldo_disponible IS DISTINCT FROM OLD.saldo_disponible THEN
    RAISE EXCEPTION 'Operación no permitida sobre el saldo';
  END IF;
  IF NEW.saldo_pendiente IS DISTINCT FROM OLD.saldo_pendiente THEN
    RAISE EXCEPTION 'Operación no permitida sobre el saldo';
  END IF;
  IF NEW.saldo_promocion IS DISTINCT FROM OLD.saldo_promocion THEN
    RAISE EXCEPTION 'El saldo promocional solo cambia por campañas validadas en el servidor';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lb_proteger_actualizacion_perfil ON public.perfiles;
CREATE TRIGGER trg_lb_proteger_actualizacion_perfil
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.lb_proteger_actualizacion_perfil();


-- ============================================================
-- 5) SEGUNDA BARRERA SOBRE EL SALDO (tragamonedas)
-- ============================================================
CREATE OR REPLACE FUNCTION public.proteger_saldo_directo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.saldo_disponible IS DISTINCT FROM OLD.saldo_disponible
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin')
  THEN
    RAISE EXCEPTION 'No puedes modificar tu saldo directamente. Usa los canales habilitados.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_saldo ON public.perfiles;
CREATE TRIGGER trg_proteger_saldo
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_saldo_directo();


-- ============================================================
-- VERIFICACIÓN — debería devolver 4 funciones y 4 triggers
-- ============================================================
SELECT 'funcion' AS tipo, proname AS nombre
FROM pg_proc
WHERE proname IN (
  'registrar_bono_bienvenida',
  'descontar_saldo_on_reverso',
  'lb_proteger_actualizacion_perfil',
  'proteger_saldo_directo'
)
UNION ALL
SELECT 'trigger' AS tipo, tgname AS nombre
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname IN (
    'trigger_bono_bienvenida',
    'trigger_descontar_saldo_reverso',
    'trg_lb_proteger_actualizacion_perfil',
    'trg_proteger_saldo'
  )
ORDER BY tipo, nombre;