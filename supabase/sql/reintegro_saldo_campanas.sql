-- ============================================================
-- LatamBucks — Reintegro automático de saldo sobrante de campañas
-- ============================================================
-- EJECUTAR TODO en orden en el SQL Editor de Supabase.
-- ES 100% AUTO-CONTENIDO E IDEMPOTENTE: se puede ejecutar varias
-- veces sin romper nada, y NO depende de que hayas corrido antes
-- migracion_supabase.sql ni saldo_promocion.sql (aunque si ya los
-- corriste, simplemente re-crea lo mismo). Ideal formato: pegar en
-- un solo bloque y ejecutar.
--
-- Conecta el eslabón que faltaba: hoy reintegrar_saldo_campana existe
-- pero nunca se dispara sola. Este script agrega dos disparadores:
--   1. RPC administrar_estado_campana  → al pausar/desactivar una campaña
--      (admin o anunciante propietario), reintegra al instante.
--   2. Ampliación de auto_aprobar_tareas_vencidas → dentro del barrido
--      horario, barre campañas sin cupos restantes e invoca el reintegro.
--
-- Backend functions (Base44) usan service_role (bypass RLS) → NO se afectan.
-- ============================================================

-- ============================================================
-- 0. Columnas requeridas por las RPCs (idempotente)
-- ============================================================
-- saldo_promocion: billetera interna del anunciante donde aterriza
--   el reintegro de cupos sobrantes (solo para futuras campañas).
-- reintegrado: marca anti-doble en campanas_locales.
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS saldo_promocion numeric DEFAULT 0;
ALTER TABLE public.campanas_locales ADD COLUMN IF NOT EXISTS reintegrado boolean DEFAULT false;

-- ============================================================
-- 0a. Helper de permisos (idempotente — ya definidos en la migración,
--     se re-crean por si se ejecuta este script solo).
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.perfiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM public.perfiles WHERE id = auth.uid();
  RETURN v_email;
END;
$$;

-- ============================================================
-- 1. RPC — reintegrar_saldo_campana (núcleo del reintegro)
-- ============================================================
-- Devuelve los cupos sobrantes (visitas_compradas - visitas_actuales)
-- de una campaña al saldo_promocion del anunciante, descontando la
-- comisión del 30% ya cobrada por adelantado (solo se devuelve el 70%).
-- Marca reintegrado=true para evitar doble reintegro y desactiva la campaña.
DROP FUNCTION IF EXISTS public.reintegrar_saldo_campana(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reintegrar_saldo_campana(integer) CASCADE;
CREATE OR REPLACE FUNCTION public.reintegrar_saldo_campana(p_campana_id INTEGER)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campana RECORD;
  v_cupos_sobrantes integer;
  v_valor_neto_cupo numeric;
  v_reintegro numeric;
  v_anunciante_id uuid;
BEGIN
  SELECT * INTO v_campana FROM campanas_locales WHERE id = p_campana_id LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Campaña no encontrada');
  END IF;

  IF v_campana.reintegrado THEN
    RETURN json_build_object('success', false, 'error', 'La campaña ya fue reintegrada');
  END IF;

  v_cupos_sobrantes := GREATEST(0, COALESCE(v_campana.visitas_compradas, 0) - COALESCE(v_campana.visitas_actuales, 0));

  IF v_cupos_sobrantes = 0 OR COALESCE(v_campana.visitas_compradas, 0) = 0 THEN
    -- Sin cupos no hay plata que devolver, pero la campaña SÍ se apaga: antes
    -- quedaba reintegrada y activa a la vez (por el panel quedaba pausada).
    UPDATE campanas_locales SET reintegrado = true, activa = false WHERE id = p_campana_id;
    RETURN json_build_object('success', true, 'reintegro', 0, 'mensaje', 'Sin cupos sobrantes');
  END IF;

  v_valor_neto_cupo := (COALESCE(v_campana.monto_invertido_ars, 0) * 0.70) / v_campana.visitas_compradas;
  v_reintegro := ROUND(v_cupos_sobrantes * v_valor_neto_cupo, 2);

  SELECT id INTO v_anunciante_id FROM perfiles WHERE email = v_campana.anunciante_email LIMIT 1;

  IF v_anunciante_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Anunciante no encontrado en perfiles');
  END IF;

  UPDATE perfiles SET saldo_promocion = COALESCE(saldo_promocion, 0) + v_reintegro WHERE id = v_anunciante_id;
  UPDATE campanas_locales SET reintegrado = true, activa = false WHERE id = p_campana_id;

  RETURN json_build_object('success', true, 'reintegro', v_reintegro, 'cupos_sobrantes', v_cupos_sobrantes, 'anunciante_id', v_anunciante_id);
END;
$$;

-- ============================================================
-- 2. RPC — administrar_estado_campana (Trigger 1: pausar/desactivar)
-- ============================================================
-- Desactiva una campaña (activa=false) y, si no fue ya reintegrada y
-- tiene cupos sobrantes, invoca reintegrar_saldo_campana atómicamente
-- en la misma transacción (devuelve el sobrante al saldo_promocion del
-- anunciante). Autorización: admin o anunciante propietario.
DROP FUNCTION IF EXISTS public.administrar_estado_campana(integer, boolean);
CREATE OR REPLACE FUNCTION public.administrar_estado_campana(
  p_campana_id INTEGER,
  p_activa BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campana RECORD;
  v_user_id UUID := auth.uid();
  v_is_owner BOOLEAN;
  v_reintegro JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT c.id, c.activa, c.reintegrado, c.anunciante_email
    INTO v_campana
  FROM public.campanas_locales c
  WHERE c.id = p_campana_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Campaña no encontrada');
  END IF;

  -- Autorización: admin o anunciante propietario
  v_is_owner := (v_campana.anunciante_email = public.get_user_email());
  IF NOT (public.is_admin() OR v_is_owner) THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden');
  END IF;

  -- Solo tiene sentido pausar una campaña activa
  IF p_activa = true AND v_campana.activa = true THEN
    RETURN json_build_object('success', true, 'reintegro', 0, 'mensaje', 'La campaña ya está activa');
  END IF;

  -- Desactivar la campaña
  UPDATE public.campanas_locales
  SET activa = false
  WHERE id = p_campana_id;

  -- Reintegración: si no fue ya reintegrada, devolver el sobrante
  IF v_campana.reintegrado = false THEN
    v_reintegro := public.reintegrar_saldo_campana(p_campana_id);
    RETURN json_build_object(
      'success', true,
      'estado', 'pausada',
      'reintegro', (v_reintegro->>'reintegro')::NUMERIC,
      'cupos_sobrantes', (v_reintegro->>'cupos_sobrantes')::INTEGER,
      'mensaje', 'Campaña pausada y saldo sobrante reintegrado'
    );
  END IF;

  RETURN json_build_object('success', true, 'estado', 'pausada', 'reintegro', 0, 'mensaje', 'Campaña pausada');
END;
$$;

-- ============================================================
-- 3. RPC — auto_aprobar_tareas_vencidas (Trigger 2: vencimiento por inactividad)
-- ============================================================
-- Versión ampliada: además de aprobar pruebas pendientes >48h, barre las
-- campañas activas sin cupos restantes (visitas_actuales >= visitas_compradas)
-- que aun no fueron reintegradas, les invoca reintegrar_saldo_campana y
-- acumula el resultado en el contador de retorno.
CREATE OR REPLACE FUNCTION public.auto_aprobar_tareas_vencidas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prueba RECORD;
  v_sponsor_id UUID;
  v_comision NUMERIC;
  v_aprobadas INT := 0;
  v_limite TIMESTAMPTZ := now() - interval '48 hours';
  v_camp RECORD;
  v_reint INT := 0;
BEGIN
  -- Barrido de pruebas pendientes >48h (aprobación automática)
  FOR v_prueba IN
    SELECT p.id, p.usuario_id, p.campana_id, c.puntos_recompensa
    FROM public.pruebas_tareas_locales p
    JOIN public.campanas_locales c ON c.id = p.campana_id
    WHERE p.estado = 'pendiente' AND p.creado_el < v_limite
  LOOP
    -- Marcar como aprobado (guard anti-doble)
    UPDATE public.pruebas_tareas_locales
    SET estado = 'aprobado'
    WHERE id = v_prueba.id AND estado = 'pendiente';

    IF NOT FOUND THEN CONTINUE; END IF;

    v_aprobadas := v_aprobadas + 1;

    -- Incrementar visitas
    PERFORM public.incrementar_visitas_campana(v_prueba.campana_id);

    -- Insertar en historial + acreditar saldo
    IF COALESCE(v_prueba.puntos_recompensa, 0) > 0 THEN
      INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
      VALUES (v_prueba.usuario_id, v_prueba.campana_id::text, 'tarea_local', v_prueba.puntos_recompensa, 'aprobado');

      PERFORM public.acreditar_saldo_usuario(v_prueba.usuario_id, v_prueba.puntos_recompensa);

      -- Comisión 10% al patrocinador
      SELECT referido_por INTO v_sponsor_id
      FROM public.perfiles WHERE id = v_prueba.usuario_id LIMIT 1;

      IF v_sponsor_id IS NOT NULL THEN
        PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
        IF FOUND THEN
          v_comision := ROUND(v_prueba.puntos_recompensa * 0.10, 4);
          PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_comision);
          INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
          VALUES (v_prueba.id::text, v_prueba.usuario_id, v_sponsor_id, v_comision, 'tarea_local');
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Barrido de campañas sin cupos restantes (reintegro de saldo sobrante)
  FOR v_camp IN
    SELECT c.id
    FROM public.campanas_locales c
    WHERE c.activa = true
      AND c.reintegrado = false
      AND c.estado_pago = 'aprobado'
      AND COALESCE(c.visitas_actuales, 0) >= COALESCE(c.visitas_compradas, 0)
  LOOP
    PERFORM public.reintegrar_saldo_campana(v_camp.id);
    v_reint := v_reint + 1;
  END LOOP;

  RETURN json_build_object('aprobadas', v_aprobadas, 'reintegradas', v_reint);
END;
$$;

-- ============================================================
-- 4. VERIFICACIÓN (opcional, descomentar si querés)
-- ============================================================
-- SELECT proname FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND proname IN ('administrar_estado_campana', 'reintegrar_saldo_campana', 'auto_aprobar_tareas_vencidas')
-- ORDER BY proname;