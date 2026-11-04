-- ============================================================
-- Fix RLS: políticas para comisiones_pendientes y comisiones_referido
-- ============================================================
-- El linter de Supabase marca "RLS Enabled No Policy" en estas tablas.
-- Ambas son tablas internas gestionadas por backend functions
-- (service_role → bypass RLS). Agregamos políticas de solo-admin
-- para satisfacer el linter y bloquear cualquier acceso directo
-- desde el frontend.
-- ============================================================

-- ============================================================
-- 1. comisiones_pendientes — solo admin
-- ============================================================
DROP POLICY IF EXISTS comisiones_pendientes_select ON public.comisiones_pendientes;
CREATE POLICY comisiones_pendientes_select ON public.comisiones_pendientes
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS comisiones_pendientes_insert ON public.comisiones_pendientes;
CREATE POLICY comisiones_pendientes_insert ON public.comisiones_pendientes
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS comisiones_pendientes_update ON public.comisiones_pendientes;
CREATE POLICY comisiones_pendientes_update ON public.comisiones_pendientes
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS comisiones_pendientes_delete ON public.comisiones_pendientes;
CREATE POLICY comisiones_pendientes_delete ON public.comisiones_pendientes
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- 2. comisiones_referido — solo admin
-- ============================================================
DROP POLICY IF EXISTS comisiones_referido_select ON public.comisiones_referido;
CREATE POLICY comisiones_referido_select ON public.comisiones_referido
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS comisiones_referido_insert ON public.comisiones_referido;
CREATE POLICY comisiones_referido_insert ON public.comisiones_referido
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS comisiones_referido_update ON public.comisiones_referido;
CREATE POLICY comisiones_referido_update ON public.comisiones_referido
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS comisiones_referido_delete ON public.comisiones_referido;
CREATE POLICY comisiones_referido_delete ON public.comisiones_referido
  FOR DELETE USING (public.is_admin());