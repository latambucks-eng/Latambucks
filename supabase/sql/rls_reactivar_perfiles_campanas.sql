-- ============================================================
-- LatamBucks — REACTIVAR RLS en perfiles y campanas_locales
-- ============================================================
-- Motivo: el Security Advisor detecta "RLS Disabled in Public" en
-- public.perfiles y public.campanas_locales (las políticas siguen
-- existiendo pero Row Level Security quedó apagado).
--
-- MIENTRAS RLS ESTÉ APAGADO, cualquiera que tenga la clave pública
-- (anon key) puede LEER y MODIFICAR cualquier fila de esas tablas,
-- incluido saldo_disponible de cualquier perfil.
--
-- Este script es IDEMPOTENTE y seguro:
--   * No borra ni modifica datos.
--   * Se puede ejecutar las veces que quieras, sin errores.
--   * No afecta a las Edge Functions (usan service_role → bypass RLS).
--   * No afecta a las entidades de Base44 (viven en otra base).
--
-- EJECUTAR TODO en orden en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================
-- 0. HELPERS que usan las políticas (re-crear por si faltaran)
-- ============================================================
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

-- Helper de cruce (bypass RLS → evita recursión con pruebas_tareas_locales)
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
-- 1. POLÍTICAS — perfiles
-- ============================================================
-- Usuario lee/edita solo su propio perfil. Admin lee/edita todos.
-- Cubre: fetchPerfil, insertPerfil, updatePerfil y el panel de admin.

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
-- 2. POLÍTICAS — campanas_locales
-- ============================================================
-- Cualquiera lee campañas activas + aprobadas (fetchCampanasLocales).
-- Anunciante lee sus propias campañas (checkIsAnunciante).
-- Usuario lee campañas donde tiene pruebas (historial con JOIN).
-- Admin lee/edita todas. Anunciante crea campañas (insertCampanaLocal).

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
-- 3. ACTIVAR RLS (al final: nunca queda una ventana sin políticas)
-- ============================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_locales ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. VERIFICACIÓN — deben quedar las 2 tablas con rls_activo = true
-- ============================================================
-- Muestra TODAS las tablas de public con su estado de RLS y cuántas
-- políticas tienen. Así detectás si a alguna otra le pasó lo mismo.

SELECT
  c.relname                    AS tabla,
  c.relrowsecurity             AS rls_activo,
  count(p.policyname)          AS n_politicas
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relrowsecurity, c.relname;