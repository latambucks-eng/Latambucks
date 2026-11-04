-- ============================================================
-- LatamBucks — SCRIPT DE SEGURIDAD COMPLETO (UN SOLO PEGADO)
-- Ejecutar TODO en el SQL Editor de Supabase, de arriba a abajo.
-- IDEMPOTENTE: se puede volver a ejecutar sin romper nada.
-- ============================================================
-- Cierra los 2 hallazgos críticos del reporte:
--   #1 Escalada de privilegios: PATCH a /perfiles con role='admin' o
--      saldo_disponible=<lo que quiera> (UPDATE REST directo).
--   #2 reintegrar_saldo_campana(INTEGER) alcanzable por cualquier usuario
--      logueado → pausa arbitraria de campañas ajenas + desvío de saldo.
-- Además habilita el pago con saldo promocional de forma segura (server-side).
--
-- IMPORTANTE (no rompe ningún flujo):
--   - Los triggers/RPCs de acreditación (checkin, cajas, video, aprobar_prueba,
--     postbacks de TheoremReach/TimeWall/CPX, cron de facturación, comisiones)
--     corren como service_role o SECURITY DEFINER (owner), NUNCA como
--     'authenticated'. El trigger de perfiles solo bloquea cuando
--     current_user = 'authenticated' (PATCH REST directo del usuario).
-- ============================================================


-- ------------------------------------------------------------
-- PARTE 1 — TRIGGER DE PROTECCIÓN DE PERFILES
-- Cierra hallazgo #1. Bloquea el UPDATE REST directo (rol
-- 'authenticated') sobre columnas sensibles de perfiles (role, id,
-- email, referido_por, codigo_referido, saldos). Los campos que el
-- usuario SÍ edita (destino_pago, titular_pago, retener_pagos, pais)
-- siguen permitidos. Las RPCs DEFINER y service_role no se bloquean.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lb_proteger_actualizacion_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo aplica a actualizaciones hechas por el rol 'authenticated'
  -- (UPDATE REST directo desde el cliente). Las RPCs SECURITY DEFINER
  -- y el service_role corren como otro rol (owner) y NO se bloquean,
  -- para no romper la acreditación legítima de saldos/referidos.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- Usuario autenticado vía REST: no puede tocar columnas sensibles.
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


-- ------------------------------------------------------------
-- PARTE 2 — BLINDAR REINTEGRAR_SALDO_CAMPANA
-- Cierra hallazgo #2. Revoca la ejecución directa a todos los usuarios
-- (authenticated/anon/PUBLIC). La función se conserva SIN cambio de cuerpo:
-- las RPCs internas administrar_estado_campana y auto_aprobar_tareas_vencidas
-- la llaman como SECURITY DEFINER (con permisos del owner), por lo que el
-- flujo legítimo de reintegro NO se rompe.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM authenticated;

-- Se deja la definición explícita (idempotente, mismo cuerpo) para que el
-- deploy quede autocontenido y verificable.
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


-- ------------------------------------------------------------
-- PARTE 3 — ACTIVAR_CAMPANA_CON_SALDO (pago con saldo server-side)
-- Crea una campaña financiada con el saldo_promocion interno. Valida
-- server-side auth, autorización (anunciante == caller o admin), saldo
-- suficiente, mínimos de negocio; y en la MISMA transacción descuenta el
-- saldo y crea la campaña activa/aprobada. Reemplaza el par
-- (updatePerfil de saldo + insertCampanaLocal) que el frontend hacía por
-- separado. Bloquea la fila del perfil (FOR UPDATE) contra carreras.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activar_campana_con_saldo(
  p_titulo TEXT,
  p_enlace_url TEXT,
  p_instrucciones TEXT,
  p_puntos_recompensa INTEGER,
  p_monto NUMERIC,
  p_anunciante_email TEXT,
  p_moneda TEXT,
  p_visitas_compradas INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_caller_email TEXT;
  v_saldo_promocion numeric;
  v_ganancia numeric;
  v_es_admin boolean;
  v_campana_id integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Autorizacion: el anunciante de la campaña debe ser el caller (o admin).
  v_caller_email := public.get_user_email();
  v_es_admin := public.is_admin();
  IF p_anunciante_email IS DISTINCT FROM v_caller_email AND NOT v_es_admin THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden');
  END IF;

  -- Validaciones de negocio (mismos mínimos que el frontend).
  IF COALESCE(p_titulo, '') = '' OR COALESCE(p_enlace_url, '') = '' THEN
    RETURN json_build_object('success', false, 'error', 'Completa todos los campos');
  END IF;
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Monto inválido');
  END IF;
  IF p_puntos_recompensa IS NULL OR p_puntos_recompensa < 30 THEN
    RETURN json_build_object('success', false, 'error', 'Los puntos por usuario deben ser mínimo 30');
  END IF;
  IF p_visitas_compradas IS NULL OR p_visitas_compradas <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cupos inválidos');
  END IF;

  -- Saldo suficiente: bloquear fila del perfil (FOR UPDATE) para evitar
  -- carreras entre dos campañas simultáneas del mismo anunciante.
  SELECT saldo_promocion INTO v_saldo_promocion
  FROM public.perfiles
  WHERE id = v_uid
  FOR UPDATE;

  v_saldo_promocion := COALESCE(v_saldo_promocion, 0);
  IF p_monto > v_saldo_promocion THEN
    RETURN json_build_object('success', false, 'error',
      'Tu saldo promocional es ' || v_saldo_promocion || '. Elegí un monto menor o igual.');
  END IF;

  -- Comision 30% (no reembolsable) del monto invertido.
  v_ganancia := ROUND(p_monto * 0.30, 2);

  -- Descuento del saldo + creacion de la campaña activa/aprobada (atómico).
  UPDATE public.perfiles
  SET saldo_promocion = v_saldo_promocion - p_monto
  WHERE id = v_uid;

  INSERT INTO public.campanas_locales (
    titulo, enlace_url, instrucciones, puntos_recompensa,
    monto_invertido_ars, anunciante_email, moneda, visitas_compradas,
    visitas_actuales, ganancia_plataforma, comprobante_pago_url,
    pago_con_saldo, estado_pago, activa, created_at
  ) VALUES (
    left(p_titulo, 200), p_enlace_url,
    CASE WHEN COALESCE(NULLIF(TRIM(p_instrucciones), ''), '') = '' THEN NULL ELSE left(p_instrucciones, 500) END,
    p_puntos_recompensa, p_monto, p_anunciante_email, COALESCE(p_moneda, 'ARS'),
    p_visitas_compradas, 0, v_ganancia, NULL, true, 'aprobado', true, now()
  )
  RETURNING id INTO v_campana_id;

  RETURN json_build_object('success', true, 'campana_id', v_campana_id, 'saldo_restante', v_saldo_promocion - p_monto);
END;
$$;

-- Grants: la RPC de activación se ejecuta solo por authenticated (con
-- chequeo interno de autorización).
GRANT EXECUTE ON FUNCTION public.activar_campana_con_saldo(TEXT,TEXT,TEXT,INTEGER,NUMERIC,TEXT,TEXT,INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.activar_campana_con_saldo(TEXT,TEXT,TEXT,INTEGER,NUMERIC,TEXT,TEXT,INTEGER) FROM PUBLIC, anon;


-- ============================================================
-- VERIFICACIÓN (opcional — verás que todo quedó aplicado)
-- ============================================================
-- Trigger instalado
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgrelid = 'public.perfiles'::regclass AND NOT tgisinternal;

-- Grants de las RPCs de saldo
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
  COALESCE(array_to_string(ARRAY(
    SELECT grantee::regrole FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.oid))) WHERE privilege_type = 'EXECUTE'
  ), ', '), 'NONE') AS execute_grantees
FROM pg_proc p
WHERE p.proname IN ('reintegrar_saldo_campana', 'activar_campana_con_saldo')
ORDER BY p.proname;