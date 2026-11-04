-- ============================================================
-- MIGRACIÓN COMPLETA A SUPABASE — Sin créditos de integración Base44
-- ============================================================
-- EJECUTAR TODO en orden en el SQL Editor de Supabase.
-- Crea todas las funciones RPC, tablas y políticas RLS necesarias
-- para que el frontend opere directamente con Supabase.
-- ============================================================

-- ============================================================
-- 0. FUNCIONES HELPER (re-crear por si no existen)
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
-- 0a. DROP FUNCIONES VIEJAS — evitar error "cannot change return type"
-- ============================================================
-- Estas funciones cambiaron firma o tipo de retorno respecto a
-- versiones anteriores. Se dropean antes de re-crearlas.
-- IF EXISTS = seguro si no existen aún (instalación limpia).
-- ============================================================

DROP FUNCTION IF EXISTS public.auto_aprobar_tareas_vencidas() CASCADE;
DROP FUNCTION IF EXISTS public.procesar_comisiones_pendientes() CASCADE;
DROP FUNCTION IF EXISTS public.reintegrar_saldo_campana(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.reintegrar_saldo_campana(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.iniciar_sesion_video(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.registrar_video_con_limite(UUID, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.procesar_ciclo_usuario(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.acreditar_saldo_usuario(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_saldo_referido(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_visitas_campana(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.reembolsar_retiro_usuario(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.descontar_saldo_reverso(UUID, NUMERIC) CASCADE;

-- ============================================================
-- 0b. TABLAS — crear si no existen (por seguridad)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comisiones_referido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id TEXT,
  usuario_id UUID,
  sponsor_id UUID,
  comision NUMERIC DEFAULT 0,
  proveedor TEXT,
  created_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comisiones_referido ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.registro_postbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor TEXT,
  transaccion_externa_id TEXT,
  usuario_id UUID,
  puntos_procesados NUMERIC,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registro_postbacks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. TABLA avisos_sistema (reemplaza entidad Base44 AvisoSistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.avisos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','success','warning','error')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.avisos_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avisos_sistema_select ON public.avisos_sistema;
CREATE POLICY avisos_sistema_select ON public.avisos_sistema
  FOR SELECT USING (
    activo = true OR public.is_admin()
  );

DROP POLICY IF EXISTS avisos_sistema_insert ON public.avisos_sistema;
CREATE POLICY avisos_sistema_insert ON public.avisos_sistema
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS avisos_sistema_update ON public.avisos_sistema;
CREATE POLICY avisos_sistema_update ON public.avisos_sistema
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS avisos_sistema_delete ON public.avisos_sistema;
CREATE POLICY avisos_sistema_delete ON public.avisos_sistema
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- 2. RPCs ATÓMICOS — acreditar_saldo_usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.acreditar_saldo_usuario(
  p_user_id UUID,
  p_puntos NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + p_puntos
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- 3. RPC — incrementar_saldo_referido
-- ============================================================
CREATE OR REPLACE FUNCTION public.incrementar_saldo_referido(
  p_sponsor_id UUID,
  p_comision NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + p_comision,
      puntos_por_referidos = COALESCE(puntos_por_referidos, 0) + p_comision
  WHERE id = p_sponsor_id;
END;
$$;

-- ============================================================
-- 4. RPC — iniciar_sesion_video (usa auth.uid)
-- ============================================================
-- DROP primero: la versión anterior en rls_policies.sql tenía (p_user_id UUID)
DROP FUNCTION IF EXISTS public.iniciar_sesion_video(UUID);
CREATE OR REPLACE FUNCTION public.iniciar_sesion_video()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_sesion_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.sesiones_video (usuario_id)
  VALUES (auth.uid())
  RETURNING id INTO v_sesion_id;
  RETURN v_sesion_id;
END;
$$;

-- ============================================================
-- 5. RPC — registrar_video_con_limite (con acreditación de saldo)
-- ============================================================
-- DROP primero: la versión anterior en rls_policies.sql tenía (p_user_id UUID, p_limite INT, p_recompensa NUMERIC, p_sesion_id UUID)
-- y retornaba TEXT. La nueva usa auth.uid(), retorna JSONB y acredita saldo.
DROP FUNCTION IF EXISTS public.registrar_video_con_limite(UUID, INT, NUMERIC, UUID);
CREATE OR REPLACE FUNCTION public.registrar_video_con_limite(
  p_limite INT DEFAULT 20,
  p_recompensa NUMERIC DEFAULT 1,
  p_sesion_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT;
  v_today TIMESTAMPTZ;
  v_fecha_inicio TIMESTAMPTZ;
  v_completada BOOLEAN;
  v_elapsed INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('status', 'error_unauthorized');
  END IF;

  IF p_sesion_id IS NULL THEN
    RETURN json_build_object('status', 'error_sesion_requerida');
  END IF;

  v_today := date_trunc('day', now() AT TIME ZONE 'America/Buenos_Aires') AT TIME ZONE 'America/Buenos_Aires';

  SELECT fecha_inicio, completada INTO v_fecha_inicio, v_completada
  FROM public.sesiones_video
  WHERE id = p_sesion_id AND usuario_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'error_sesion_invalida');
  END IF;

  IF v_completada THEN
    RETURN json_build_object('status', 'error_sesion_ya_usada');
  END IF;

  v_elapsed := extract(epoch from (now() - v_fecha_inicio))::INT;
  IF v_elapsed < 15 THEN
    RETURN json_build_object('status', 'error_tiempo_incompleto');
  END IF;

  SELECT count(*) INTO v_count
  FROM public.historial_tareas
  WHERE usuario_id = v_user_id
    AND proveedor = 'monetag_video'
    AND creado_el >= v_today;

  IF v_count >= p_limite THEN
    RETURN json_build_object('status', 'error_limite_diario_alcanzado');
  END IF;

  UPDATE public.sesiones_video SET completada = true WHERE id = p_sesion_id;

  INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
  VALUES (
    v_user_id,
    'video_' || v_user_id || '_' || extract(epoch from now())::bigint,
    'monetag_video',
    p_recompensa,
    'aprobado'
  );

  PERFORM public.acreditar_saldo_usuario(v_user_id, p_recompensa);

  RETURN json_build_object('status', 'video_registrado_exito');
END;
$$;

-- ============================================================
-- 6. RPC — incrementar_visitas_campana
-- ============================================================
CREATE OR REPLACE FUNCTION public.incrementar_visitas_campana(
  p_campana_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campanas_locales
  SET visitas_actuales = COALESCE(visitas_actuales, 0) + 1
  WHERE id = p_campana_id;
END;
$$;

-- ============================================================
-- 7. RPC — reembolsar_retiro_usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.reembolsar_retiro_usuario(
  p_user_id UUID,
  p_monto NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + p_monto,
      saldo_pendiente = GREATEST(0, COALESCE(saldo_pendiente, 0) - p_monto)
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- 8. RPC — descontar_saldo_reverso
-- ============================================================
CREATE OR REPLACE FUNCTION public.descontar_saldo_reverso(
  p_user_id UUID,
  p_monto NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_disponible NUMERIC;
  v_pendiente NUMERIC;
  v_restante NUMERIC;
BEGIN
  SELECT COALESCE(saldo_disponible, 0), COALESCE(saldo_pendiente, 0)
    INTO v_disponible, v_pendiente
  FROM public.perfiles WHERE id = p_user_id FOR UPDATE;

  v_restante := p_monto;

  IF v_restante <= v_disponible THEN
    UPDATE public.perfiles SET saldo_disponible = v_disponible - v_restante WHERE id = p_user_id;
    RETURN;
  END IF;
  v_restante := v_restante - v_disponible;

  IF v_restante <= v_pendiente THEN
    UPDATE public.perfiles SET saldo_disponible = 0, saldo_pendiente = v_pendiente - v_restante WHERE id = p_user_id;
    RETURN;
  END IF;
  v_restante := v_restante - v_pendiente;

  UPDATE public.perfiles SET saldo_disponible = -v_restante, saldo_pendiente = 0 WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- 9. RPC — procesar_ciclo_usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.procesar_ciclo_usuario(
  p_user_id UUID,
  p_marker TEXT,
  p_min_points NUMERIC,
  p_metodo_pago TEXT,
  p_detalles TEXT,
  p_titular TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo NUMERIC;
  v_retener BOOLEAN;
  v_ultimo_ciclo TEXT;
BEGIN
  SELECT saldo_disponible, retener_pagos, ultimo_ciclo_procesado
    INTO v_saldo, v_retener, v_ultimo_ciclo
  FROM public.perfiles WHERE id = p_user_id FOR UPDATE;

  IF v_ultimo_ciclo = p_marker THEN RETURN FALSE; END IF;
  IF v_retener THEN RETURN FALSE; END IF;
  IF v_saldo IS NULL OR v_saldo < p_min_points THEN RETURN FALSE; END IF;

  INSERT INTO public.retiros (user_id, puntos_solicitados, metodo_pago, detalles_pago, titular_nombre, estado)
  VALUES (p_user_id, v_saldo, p_metodo_pago, p_detalles, p_titular, 'pendiente');

  UPDATE public.perfiles
  SET saldo_disponible = 0,
      saldo_pendiente = COALESCE(saldo_pendiente, 0) + v_saldo,
      ultimo_ciclo_procesado = p_marker
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 10. RPC — reintegrar_saldo_campana
-- ============================================================
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
-- 11. RPC — reclamar_checkin (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reclamar_checkin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_recompensa NUMERIC := 10;
  v_ultima TIMESTAMPTZ;
  v_fecha_id TEXT;
  v_24h INTERVAL := interval '24 hours';
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Verificar cooldown de 24h
  SELECT creado_el INTO v_ultima
  FROM public.historial_tareas
  WHERE usuario_id = v_user_id
    AND tarea_externa_id LIKE 'checkin_' || v_user_id::text || '_%'
  ORDER BY creado_el DESC LIMIT 1;

  IF v_ultima IS NOT NULL AND (now() - v_ultima) < v_24h THEN
    RETURN json_build_object(
      'success', false,
      'already_claimed', true,
      'proxima_disponible', (v_ultima + v_24h)::text
    );
  END IF;

  -- Registrar check-in
  v_fecha_id := 'checkin_' || v_user_id::text || '_' || extract(epoch from now())::bigint;

  BEGIN
    INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
    VALUES (v_user_id, v_fecha_id, 'tarea_local', v_recompensa, 'aprobado');
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'already_claimed', true);
  END;

  -- Acreditar saldo
  PERFORM public.acreditar_saldo_usuario(v_user_id, v_recompensa);

  RETURN json_build_object('success', true, 'puntos', v_recompensa);
END;
$$;

-- ============================================================
-- 12. RPC — abrir_caja_sorpresa (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.abrir_caja_sorpresa()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_cooldown INTERVAL := interval '12 hours';
  v_ultima TIMESTAMPTZ;
  v_transcurrido INTERVAL;
  v_restante INTERVAL;
  v_month_start TIMESTAMPTZ;
  v_count_medium INT;
  v_count_big INT;
  v_roll NUMERIC;
  v_prize NUMERIC := 0;
  v_fecha_id TEXT;
  v_sponsor_id UUID;
  v_comision_incentivo NUMERIC := 50;
  v_gordo_existe INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('disponible', false, 'error', 'Unauthorized');
  END IF;

  -- 1. Verificar cooldown de 12h
  SELECT creado_el INTO v_ultima
  FROM public.historial_tareas
  WHERE usuario_id = v_user_id AND proveedor = 'caja_sorpresa'
  ORDER BY creado_el DESC LIMIT 1;

  IF v_ultima IS NOT NULL THEN
    v_transcurrido := now() - v_ultima;
    IF v_transcurrido < v_cooldown THEN
      v_restante := v_cooldown - v_transcurrido;
      RETURN json_build_object(
        'disponible', false,
        'tiempoRestante', extract(hour from v_restante)::text || ':' ||
                          LPAD(extract(minute from v_restante)::text, 2, '0') || ':' ||
                          LPAD(extract(second from v_restante)::text, 2, '0')
      );
    END IF;
  END IF;

  -- 2. Calcular inicio de mes Argentina
  v_month_start := date_trunc('month', now() AT TIME ZONE 'America/Buenos_Aires') AT TIME ZONE 'America/Buenos_Aires';

  -- 3. Cuota Medio: usuarios únicos con premio=10 este mes
  SELECT count(DISTINCT usuario_id) INTO v_count_medium
  FROM public.historial_tareas
  WHERE proveedor = 'caja_sorpresa'
    AND puntos_ganados = 10
    AND creado_el >= v_month_start;

  -- 4. Cuota Gordo: usuarios únicos con premio>=100 este mes
  SELECT count(DISTINCT usuario_id) INTO v_count_big
  FROM public.historial_tareas
  WHERE proveedor = 'caja_sorpresa'
    AND puntos_ganados >= 100
    AND creado_el >= v_month_start;

  -- 5. Seleccionar premio
  v_roll := random();

  IF v_count_big < 3 AND v_roll < 0.003 THEN
    -- Gordo: 100, 200 o 500
    v_prize := CASE floor(random() * 3)
      WHEN 0 THEN 100
      WHEN 1 THEN 200
      ELSE 500
    END;
  ELSIF v_count_medium < 5 AND v_roll < 0.013 THEN
    -- Medio: 10
    v_prize := 10;
  ELSE
    -- Diario: 1, 2 o 3
    v_prize := CASE floor(random() * 3)
      WHEN 0 THEN 1
      WHEN 1 THEN 2
      ELSE 3
    END;
  END IF;

  -- 6. Registrar apertura
  v_fecha_id := 'caja_' || v_user_id::text || '_' || extract(epoch from now())::bigint;

  BEGIN
    INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
    VALUES (v_user_id, v_fecha_id, 'caja_sorpresa', v_prize, 'aprobado');
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('disponible', false, 'tiempoRestante', '12:00:00');
  END;

  -- 7. Acreditar saldo
  PERFORM public.acreditar_saldo_usuario(v_user_id, v_prize);

  -- 8. Premio gordo (>=100): incentivo único de 50 pts al patrocinador
  IF v_prize >= 100 THEN
    SELECT referido_por INTO v_sponsor_id
    FROM public.perfiles WHERE id = v_user_id LIMIT 1;

    IF v_sponsor_id IS NOT NULL THEN
      -- Dedup: verificar que no exista ya un incentivo para este gordo
      SELECT count(*) INTO v_gordo_existe
      FROM public.comisiones_referido
      WHERE tarea_id = 'gordo_' || v_fecha_id;

      IF v_gordo_existe = 0 THEN
        -- Verificar que el sponsor exista
        PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
        IF FOUND THEN
          PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_comision_incentivo);
          INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
          VALUES ('gordo_' || v_fecha_id, v_user_id, v_sponsor_id, v_comision_incentivo, 'incentivo_gordo');
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN json_build_object('disponible', true, 'puntosGanados', v_prize);
END;
$$;

-- ============================================================
-- 13. RPC — aprobar_prueba (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.aprobar_prueba(p_prueba_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
  v_prueba RECORD;
  v_is_anunciante BOOLEAN;
  v_is_admin BOOLEAN;
  v_puntos NUMERIC;
  v_sponsor_id UUID;
  v_comision NUMERIC;
  v_comision_existe INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_user_email := public.get_user_email();

  -- 1. Cargar la prueba con datos de la campaña
  SELECT p.*, c.anunciante_email, c.puntos_recompensa
  INTO v_prueba
  FROM public.pruebas_tareas_locales p
  JOIN public.campanas_locales c ON c.id = p.campana_id
  WHERE p.id = p_prueba_id::bigint
  LIMIT 1;

  IF v_prueba.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prueba no encontrada');
  END IF;

  -- 2. Verificar autorización
  v_is_anunciante := (v_prueba.anunciante_email = v_user_email);
  v_is_admin := public.is_admin();

  IF NOT v_is_anunciante AND NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'No tenés permisos para aprobar esta prueba');
  END IF;

  -- 3. Marcar como aprobado (guard anti-doble)
  UPDATE public.pruebas_tareas_locales
  SET estado = 'aprobado'
  WHERE id = p_prueba_id::bigint
    AND estado IN ('pendiente', 'en_disputa');

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'La prueba ya fue procesada');
  END IF;

  -- 4. Incrementar visitas
  PERFORM public.incrementar_visitas_campana(v_prueba.campana_id);

  -- 5. Insertar en historial + acreditar saldo + comisión
  v_puntos := COALESCE(v_prueba.puntos_recompensa, 0);

  IF v_puntos > 0 THEN
    INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
    VALUES (v_prueba.usuario_id, v_prueba.campana_id::text, 'tarea_local', v_puntos, 'aprobado');

    PERFORM public.acreditar_saldo_usuario(v_prueba.usuario_id, v_puntos);

    -- 6. Comisión 10% al patrocinador
    SELECT referido_por INTO v_sponsor_id
    FROM public.perfiles WHERE id = v_prueba.usuario_id LIMIT 1;

    IF v_sponsor_id IS NOT NULL THEN
      PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
      IF FOUND THEN
        v_comision := ROUND(v_puntos * 0.10, 4);

        -- Dedup: verificar que no exista ya una comisión para esta prueba
        SELECT count(*) INTO v_comision_existe
        FROM public.comisiones_referido
        WHERE tarea_id = p_prueba_id AND proveedor = 'tarea_local';

        IF v_comision_existe = 0 THEN
          PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_comision);
          INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
          VALUES (p_prueba_id, v_prueba.usuario_id, v_sponsor_id, v_comision, 'tarea_local');
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- 14. RPC — rechazar_prueba (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.rechazar_prueba(
  p_prueba_id TEXT,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
  v_prueba RECORD;
  v_is_anunciante BOOLEAN;
  v_is_admin BOOLEAN;
  v_patch JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_user_email := public.get_user_email();

  -- Cargar la prueba con datos de la campaña
  SELECT p.*, c.anunciante_email
  INTO v_prueba
  FROM public.pruebas_tareas_locales p
  JOIN public.campanas_locales c ON c.id = p.campana_id
  WHERE p.id = p_prueba_id::bigint
  LIMIT 1;

  IF v_prueba.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prueba no encontrada');
  END IF;

  -- Verificar autorización
  v_is_anunciante := (v_prueba.anunciante_email = v_user_email);
  v_is_admin := public.is_admin();

  IF NOT v_is_anunciante AND NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'No tenés permisos para rechazar esta prueba');
  END IF;

  -- Marcar como rechazado (guard anti-doble)
  IF p_motivo IS NOT NULL AND p_motivo != '' THEN
    UPDATE public.pruebas_tareas_locales
    SET estado = 'rechazado', rechazo_motivo = p_motivo
    WHERE id = p_prueba_id::bigint
      AND estado IN ('pendiente', 'en_disputa');
  ELSE
    UPDATE public.pruebas_tareas_locales
    SET estado = 'rechazado'
    WHERE id = p_prueba_id::bigint
      AND estado IN ('pendiente', 'en_disputa');
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'La prueba ya fue procesada');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- 15. RPC — iniciar_disputa (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.iniciar_disputa(
  p_prueba_id TEXT,
  p_motivo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_prueba RECORD;
  v_horas NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_motivo IS NULL OR p_motivo = '' THEN
    RETURN json_build_object('success', false, 'error', 'Motivo requerido');
  END IF;

  -- Cargar la prueba
  SELECT id, usuario_id, estado, disputa_motivo, creado_el
  INTO v_prueba
  FROM public.pruebas_tareas_locales
  WHERE id = p_prueba_id::bigint
  LIMIT 1;

  IF v_prueba.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prueba no encontrada');
  END IF;

  -- Verificar propiedad
  IF v_prueba.usuario_id != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'No tenés permisos sobre esta prueba');
  END IF;

  -- Verificar que esté rechazada
  IF v_prueba.estado != 'rechazado' THEN
    RETURN json_build_object('success', false, 'error', 'Solo se puede apelar una prueba rechazada');
  END IF;

  -- Verificar que no tenga disputa previa
  IF v_prueba.disputa_motivo IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ya enviaste una disputa para esta prueba');
  END IF;

  -- Verificar límite de 24 horas
  v_horas := extract(epoch from (now() - v_prueba.creado_el)) / 3600;
  IF v_horas >= 24 THEN
    RETURN json_build_object('success', false, 'error', 'El plazo de 24 horas para apelar ha expirado');
  END IF;

  -- Iniciar disputa (guard anti-doble)
  UPDATE public.pruebas_tareas_locales
  SET estado = 'en_disputa', disputa_motivo = p_motivo
  WHERE id = p_prueba_id::bigint
    AND estado = 'rechazado'
    AND disputa_motivo IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No se pudo iniciar la disputa');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- 16. RPC — rechazar_retiro (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.rechazar_retiro(
  p_retiro_id TEXT,
  p_comentario TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_retiro RECORD;
  v_comentario_text TEXT;
BEGIN
  v_is_admin := public.is_admin();
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden');
  END IF;

  SELECT id, user_id, puntos_solicitados, estado
  INTO v_retiro
  FROM public.retiros
  WHERE id = p_retiro_id::bigint
  LIMIT 1;

  IF v_retiro.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Retiro no encontrado');
  END IF;

  IF v_retiro.estado != 'pendiente' THEN
    RETURN json_build_object('success', false, 'error', 'El retiro no está pendiente');
  END IF;

  v_comentario_text := COALESCE(NULLIF(TRIM(p_comentario), ''), 'Rechazado por administración');

  -- Marcar como rechazado (guard anti-doble)
  UPDATE public.retiros
  SET estado = 'rechazado', comentario_administrador = v_comentario_text
  WHERE id = p_retiro_id::bigint AND estado = 'pendiente';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'El retiro ya fue procesado');
  END IF;

  -- Reembolsar atómicamente
  PERFORM public.reembolsar_retiro_usuario(v_retiro.user_id, v_retiro.puntos_solicitados);

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- 17. RPC — buscar_referido (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.buscar_referido(p_codigo TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sponsor_id UUID;
  v_caller_id UUID := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  -- Buscar por codigo_referido
  SELECT id INTO v_sponsor_id
  FROM public.perfiles
  WHERE codigo_referido = p_codigo
  LIMIT 1;

  -- Si no encuentra por código, intentar por ID
  IF v_sponsor_id IS NULL THEN
    BEGIN
      SELECT id INTO v_sponsor_id
      FROM public.perfiles
      WHERE id = p_codigo::uuid
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      v_sponsor_id := NULL;
    END;
  END IF;

  -- No permitir auto-referido
  IF v_sponsor_id = v_caller_id THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  RETURN json_build_object('sponsor_id', v_sponsor_id);
END;
$$;

-- ============================================================
-- 18. RPC — get_ganadores_recientes (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ganadores_recientes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ganadores', '[]'::jsonb);
  END IF;

  RETURN json_build_object(
    'ganadores',
    COALESCE(
      (SELECT json_agg(json_build_object(
        'userId', left(usuario_id::text, 8),
        'puntos', puntos_ganados,
        'proveedor', CASE proveedor
          WHEN 'tarea_local' THEN 'Tarea local'
          WHEN 'monetag_video' THEN 'Video patrocinado'
          WHEN 'caja_sorpresa' THEN 'Caja sorpresa'
          WHEN 'cpx_research' THEN 'Encuesta CPX'
          WHEN 'theoremreach' THEN 'Encuesta TheoremReach'
          WHEN 'timewall' THEN 'TimeWall'
          ELSE COALESCE(proveedor, 'Tarea')
        END,
        'creado_el', creado_el
      ))
      FROM public.historial_tareas
      WHERE estado = 'aprobado' AND puntos_ganados > 0
      ORDER BY creado_el DESC
      LIMIT 20),
      '[]'::jsonb
    )
  );
END;
$$;

-- ============================================================
-- 19. RPC — get_mis_referidos (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_mis_referidos()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT json_build_object(
    'success', true,
    'total_referidos', count(r),
    'total_ganado', COALESCE(sum(c.comision), 0),
    'total_pendiente', COALESCE(sum(cp.comision_estimada), 0),
    'referidos', json_agg(
      json_build_object(
        'id', r.id,
        'email', CASE
          WHEN r.email IS NULL OR r.email = '' THEN '—'
          ELSE left(split_part(r.email, '@', 1), 2) || '***@' || split_part(r.email, '@', 2)
        END,
        'comision_acreditada', COALESCE(c.comision, 0),
        'comision_pendiente', COALESCE(cp.comision_estimada, 0),
        'registrado', r.created_at
      )
    )
  )
  INTO v_result
  FROM public.perfiles r
  LEFT JOIN (
    SELECT usuario_id, sum(comision) AS comision
    FROM public.comisiones_referido
    WHERE sponsor_id = v_user_id
    GROUP BY usuario_id
  ) c ON c.usuario_id = r.id
  LEFT JOIN (
    SELECT usuario_id, sum(comision_estimada) AS comision_estimada
    FROM public.comisiones_pendientes
    WHERE procesado = false
    GROUP BY usuario_id
  ) cp ON cp.usuario_id = r.id
  WHERE r.referido_por = v_user_id;

  IF v_result IS NULL THEN
    RETURN json_build_object('success', true, 'total_referidos', 0, 'total_ganado', 0, 'total_pendiente', 0, 'referidos', '[]'::jsonb);
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 20. RPC — get_aviso_activo (reemplaza backend function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_aviso_activo()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_aviso RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('aviso', null);
  END IF;

  SELECT id, titulo, mensaje, tipo, activo
  INTO v_aviso
  FROM public.avisos_sistema
  WHERE activo = true AND titulo != 'TIMEWALL_MANTENIMIENTO'
  ORDER BY created_date DESC
  LIMIT 1;

  IF v_aviso.id IS NULL THEN
    RETURN json_build_object('aviso', null);
  END IF;

  RETURN json_build_object(
    'aviso',
    json_build_object('id', v_aviso.id, 'titulo', v_aviso.titulo, 'mensaje', v_aviso.mensaje, 'tipo', v_aviso.tipo, 'activo', v_aviso.activo)
  );
END;
$$;

-- ============================================================
-- 21. RPC — get_timewall_mantenimiento
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_timewall_mantenimiento()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_aviso RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('en_mantenimiento', false, 'mensaje', 'Próximamente');
  END IF;

  SELECT activo, mensaje
  INTO v_aviso
  FROM public.avisos_sistema
  WHERE titulo = 'TIMEWALL_MANTENIMIENTO'
  ORDER BY created_date DESC
  LIMIT 1;

  RETURN json_build_object(
    'en_mantenimiento', v_aviso.activo = true,
    'mensaje', COALESCE(v_aviso.mensaje, 'Próximamente')
  );
END;
$$;

-- ============================================================
-- 22. RPC — set_timewall_mantenimiento (solo admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_timewall_mantenimiento(
  p_activo BOOLEAN,
  p_mensaje TEXT DEFAULT 'Próximamente'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_aviso_id UUID;
BEGIN
  v_is_admin := public.is_admin();
  IF NOT v_is_admin THEN
    RETURN json_build_object('error', 'Forbidden');
  END IF;

  SELECT id INTO v_aviso_id
  FROM public.avisos_sistema
  WHERE titulo = 'TIMEWALL_MANTENIMIENTO'
  ORDER BY created_date DESC
  LIMIT 1;

  IF v_aviso_id IS NOT NULL THEN
    UPDATE public.avisos_sistema
    SET activo = p_activo, mensaje = left(p_mensaje, 1000), updated_date = now()
    WHERE id = v_aviso_id;
  ELSE
    INSERT INTO public.avisos_sistema (titulo, mensaje, tipo, activo)
    VALUES ('TIMEWALL_MANTENIMIENTO', left(p_mensaje, 1000), 'warning', p_activo);
  END IF;

  RETURN json_build_object('en_mantenimiento', p_activo, 'mensaje', left(p_mensaje, 1000));
END;
$$;

-- ============================================================
-- 23. TRIGGER — bono de bienvenida (re-crear por si no existe)
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_bono_bienvenida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_existe INT;
BEGIN
  IF NEW.id IS NULL THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_existe
  FROM public.historial_tareas
  WHERE usuario_id = NEW.id AND tarea_externa_id = 'bono_' || NEW.id::text;

  IF v_existe > 0 THEN RETURN NEW; END IF;

  INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
  VALUES (NEW.id, 'bono_' || NEW.id::text, 'bono_bienvenida', 500, 'aprobado');

  UPDATE public.perfiles
  SET saldo_disponible = COALESCE(saldo_disponible, 0) + 500
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
-- 24. RLS — permitir lectura de codigo_referido para buscar_referido
-- ============================================================
-- La función buscar_referido ya usa SECURITY DEFINER (bypass RLS),
-- así que no necesitamos cambiar la política de perfiles.

-- ============================================================
-- 25. RLS — permitir lectura de historial_tareas para get_ganadores
-- ============================================================
-- La función get_ganadores_recientes ya usa SECURITY DEFINER (bypass RLS),
-- así que no necesitamos cambiar la política de historial_tareas.

-- ============================================================
-- 26. CHECK CONSTRAINT — historial_tareas.proveedor
-- ============================================================
ALTER TABLE public.historial_tareas DROP CONSTRAINT IF EXISTS historial_tareas_proveedor_check;
ALTER TABLE public.historial_tareas ADD CONSTRAINT historial_tareas_proveedor_check
  CHECK (proveedor IN ('tarea_local', 'monetag_video', 'caja_sorpresa', 'cpx_research',
    'theoremreach', 'timewall', 'bono_bienvenida'));

-- ============================================================
-- 27. CHECK CONSTRAINT — retiros.metodo_pago
-- ============================================================
ALTER TABLE public.retiros DROP CONSTRAINT IF EXISTS retiros_metodo_pago_check;
ALTER TABLE public.retiros ADD CONSTRAINT retiros_metodo_pago_check
  CHECK (metodo_pago IN ('mercadopago', 'payoneer', 'bitcoin'));

-- ============================================================
-- 27b. RPC — auto_aprobar_tareas_vencidas (reemplaza backend function)
-- ============================================================
-- Aprueba automáticamente pruebas pendientes con más de 48h sin revisar.
-- Acredita saldo al usuario + comisión 10% al patrocinador.
-- ADEMÁS barre campañas activas sin cupos restantes e invoca
-- reintegrar_saldo_campana para devolver el saldo sobrante al anunciante
-- (trigger 2: vencimiento por inactividad).
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
  v_ahora TIMESTAMPTZ := now();
  v_limite TIMESTAMPTZ := now() - interval '48 hours';
  v_camp RECORD;
  v_reint INT := 0;
BEGIN
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
-- 27b2. RPC — administrar_estado_campana (Trigger 1: pausar/desactivar)
-- ============================================================
-- Desactiva una campaña (activa=false) y, si no fue ya reintegrada y
-- tiene cupos sobrantes, invoca reintegrar_saldo_campana atómicamente
-- en la misma transacción (devuelve el sobrante al saldo_promocion del
-- anunciante). Autorización: admin o anunciante propietario.
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
-- 27c. RPC — procesar_comisiones_pendientes (reemplaza pg_cron anterior)
-- ============================================================
-- Procesa comisiones pendientes de referidos con más de 24h.
-- Descarta las que fueron revertidas por el proveedor.
-- DROP primero: la versión anterior en comisiones_pendientes.sql retorna VOID.
DROP FUNCTION IF EXISTS public.procesar_comisiones_pendientes();
CREATE OR REPLACE FUNCTION public.procesar_comisiones_pendientes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_reverted INT;
  v_sponsor_id UUID;
  v_errm TEXT;
  v_errstate TEXT;
  v_procesadas INT := 0;
  v_descartadas INT := 0;
  v_fallidas INT := 0;
  v_limite TIMESTAMPTZ := now() - interval '24 hours';
BEGIN
  FOR v_pending IN
    SELECT cp.id, cp.usuario_id, cp.tarea_externa_id, cp.proveedor, cp.comision_estimada
    FROM public.comisiones_pendientes cp
    WHERE cp.procesado = false AND cp.creado_el < v_limite
  LOOP
    -- Aislamiento del fallo por fila: un error aislado no aborta el ciclo.
    BEGIN
      -- Verificar si la tarea fue revertida
      SELECT count(*) INTO v_reverted
      FROM public.historial_tareas
      WHERE tarea_externa_id = v_pending.tarea_externa_id
        AND proveedor = v_pending.proveedor
        AND estado = 'reversado';

      IF v_reverted > 0 THEN
        -- Descartar (no acreditar comisión)
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- Buscar patrocinador
      SELECT referido_por INTO v_sponsor_id
      FROM public.perfiles WHERE id = v_pending.usuario_id LIMIT 1;

      IF v_sponsor_id IS NULL THEN
        -- Trazabilidad: el usuario no tiene patrocinador. No es pagable.
        RAISE WARNING 'procesar_comisiones_pendientes: comisión % (tarea %, proveedor %) sin patrocinador (usuario % no tiene referido_por); se marca descartada para evitar re-procesos',
          v_pending.id, v_pending.tarea_externa_id, v_pending.proveedor, v_pending.usuario_id;
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- Sponsor eliminado: el patrocinador ya no existe en perfiles.
      PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
      IF NOT FOUND THEN
        RAISE WARNING 'procesar_comisiones_pendientes: comisión % (tarea %, proveedor %) con patrocinador eliminado (sponsor % no existe en perfiles); se marca descartada para evitar re-procesos',
          v_pending.id, v_pending.tarea_externa_id, v_pending.proveedor, v_sponsor_id;
        UPDATE public.comisiones_pendientes
        SET procesado = true, procesado_el = now(), acreditado = false
        WHERE id = v_pending.id;
        v_descartadas := v_descartadas + 1;
        CONTINUE;
      END IF;

      -- Acreditar comisión (10%)
      PERFORM public.incrementar_saldo_referido(v_sponsor_id, v_pending.comision_estimada);
      INSERT INTO public.comisiones_referido (tarea_id, usuario_id, sponsor_id, comision, proveedor)
      VALUES (v_pending.tarea_externa_id, v_pending.usuario_id, v_sponsor_id, v_pending.comision_estimada, v_pending.proveedor);

      -- Marcar como procesado SOLO tras acreditar correctamente
      UPDATE public.comisiones_pendientes
      SET procesado = true, procesado_el = now(), acreditado = true
      WHERE id = v_pending.id;
      v_procesadas := v_procesadas + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Aislamiento del fallo: se registra el detalle, la fila queda
        -- procesado=false y se reintenta en el próximo ciclo. El resto del
        -- lote continúa pagándose en esta misma ejecución.
        GET STACKED DIAGNOSTICS v_errm = MESSAGE_TEXT, v_errstate = RETURNED_SQLSTATE;
        RAISE WARNING 'procesar_comisiones_pendientes: falló el procesamiento de la comisión % (tarea %, proveedor %) — SQLSTATE %, detalle: %. Se deja pendiente para reintento en el próximo ciclo',
          v_pending.id, v_pending.tarea_externa_id, v_pending.proveedor, v_errstate, v_errm;
        v_fallidas := v_fallidas + 1;
    END;
  END LOOP;

  RETURN json_build_object('procesadas', v_procesadas, 'descartadas', v_descartadas, 'fallidas', v_fallidas);
END;
$$;

-- ============================================================
-- 28. pg_cron — procesar ciclo de facturación semanal
-- ============================================================
-- pg_cron no viene activo por defecto en un proyecto Supabase nuevo.
-- Se habilita acá (una sola vez) para que los trabajos programados de
-- abajo puedan crearse sin un paso manual previo en el panel.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Jueves 16:00 Argentina (UTC-3) = 19:00 UTC
SELECT cron.unschedule('procesar-ciclo-facturacion') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'procesar-ciclo-facturacion'
);

SELECT cron.schedule(
  'procesar-ciclo-facturacion',
  '0 19 * * 4',  -- Jueves 19:00 UTC = 16:00 Argentina
  $$
  SELECT count(*) FROM public.perfiles p
  WHERE p.saldo_disponible >= 5000
    AND COALESCE(p.retener_pagos, false) = false
    AND (
      p.ultimo_ciclo_procesado IS NULL
      OR p.ultimo_ciclo_procesado != (
        to_char(now() AT TIME ZONE 'America/Buenos_Aires', 'YYYY-MM-DD')
      )
    )
    AND public.procesar_ciclo_usuario(
      p.id,
      to_char(now() AT TIME ZONE 'America/Buenos_Aires', 'YYYY-MM-DD'),
      5000,
      COALESCE(p.metodo_pago_preferido, 'payoneer'),
      COALESCE(p.destino_pago, ''),
      COALESCE(p.titular_pago, '')
    ) = true
  $$ 
);

-- ============================================================
-- 29. pg_cron — auto aprobar vencidas (verificar que exista)
-- ============================================================
SELECT cron.unschedule('auto-aprobar-tareas-vencidas') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-aprobar-tareas-vencidas'
);
SELECT cron.schedule(
  'auto-aprobar-tareas-vencidas',
  '0 * * * *',
  $$SELECT public.auto_aprobar_tareas_vencidas();$$
);

-- ============================================================
-- 30. pg_cron — procesar comisiones pendientes (verificar que exista)
-- ============================================================
SELECT cron.unschedule('procesar-comisiones-pendientes') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'procesar-comisiones-pendientes'
);
SELECT cron.schedule(
  'procesar-comisiones-pendientes',
  '0 * * * *',
  $$SELECT public.procesar_comisiones_pendientes();$$
);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;