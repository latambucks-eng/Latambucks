-- ============================================================
-- LatamBucks — Avisos y ganadores sin depender del backend
--
--  1) get_ganadores_recientes() ahora devuelve TAMBIÉN el país
--     de cada ganador (la bandera del slider).
--  2) avisos_usuario: el administrador puede ver TODOS los
--     avisos (antes solo veía los propios) y crear/borrar.
--     El usuario común sigue viendo SOLO los suyos.
--
-- Pegar TODO y ejecutar como consulta única en el SQL Editor
-- de Supabase. Es idempotente: se puede correr varias veces.
--
-- Verificado contra el esquema real del proyecto:
--   historial_tareas.usuario_id = uuid   → el JOIN con perfiles.id (uuid) es válido
--   historial_tareas.estado = text, puntos_ganados = numeric, proveedor = text
--   perfiles.id = uuid, perfiles.pais = text
--   avisos_usuario.usuario_id = uuid
-- Se usa jsonb_* de punta a punta (jsonb_build_object/jsonb_agg) para
-- que no haya mezcla de tipos json/jsonb en el COALESCE.
-- ============================================================

-- ---------- 1. GANADORES: agregar el país (bandera) ----------
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
    RETURN jsonb_build_object('ganadores', '[]'::jsonb);
  END IF;

  RETURN jsonb_build_object(
    'ganadores',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'userId',     left(t.usuario_id::text, 8),
          'puntos',     t.puntos_ganados,
          'proveedor',  CASE t.proveedor
                          WHEN 'tarea_local'   THEN 'Tarea local'
                          WHEN 'monetag_video' THEN 'Video patrocinado'
                          WHEN 'caja_sorpresa' THEN 'Caja sorpresa'
                          WHEN 'cpx_research'  THEN 'Encuesta CPX'
                          WHEN 'theoremreach'  THEN 'Encuesta TheoremReach'
                          WHEN 'timewall'      THEN 'TimeWall'
                          ELSE COALESCE(t.proveedor, 'Tarea')
                        END,
          'creado_el',  t.creado_el,
          'pais',       t.pais
        )
        ORDER BY t.creado_el DESC
      )
      FROM (
        SELECT h.usuario_id, h.puntos_ganados, h.proveedor, h.creado_el, p.pais
        FROM public.historial_tareas h
        LEFT JOIN public.perfiles p ON p.id = h.usuario_id
        WHERE h.estado = 'aprobado' AND h.puntos_ganados > 0
        ORDER BY h.creado_el DESC
        LIMIT 50
      ) t
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_ganadores_recientes() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ganadores_recientes() TO authenticated;

-- ---------- 2. AVISOS A USUARIOS: permisos ----------
-- SELECT: cada usuario ve los suyos; el admin ve todos.
DROP POLICY IF EXISTS "usuarios_leen_propios_avisos" ON public.avisos_usuario;
CREATE POLICY "usuarios_leen_propios_avisos" ON public.avisos_usuario
  FOR SELECT TO authenticated
  USING (auth.uid()::text = usuario_id::text OR public.is_admin());

-- INSERT y DELETE: solo el admin (antes cualquier usuario logueado
-- podía crear o borrar avisos de otros usuarios).
DROP POLICY IF EXISTS "auth_insert_avisos" ON public.avisos_usuario;
CREATE POLICY "admin_insert_avisos" ON public.avisos_usuario
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "auth_delete_avisos" ON public.avisos_usuario;
CREATE POLICY "admin_delete_avisos" ON public.avisos_usuario
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- 3. Verificación (opcional) ----------
-- Debe listar 3 filas: admin_delete_avisos / admin_insert_avisos /
-- usuarios_leen_propios_avisos.
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'avisos_usuario'
ORDER BY policyname;