-- ============================================================
-- LatamBucks — FIX DE SEGURIDAD: RPCs que mueven saldo
-- ============================================================
-- CERRAR HALLAZGO CRITICO #2 del reporte:
--   reintegrar_saldo_campana(INTEGER) era SECURITY DEFINER y estaba
--   GRANTED a 'authenticated' SIN ningún chequeo de autorización interno.
--   Cualquier usuario logueado podía pasar el ID de UNA CAMPAÑA AJENA,
--   desactivarla (activa=false) y mover el sobrante al saldo del
--   anunciante (daño de disponibilidad/pausa arbitraria de campañas).
--
-- SOLUCION:
--   REVOKE EXECUTE ... FROM authenticated (y PUBLIC, anon) sobre la RPC:
--   ya no es alcanzable por ningún usuario vía RPC directo. Se conserva
--   la ejecución interna: administrar_estado_campana y
--   auto_aprobar_tareas_vencidas la llaman como SECURITY DEFINER
--   (con permisos del owner), por lo que NO se rompe el flujo.
--   NOTA: NO se agrega chequeo interno de auth.uid()/is_admin() porque eso
--   bloquearía al anunciante propietario legítimo que pausa su propia
--   campaña (auth.uid() no-NULL, is_admin() false) vía administrar_estado_
--   campana. El REVOKE a authenticated/anon ya es la protección correcta.
--
--   Ademas se agrega la RPC activar_campana_con_saldo: el flujo de pago
--   con saldo ya NO descuenta saldo desde el cliente (updatePerfil directo,
--   que el trigger de perfiles ahora bloquea). En su lugar, una RPC
--   SECURITY DEFINER valida auth, autorizacion (anunciante == caller o
--   admin), saldo suficiente, y descuenta el saldo + crea la campaña
--   ATOMICAMENTE en una transaccion.
--   Orden de consumo: saldo_bono (bono bienvenida, SIN 30% comisión) →
--   saldo_promocion (reintegros, CON 30%) → saldo_disponible no-bono
--   (ganancias, CON 30%). La comisión del 30% NO aplica al bono.
--
-- EJECUTAR TODO en orden en el SQL Editor de Supabase. IDEMPOTENTE.
-- ============================================================

-- ------------------------------------------------------------
-- Parte 1: blindar reintegrar_saldo_campana
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reintegrar_saldo_campana(INTEGER) FROM authenticated;

-- La función se deja SIN cambios en su cuerpo (no se le agrega chequeo de
-- auth para no romper el reintegro legítimo del anunciante vía
-- administrar_estado_campana). El REVOKE superior ya impide la llamada
-- directa desde el cliente.
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
  v_reintegro_pts numeric;
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
  -- Convertir USD a puntos (1000 pts = 1 USD): saldo_promocion se guarda en PUNTOS.
  v_reintegro_pts := v_reintegro * 1000;

  SELECT id INTO v_anunciante_id FROM perfiles WHERE email = v_campana.anunciante_email LIMIT 1;

  IF v_anunciante_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Anunciante no encontrado en perfiles');
  END IF;

  UPDATE perfiles SET saldo_promocion = COALESCE(saldo_promocion, 0) + v_reintegro_pts WHERE id = v_anunciante_id;
  UPDATE campanas_locales SET reintegrado = true, activa = false WHERE id = p_campana_id;

  RETURN json_build_object('success', true, 'reintegro', v_reintegro, 'cupos_sobrantes', v_cupos_sobrantes, 'anunciante_id', v_anunciante_id);
END;
$$;

-- ------------------------------------------------------------
-- Parte 2: activar_campana_con_saldo — pago con saldo server-side
-- ------------------------------------------------------------
-- Crea una campaña financiada con el saldo_promocion interno del
-- anunciante. Valida server-side:
--   - auth.uid() presente (usuario autenticado)
--   - autorizacion: anunciante_email == email del caller (o admin)
--   - saldo_promocion suficiente para cubrir el monto
--   - monto/puntos validos (minimos)
-- Y en la MISMA transaccion: descuenta el saldo y crea la campaña
-- activa/aprobada. Reemplaza el par (updatePerfil + insertCampanaLocal)
-- que el frontend hacía por separado (y que permitía auto-incrementar
-- saldo_promocion).
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
  v_saldo_disponible numeric;
  v_saldo_bono numeric;
  v_total numeric;
  v_de_bono numeric;
  v_de_promocion numeric;
  v_de_disponible numeric;
  v_monto_pts numeric;
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

  -- Convertir monto USD a puntos (1000 pts = 1 USD). Los saldos en
  -- perfiles están en PUNTOS; el monto de la campaña llega en USD.
  v_monto_pts := p_monto * 1000;

  -- Saldo suficiente: bloquear fila del perfil (FOR UPDATE) para evitar
  -- carreras entre dos campañas simultáneas del mismo anunciante.
  -- Orden de consumo: PRIMERO saldo_bono (bono de bienvenida, SIN comisión),
  -- luego saldo_promocion (reintegros), luego saldo_disponible no-bono
  -- (ganancias). saldo_bono es un tracker que vive dentro de saldo_disponible.
  SELECT saldo_promocion, saldo_disponible, saldo_bono
  INTO v_saldo_promocion, v_saldo_disponible, v_saldo_bono
  FROM public.perfiles
  WHERE id = v_uid
  FOR UPDATE;

  v_saldo_promocion := COALESCE(v_saldo_promocion, 0);
  v_saldo_disponible := COALESCE(v_saldo_disponible, 0);
  v_saldo_bono := COALESCE(v_saldo_bono, 0);
  v_total := v_saldo_promocion + v_saldo_disponible;

  IF v_monto_pts > v_total THEN
    RETURN json_build_object('success', false, 'error',
      'Tu saldo disponible es ' || (v_total / 1000) || ' USD. Elegí un monto menor o igual.');
  END IF;

  -- 1) Bono de bienvenida: consumir primero, SIN comisión (en puntos).
  v_de_bono := LEAST(v_saldo_bono, v_saldo_disponible, v_monto_pts);
  v_saldo_disponible := v_saldo_disponible - v_de_bono;
  v_saldo_bono := v_saldo_bono - v_de_bono;

  -- 2) Saldo promocional (reintegros): segundo, CON comisión (en puntos).
  v_de_promocion := LEAST(v_saldo_promocion, v_monto_pts - v_de_bono);
  v_saldo_promocion := v_saldo_promocion - v_de_promocion;

  -- 3) Saldo disponible no-bono (ganancias): tercero, CON comisión (en puntos).
  v_de_disponible := v_monto_pts - v_de_bono - v_de_promocion;

  -- Comision 30% solo sobre la porción NO-bono. Convertir a USD para
  -- guardar en ganancia_plataforma (que está en USD).
  v_ganancia := ROUND((v_de_promocion + v_de_disponible) * 0.30 / 1000, 2);

  -- Descuento de saldos (en puntos) + creacion de la campaña (atómico).
  UPDATE public.perfiles
  SET saldo_promocion = v_saldo_promocion,
      saldo_disponible = v_saldo_disponible - v_de_disponible,
      saldo_bono = v_saldo_bono
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

  RETURN json_build_object('success', true, 'campana_id', v_campana_id, 'saldo_restante', (v_total - v_monto_pts) / 1000);
END;
$$;

-- Grants: la RPC se ejecuta solo por authenticated (con chequeo interno).
GRANT EXECUTE ON FUNCTION public.activar_campana_con_saldo(TEXT,TEXT,TEXT,INTEGER,NUMERIC,TEXT,TEXT,INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.activar_campana_con_saldo(TEXT,TEXT,TEXT,INTEGER,NUMERIC,TEXT,TEXT,INTEGER) FROM PUBLIC, anon;

-- Verificación de grants
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
  COALESCE(array_to_string(ARRAY(
    SELECT grantee::regrole FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.oid))) WHERE privilege_type = 'EXECUTE'
  ), ', '), 'NONE') AS execute_grantees
FROM pg_proc p
WHERE p.proname IN ('reintegrar_saldo_campana', 'activar_campana_con_saldo');