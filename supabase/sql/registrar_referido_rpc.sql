-- ============================================================
-- LatamBucks — FIX REFERIDOS + PAÍS — RPC registrar_referido_pro
-- ============================================================
-- PROBLEMA RESUELTO:
-- Al registrarse, el signup de Supabase crea el perfil automáticamente
-- (con referido_por NULL y país por defecto "Argentina"). El frontend
-- intentaba fijarlos con un INSERT (insertPerfil) que chocaba con la PK
-- ya existente (error 409) y se ignoraba. Por eso:
--   • NINGÚN referido quedaba ligado al sponsor, y
--   • el país elegido por el usuario se perdía (quedaba "Argentina").
--
-- SOLUCIÓN:
-- RPC SECURITY DEFINER que hace UPDATE (no INSERT) del referido_por y del
-- pais del perfil ya existente. Corre como owner (bypass RLS), por eso el
-- trigger lb_proteger_actualizacion_perfil (que solo bloquea a
-- 'authenticated') NO la bloquea. Valida que el usuario sea él mismo
-- (auth.uid()) y que el perfil NO tenga aún un referido.
--
-- EJECUTAR en el SQL Editor de Supabase.
-- ============================================================

CREATE OR REPLACE FUNCTION public.registrar_referido_pro(p_codigo TEXT, p_pais TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sponsor_id UUID;
  v_caller_id UUID := auth.uid();
  v_existente UUID;
BEGIN
  -- Auth obligatoria: el resto no puede asignar referidos a otros.
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Resolver el sponsor (igual que buscar_referido). Si viene código.
  IF p_codigo IS NOT NULL AND btrim(p_codigo) <> '' THEN
    SELECT id INTO v_sponsor_id
    FROM public.perfiles
    WHERE codigo_referido = p_codigo
    LIMIT 1;

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

    -- No auto-referido y el sponsor debe existir.
    IF v_sponsor_id IS NOT NULL AND v_sponsor_id != v_caller_id THEN
      -- Verificar que el usuario de llamada NO tenga ya un referido, para
      -- impedir re-asignaciones o cambios de sponsor.
      SELECT referido_por INTO v_existente
      FROM public.perfiles
      WHERE id = v_caller_id;

      IF v_existente IS NULL THEN
        UPDATE public.perfiles
        SET referido_por = v_sponsor_id
        WHERE id = v_caller_id;
      END IF;
    END IF;
  END IF;

  -- Persistir el país elegido en el registro (el perfil ya existe y el
  -- trigger de Auth lo deja en "Argentina" por defecto).
  IF p_pais IS NOT NULL AND btrim(p_pais) <> '' THEN
    UPDATE public.perfiles
    SET pais = btrim(p_pais)
    WHERE id = v_caller_id;
  END IF;

  RETURN json_build_object('success', true, 'referido_por', v_sponsor_id);
END;
$$;

-- Acceso: solo usuarios autenticados (anon/otros sin acceso).
REVOKE ALL ON FUNCTION public.registrar_referido_pro(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_referido_pro(TEXT, TEXT) TO authenticated;

-- ============================================================
-- Verificación (opcional - ejecutar para confirmar)
-- ============================================================
-- SELECT proname, prosecdef FROM pg_proc
-- WHERE proname = 'registrar_referido_pro';