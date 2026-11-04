-- ============================================================
-- LatamBucks — FIX DE SEGURIDAD: perfiles_update (escalada de rol)
-- ============================================================
-- CERRAR HALLAZGO CRITICO #1 del reporte:
--   La política perfiles_update permite a cada usuario actualizar SU
--   propia fila SIN restricción de columnas. Cualquier usuario podía
--   enviar un PATCH a /rest/v1/perfiles?id=<su-id> con role='admin'
--   (is_admin() devuelve true → control total de RPCs admin) o con
--   saldo_disponible=<lo que quiera>.
--
-- SOLUCION: trigger BEFORE UPDATE en public.perfiles que bloquea el
--   UPDATE directo desde REST (rol 'authenticated') sobre columnas
--   sensibles:
--     * role            → solo el backend/equipo (evita auto-asignarse admin)
--     * id, email       → identidad, no se tocan por REST
--     * referido_por, codigo_referido → integridad del árbol de referidos
--     * saldo_disponible, saldo_pendiente, saldo_promocion → dinero
--
--   Solo se permiten por REST a un usuario no-admin: destino_pago,
--   titular_pago, retener_pagos, pais.
--
--   CLAVE PARA NO ROMPER LAS RPCs DE ACREDITACIÓN:
--   Las RPCs de saldo (reclamar_checkin, abrir_caja_sorpresa, aprobar_prueba,
--   reintegrar_saldo_campana, procesar_ciclo_usuario, etc.) son SECURITY
--   DEFINER y ejecutan sus UPDATEs con current_user = owner (postgres),
--   NO 'authenticated'. El trigger distingue por current_user: si es el
--   owner/service_role (proceso de servidor), NO bloquea. Solo bloquea
--   cuando current_user = 'authenticated' (UPDATE REST directo del usuario).
--
-- EJECUTAR TODO en orden en el SQL Editor de Supabase. IDEMPOTENTE.
-- ============================================================

-- Trigger de protección de columnas en perfiles
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

-- Verificación del trigger
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgrelid = 'public.perfiles'::regclass AND NOT tgisinternal;