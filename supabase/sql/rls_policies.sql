-- ============================================================
-- LatamBucks — RLS Policies + Fix CHECK constraint
-- ============================================================
-- EJECUTAR TODO en orden en el SQL Editor de Supabase.
-- Es seguro: las políticas son aditivas y no rompen nada.
--
-- Backend functions usan service_role (bypass RLS) → NO se afectan.
-- Entidades Base44 (AvisoSistema, ComisionReferido) → NO se afectan.
-- Solo afecta consultas frontend directas a Supabase.
-- ============================================================

-- ============================================================
-- 0. FUNCIONES HELPER (SECURITY DEFINER = bypass RLS)
-- ============================================================
-- Evitan recursión de RLS y son más eficientes que subqueries.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
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
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM public.perfiles WHERE id = auth.uid();
  RETURN v_email;
END;
$$;

-- Helpers de cruce tablas (bypass RLS → evitan recursión infinita entre
-- pruebas_tareas_locales y campanas_locales). Ver rls_fix_recursion_pruebas.sql
CREATE OR REPLACE FUNCTION public.is_anunciante_campana(p_campana_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campanas_locales
    WHERE id = p_campana_id AND anunciante_email = public.get_user_email()
  );
$$;

CREATE OR REPLACE FUNCTION public.usuario_tiene_prueba_en_campana(
  p_campana_id INTEGER,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pruebas_tareas_locales
    WHERE campana_id = p_campana_id AND usuario_id = p_user_id
  );
$$;

-- ============================================================
-- 1. FIX CHECK CONSTRAINT en retiros.metodo_pago
-- ============================================================
-- Mercado Pago fue ELIMINADO de la plataforma. Los retiros para
-- Argentina son iguales que para el resto de Latam: solo se permite
-- payoneer, airtm y paypal. Esta constraint reemplaza cualquier
-- versión anterior (mercadopago/mercado_pago/bitcoin ya no válidos).

ALTER TABLE public.retiros DROP CONSTRAINT IF EXISTS retiros_metodo_pago_check;
ALTER TABLE public.retiros ADD CONSTRAINT retiros_metodo_pago_check
  CHECK (metodo_pago IN ('payoneer', 'airtm', 'paypal'));

-- ============================================================
-- 2. ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_tareas_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_postbacks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. POLÍTICAS — perfiles
-- ============================================================
-- Usuario lee/edita solo su propio perfil.
-- Admin lee/edita todos.
-- fetchPerfil, insertPerfil, updatePerfil → funcionan.
-- fetchPerfilByCodigo → NO funciona (dead code, reemplazado por
--   buscarReferido backend function con service_role).

DROP POLICY IF EXISTS perfiles_select ON public.perfiles;
CREATE POLICY perfiles_select ON public.perfiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS perfiles_insert ON public.perfiles;
CREATE POLICY perfiles_insert ON public.perfiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
  );

DROP POLICY IF EXISTS perfiles_update ON public.perfiles;
CREATE POLICY perfiles_update ON public.perfiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_admin()
  ) WITH CHECK (
    id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS perfiles_delete ON public.perfiles;
CREATE POLICY perfiles_delete ON public.perfiles
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================
-- 4. POLÍTICAS — retiros
-- ============================================================
-- Usuario lee solo sus retiros (fetchRetiros, fetchRetirosTotales).
-- Admin lee todos (fetchPendingRetiros con JOIN perfiles).
-- Admin actualiza estado (patchRetiro).
-- INSERT: user_id = auth.uid() (frontend) o service_role (backend).

DROP POLICY IF EXISTS retiros_select ON public.retiros;
CREATE POLICY retiros_select ON public.retiros
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS retiros_insert ON public.retiros;
CREATE POLICY retiros_insert ON public.retiros
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS retiros_update ON public.retiros;
CREATE POLICY retiros_update ON public.retiros
  FOR UPDATE USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS retiros_delete ON public.retiros;
CREATE POLICY retiros_delete ON public.retiros
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================
-- 5. POLÍTICAS — historial_tareas
-- ============================================================
-- Usuario lee solo su historial (fetchTareasHoy).
-- Admin lee todos.
-- INSERT: usuario_id = auth.uid() (frontend) o service_role (backend).
-- UPDATE: solo admin/service_role (cambios de estado).

DROP POLICY IF EXISTS historial_tareas_select ON public.historial_tareas;
CREATE POLICY historial_tareas_select ON public.historial_tareas
  FOR SELECT USING (
    usuario_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS historial_tareas_insert ON public.historial_tareas;
CREATE POLICY historial_tareas_insert ON public.historial_tareas
  FOR INSERT WITH CHECK (
    usuario_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS historial_tareas_update ON public.historial_tareas;
CREATE POLICY historial_tareas_update ON public.historial_tareas
  FOR UPDATE USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS historial_tareas_delete ON public.historial_tareas;
CREATE POLICY historial_tareas_delete ON public.historial_tareas
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================
-- 6. POLÍTICAS — campanas_locales
-- ============================================================
-- Cualquiera lee campañas activas+aprobadas (fetchCampanasLocales).
-- Anunciante lee sus propias campañas (checkIsAnunciante, fetchPendingCampanas).
-- Usuario lee campañas donde tiene pruebas (para historial con JOIN).
-- Admin lee/edita todas (fetchPendingCampanas, patchCampana).
-- Anunciante crea campañas (insertCampanaLocal).

DROP POLICY IF EXISTS campanas_locales_select ON public.campanas_locales;
CREATE POLICY campanas_locales_select ON public.campanas_locales
  FOR SELECT USING (
    (activa = true AND estado_pago = 'aprobado')
    OR public.is_admin()
    OR anunciante_email = public.get_user_email()
    OR public.usuario_tiene_prueba_en_campana(id, auth.uid())
  );

DROP POLICY IF EXISTS campanas_locales_insert ON public.campanas_locales;
CREATE POLICY campanas_locales_insert ON public.campanas_locales
  FOR INSERT WITH CHECK (
    anunciante_email = public.get_user_email() OR public.is_admin()
  );

DROP POLICY IF EXISTS campanas_locales_update ON public.campanas_locales;
CREATE POLICY campanas_locales_update ON public.campanas_locales
  FOR UPDATE USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS campanas_locales_delete ON public.campanas_locales;
CREATE POLICY campanas_locales_delete ON public.campanas_locales
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================
-- 7. POLÍTICAS — pruebas_tareas_locales
-- ============================================================
-- Usuario lee/edita sus propias pruebas (fetchPruebasByUsuario,
--   fetchHistorialPruebas, iniciarDisputa, insertPruebaTarea).
-- Anunciante lee/edita pruebas de sus campañas
--   (fetchPendingPruebasForAnunciante, rechazarPrueba).
-- Admin lee/edita todos (fetchPendingDisputas).
-- aprobarPrueba → backend function (service_role), bypass RLS.

DROP POLICY IF EXISTS pruebas_tareas_locales_select ON public.pruebas_tareas_locales;
CREATE POLICY pruebas_tareas_locales_select ON public.pruebas_tareas_locales
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR public.is_admin()
    OR public.is_anunciante_campana(campana_id)
  );

DROP POLICY IF EXISTS pruebas_tareas_locales_insert ON public.pruebas_tareas_locales;
CREATE POLICY pruebas_tareas_locales_insert ON public.pruebas_tareas_locales
  FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
  );

DROP POLICY IF EXISTS pruebas_tareas_locales_update ON public.pruebas_tareas_locales;
CREATE POLICY pruebas_tareas_locales_update ON public.pruebas_tareas_locales
  FOR UPDATE USING (
    usuario_id = auth.uid()
    OR public.is_admin()
    OR public.is_anunciante_campana(campana_id)
  ) WITH CHECK (
    usuario_id = auth.uid()
    OR public.is_admin()
    OR public.is_anunciante_campana(campana_id)
  );

DROP POLICY IF EXISTS pruebas_tareas_locales_delete ON public.pruebas_tareas_locales;
CREATE POLICY pruebas_tareas_locales_delete ON public.pruebas_tareas_locales
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================
-- 8. POLÍTICAS — registro_postbacks
-- ============================================================
-- Sin políticas = denegación total para frontend.
-- Solo service_role (cpxPostback backend function) puede acceder.
-- Esto es correcto: los postbacks son internos, no del usuario.

-- ============================================================
-- 9a. RPC atómico — incrementar_saldo_referido
-- ============================================================
-- Incrementa saldo_disponible y puntos_por_referidos atómicamente.
-- Usado por el helper base44/shared/comisionesReferido.ts (intentará
-- este RPC primero; si no existe, hace fallback a read-then-write).

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
-- 9. RPC atómico — acreditar_saldo_usuario
-- ============================================================
-- Incrementa saldo_disponible atómicamente (evita race conditions).
-- Invocado por el frontend y por las Edge Functions de Supabase
-- (cpx-postback, theoremreach-postback, timewall-postback) con el
-- token de service_role. Las RPCs públicas que acreditan saldo del
-- usuario (video, caja, checkin) lo llaman internamente vía auth.uid().

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
-- 10. RPCs — SECURITY DEFINER
-- ============================================================
-- auto_aprobar_tareas_vencidas: llamada desde frontend, necesita
--   actualizar pruebas e insertar historial_tareas (admin ops).
-- incrementar_saldo_referido: llamada desde backend (service_role),
--   pero SECURITY DEFINER por seguridad.
-- procesar_cierre_ciclo_weekly: llamada desde backend (service_role).

DO $$
DECLARE
  fn_args TEXT;
BEGIN
  -- auto_aprobar_tareas_vencidas
  SELECT pg_get_function_identity_arguments(oid) INTO fn_args
  FROM pg_proc
  WHERE proname = 'auto_aprobar_tareas_vencidas'
    AND pronamespace = 'public'::regnamespace;
  IF fn_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.auto_aprobar_tareas_vencidas(%s) SECURITY DEFINER', fn_args);
  END IF;

  -- incrementar_saldo_referido
  SELECT pg_get_function_identity_arguments(oid) INTO fn_args
  FROM pg_proc
  WHERE proname = 'incrementar_saldo_referido'
    AND pronamespace = 'public'::regnamespace;
  IF fn_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.incrementar_saldo_referido(%s) SECURITY DEFINER', fn_args);
  END IF;

  -- procesar_cierre_ciclo_weekly
  SELECT pg_get_function_identity_arguments(oid) INTO fn_args
  FROM pg_proc
  WHERE proname = 'procesar_cierre_ciclo_weekly'
    AND pronamespace = 'public'::regnamespace;
  IF fn_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.procesar_cierre_ciclo_weekly(%s) SECURITY DEFINER', fn_args);
  END IF;
END;
$$;

-- ============================================================
-- 11. STORAGE — Bucket capturas-tareas
-- ============================================================
-- El bucket es público (lectura sin restricciones).
-- Los anunciantes y admins necesitan ver las capturas para revisar.
-- Escritura: solo usuarios autenticados pueden subir a su propia carpeta.

DROP POLICY IF EXISTS "capturas_upload_own" ON storage.objects;
CREATE POLICY "capturas_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'capturas-tareas'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- ============================================================
-- 12. VERIFICACIÓN — Ejecutar después de aplicar todo
-- ============================================================
-- Esta consulta muestra el estado de RLS y policies por tabla.
-- Debe mostrar 6 tablas con RLS habilitado y sus policies.

-- SELECT
--   schemaname AS schema,
--   tablename AS tabla,
--   rowsecurity AS rls_activo,
--   policyname AS politica,
--   cmd AS comando,
--   qual AS expresion
-- FROM pg_policies
-- JOIN pg_tables ON tablename = tablename
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- Verificación rápida: debe devolver 6 filas con rowsecurity = true
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN
--   ('perfiles','retiros','historial_tareas','campanas_locales',
--    'pruebas_tareas_locales','registro_postbacks');

-- ============================================================
-- 13. RPC atómico — procesar_ciclo_usuario
-- ============================================================
-- Transfiere saldo_disponible → saldo_pendiente atómicamente.
-- Lee el saldo con FOR UPDATE (lock) evitando race conditions.
-- Crea el retiro, transfiere y marca el ciclo en una sola transacción.

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
-- 14. TABLA sesiones_video — validación de 20 segundos
-- ============================================================
-- Registra el inicio de cada sesión de video recompensado.
-- El RPC registrar_video_con_limite valida que hayan pasado al
-- menos 20 segundos entre fecha_inicio y el momento de completar.
-- RLS: sin policies = denegación total para frontend (service_role bypass).

CREATE TABLE IF NOT EXISTS public.sesiones_video (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  completada BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.sesiones_video ENABLE ROW LEVEL SECURITY;
-- Sin policies: acceso denegado para frontend. Las backend functions
-- usan service_role que bypassa RLS.

-- ============================================================
-- 15-16. RPCs — iniciar_sesion_video y registrar_video_con_limite
-- ============================================================
-- Estas funciones están definidas en migracion_supabase.sql con
-- auth.uid() (sin p_user_id) y registrar_video_con_limite retorna
-- JSONB + acredita saldo. NO redefinir aquí con la firma vieja.

-- ============================================================
-- 15. RPC atómico — incrementar_visitas_campana
-- ============================================================
-- Incrementa visitas_actuales atómicamente (+1).
-- Reemplaza el count + update no atómico de aprobarPrueba.

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
-- 16. RPC atómico — reembolsar_retiro_usuario
-- ============================================================
-- Reembolso de retiro rechazado: +monto a saldo_disponible,
-- -monto a saldo_pendiente (floor en 0). Atómico (evita race conditions).
-- Usado por la backend function rechazarRetiro (con fallback read-then-write).

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
-- 17. RPC atómico — descontar_saldo_reverso
-- ============================================================
-- Descuento por reverso de CPX (fraude/chargeback): descuenta de
-- saldo_disponible primero, luego saldo_pendiente, y si no alcanza
-- deja saldo_disponible negativo (deuda). Atómico con FOR UPDATE lock.
-- Usado por la backend function cpxPostback (con fallback read-then-write).

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

  -- 1. Descontar de saldo_disponible
  IF v_restante <= v_disponible THEN
    UPDATE public.perfiles
    SET saldo_disponible = v_disponible - v_restante
    WHERE id = p_user_id;
    RETURN;
  END IF;
  v_restante := v_restante - v_disponible;

  -- 2. Descontar de saldo_pendiente
  IF v_restante <= v_pendiente THEN
    UPDATE public.perfiles
    SET saldo_disponible = 0,
        saldo_pendiente = v_pendiente - v_restante
    WHERE id = p_user_id;
    RETURN;
  END IF;
  v_restante := v_restante - v_pendiente;

  -- 3. Deuda residual: saldo_disponible negativo
  UPDATE public.perfiles
  SET saldo_disponible = -v_restante,
      saldo_pendiente = 0
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Backend functions (15) usan SUPABASE_SERVICE_ROLE_KEY → bypass
--    RLS → NO se ven afectadas en absoluto.
-- 2. Entidades Base44 (AvisoSistema, ComisionReferido) viven en la
--    base de datos de Base44, no en Supabase → NO se afectan.
-- 3. fetchPerfilByCodigo (dead code) dejó de funcionar, pero ya fue
--    reemplazado por buscarReferido backend function (service_role).
-- 4. insertRetiro e insertHistorialTarea (dead code) tienen policies
--    por si se usan en el futuro, pero no son necesarios hoy.
-- 5. El trigger validar_fraude_vpn_al_retirar funciona porque:
--    - Desde service_role (ciclo facturación): bypass RLS → OK
--    - Desde frontend (insertRetiro): usuario lee su propio perfil → OK
-- 6. El bucket capturas-tareas es público (lectura sin restricciones).
--    Solo se agregó policy de INSERT (escritura) para usuarios autenticados.