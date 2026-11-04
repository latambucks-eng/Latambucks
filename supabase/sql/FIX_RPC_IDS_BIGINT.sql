-- ============================================================
-- LATAMBUCKS — FIX CRÍTICO: los IDs son BIGINT, no UUID
-- ============================================================
-- BUG ENCONTRADO (verificado contra la base real):
--   Las tablas pruebas_tareas_locales, retiros y campanas_locales usan
--   id BIGINT (1, 2, 3…). Pero 4 funciones hacían `p_prueba_id::uuid`
--   → PostgreSQL responde: operator does not exist: bigint = uuid (42883).
--
--   Efecto real (probado con usuarios reales):
--     · Anunciante aprueba una prueba            → ERROR 404
--     · Anunciante rechaza una prueba            → ERROR 404
--     · Usuario apela una prueba rechazada       → ERROR 404
--     · Admin rechaza un retiro                  → ERROR 404
--   Es decir: la revisión de tareas, las disputas y el rechazo de retiros
--   no funcionaban para nadie.
--
--   Además, buscar_referido rompía con 400 cuando el código ingresado no
--   era un UUID (invalid input syntax for type uuid).
--
-- SOLUCIÓN: se recrean las 5 funciones con el tipo correcto (::bigint) y
-- la búsqueda por código protegida. Firmas y permisos quedan iguales, así
-- que el frontend no necesita ningún cambio.
--
-- Idempotente: se puede ejecutar varias veces.
-- Pegar todo en Supabase → SQL Editor → Run.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. aprobar_prueba
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

  SELECT p.*, c.anunciante_email, c.puntos_recompensa
  INTO v_prueba
  FROM public.pruebas_tareas_locales p
  JOIN public.campanas_locales c ON c.id = p.campana_id
  WHERE p.id = p_prueba_id::bigint
  LIMIT 1;

  IF v_prueba.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prueba no encontrada');
  END IF;

  v_is_anunciante := (v_prueba.anunciante_email = v_user_email);
  v_is_admin := public.is_admin();

  IF NOT v_is_anunciante AND NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'No tenés permisos para aprobar esta prueba');
  END IF;

  UPDATE public.pruebas_tareas_locales
  SET estado = 'aprobado'
  WHERE id = p_prueba_id::bigint
    AND estado IN ('pendiente', 'en_disputa');

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'La prueba ya fue procesada');
  END IF;

  PERFORM public.incrementar_visitas_campana(v_prueba.campana_id);

  v_puntos := COALESCE(v_prueba.puntos_recompensa, 0);

  IF v_puntos > 0 THEN
    INSERT INTO public.historial_tareas (usuario_id, tarea_externa_id, proveedor, puntos_ganados, estado)
    VALUES (v_prueba.usuario_id, v_prueba.campana_id::text, 'tarea_local', v_puntos, 'aprobado');

    PERFORM public.acreditar_saldo_usuario(v_prueba.usuario_id, v_puntos);

    SELECT referido_por INTO v_sponsor_id
    FROM public.perfiles WHERE id = v_prueba.usuario_id LIMIT 1;

    IF v_sponsor_id IS NOT NULL THEN
      PERFORM 1 FROM public.perfiles WHERE id = v_sponsor_id LIMIT 1;
      IF FOUND THEN
        v_comision := ROUND(v_puntos * 0.10, 4);

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
-- 2. rechazar_prueba
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
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_user_email := public.get_user_email();

  SELECT p.*, c.anunciante_email
  INTO v_prueba
  FROM public.pruebas_tareas_locales p
  JOIN public.campanas_locales c ON c.id = p.campana_id
  WHERE p.id = p_prueba_id::bigint
  LIMIT 1;

  IF v_prueba.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prueba no encontrada');
  END IF;

  v_is_anunciante := (v_prueba.anunciante_email = v_user_email);
  v_is_admin := public.is_admin();

  IF NOT v_is_anunciante AND NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'No tenés permisos para rechazar esta prueba');
  END IF;

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
-- 3. iniciar_disputa
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

  SELECT id, usuario_id, estado, disputa_motivo, creado_el
  INTO v_prueba
  FROM public.pruebas_tareas_locales
  WHERE id = p_prueba_id::bigint
  LIMIT 1;

  IF v_prueba.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prueba no encontrada');
  END IF;

  IF v_prueba.usuario_id != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'No tenés permisos sobre esta prueba');
  END IF;

  IF v_prueba.estado != 'rechazado' THEN
    RETURN json_build_object('success', false, 'error', 'Solo se puede apelar una prueba rechazada');
  END IF;

  IF v_prueba.disputa_motivo IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ya enviaste una disputa para esta prueba');
  END IF;

  v_horas := extract(epoch from (now() - v_prueba.creado_el)) / 3600;
  IF v_horas >= 24 THEN
    RETURN json_build_object('success', false, 'error', 'El plazo de 24 horas para apelar ha expirado');
  END IF;

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
-- 4. rechazar_retiro (admin)
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

  UPDATE public.retiros
  SET estado = 'rechazado', comentario_administrador = v_comentario_text
  WHERE id = p_retiro_id::bigint AND estado = 'pendiente';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'El retiro ya fue procesado');
  END IF;

  PERFORM public.reembolsar_retiro_usuario(v_retiro.user_id, v_retiro.puntos_solicitados);

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- 5. buscar_referido — el cast a UUID ya no rompe la búsqueda
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
  IF v_caller_id IS NULL OR p_codigo IS NULL OR TRIM(p_codigo) = '' THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  -- 1. Buscar por código de referido (LB-XXXXXX)
  SELECT id INTO v_sponsor_id
  FROM public.perfiles
  WHERE upper(codigo_referido) = upper(TRIM(p_codigo))
  LIMIT 1;

  -- 2. Si no aparece, intentar por ID (solo cuando es un UUID válido)
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

  IF v_sponsor_id = v_caller_id THEN
    RETURN json_build_object('sponsor_id', null);
  END IF;

  RETURN json_build_object('sponsor_id', v_sponsor_id);
END;
$$;

-- ============================================================
-- 6. Permisos (los mismos de antes)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.aprobar_prueba(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rechazar_prueba(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.iniciar_disputa(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rechazar_retiro(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.buscar_referido(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.aprobar_prueba(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rechazar_prueba(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.iniciar_disputa(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rechazar_retiro(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.buscar_referido(TEXT) TO authenticated, service_role;

COMMIT;

-- ============================================================
-- VERIFICACIÓN — todo debe decir OK
-- ============================================================
SELECT p.proname AS funcion,
       CASE
         WHEN p.prosrc LIKE '%_id::uuid%' THEN 'SIGUE CON BUG'
         WHEN p.prosrc LIKE '%_id::bigint%' THEN 'OK'
         ELSE 'revisar'
       END AS estado
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('aprobar_prueba', 'rechazar_prueba', 'iniciar_disputa', 'rechazar_retiro')
ORDER BY p.proname;

-- Tipos reales de los IDs (deben ser bigint)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('pruebas_tareas_locales', 'retiros', 'campanas_locales')
  AND column_name IN ('id', 'campana_id')
ORDER BY table_name, column_name;