-- ============================================================
-- LatamBucks — FIX recursión infinita en RLS
-- ============================================================
-- ERROR: "infinite recursion detected in policy for relation
--        'pruebas_tareas_locales'"
--
-- CAUSA: recursión MUTUA entre dos policies.
--   pruebas_tareas_locales_select hace:
--     EXISTS (SELECT 1 FROM campanas_locales WHERE ...)
--   campanas_locales_select hace:
--     EXISTS (SELECT 1 FROM pruebas_tareas_locales WHERE ...)
-- Al evaluar una policy, Postgres evalúa la policy de la otra tabla,
-- que vuelve a evaluar la primera → recursión infinita.
--
-- FIX: reemplazar los EXISTS cruzados por funciones SECURITY DEFINER
-- (bypass RLS) que leen la otra tabla sin disparar su policy.
--
-- IDEMPOTENTE. Ejecutar en el SQL Editor de Supabase.
-- No afecta Edge Functions (usan service_role → bypass RLS).
-- ============================================================

-- ============================================================
-- 1. HELPERS SECURITY DEFINER (bypass RLS → cortan la recursión)
-- ============================================================
-- Estas funciones leen la tabla "contraria" sin disparar su policy.

-- ¿El usuario actual es el anunciante de la campaña p_campana_id?
CREATE OR REPLACE FUNCTION public.is_anunciante_campana(p_campana_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campanas_locales
    WHERE id = p_campana_id
      AND anunciante_email = public.get_user_email()
  );
$$;

-- ¿El usuario p_user_id tiene alguna prueba en la campaña p_campana_id?
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
    WHERE campana_id = p_campana_id
      AND usuario_id = p_user_id
  );
$$;

-- ============================================================
-- 2. POLÍTICA — campanas_locales (sin subquery cruzado)
-- ============================================================
DROP POLICY IF EXISTS campanas_locales_select ON public.campanas_locales;
CREATE POLICY campanas_locales_select ON public.campanas_locales
  FOR SELECT USING (
    (activa = true AND estado_pago = 'aprobado')
    OR public.is_admin()
    OR anunciante_email = public.get_user_email()
    OR public.usuario_tiene_prueba_en_campana(id, auth.uid())
  );

-- ============================================================
-- 3. POLÍTICAS — pruebas_tareas_locales (sin subquery cruzado)
-- ============================================================
DROP POLICY IF EXISTS pruebas_tareas_locales_select ON public.pruebas_tareas_locales;
CREATE POLICY pruebas_tareas_locales_select ON public.pruebas_tareas_locales
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR public.is_admin()
    OR public.is_anunciante_campana(campana_id)
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

-- ============================================================
-- 4. VERIFICACIÓN
-- ============================================================
-- Debe devolver 0 errores. Si devuelve filas, todavía hay un EXISTS
-- cruzado en alguna policy.
-- SELECT tablename, policyname, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('campanas_locales','pruebas_tareas_locales');