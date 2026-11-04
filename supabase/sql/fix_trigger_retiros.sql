-- ============================================================
-- LatamBucks — FIX: Eliminar trigger obsoleto + constraint de retiros
-- ============================================================
-- PROBLEMA: Existe un trigger BEFORE INSERT en la tabla retiros que
-- bloquea los métodos payoneer/airtm/paypal para usuarios argentinos
-- con el mensaje "Método no permitido: Como residente de Argentina
-- tus pagos se procesan por Mercado Pago."
--
-- Este trigger NO está en ningún SQL actual del proyecto. Fue creado
-- por un script anterior que ya se eliminó. Como ahora todos los
-- usuarios (incluidos los de Argentina) usan Payoneer/Airtm/PayPal,
-- este trigger obsoleto BLOQUEA el cron job procesar-ciclo-facturacion
-- para usuarios argentinos: el INSERT INTO retiros falla y el retiro
-- nunca se procesa.
--
-- ADEMÁS: la constraint retiros_metodo_pago_check puede estar
-- desactualizada (rls_policies.sql la deja en mercadopago/payoneer/
-- bitcoin, sin airtm ni paypal). Se reemplaza por la definitiva que
-- SOLO permite payoneer, airtm y paypal — Mercado Pago fue eliminado
-- definitivamente de la plataforma, los retiros para Argentina son
-- iguales que para el resto de Latam.
--
-- SOLUCIÓN:
--   1. Eliminar cualquier trigger en retiros que valide método por país.
--   2. Reemplazar la constraint para que solo acepte payoneer/airtm/paypal.
--
-- EJECUTAR en el SQL Editor de Supabase. Idempotente.
-- ============================================================

-- 1. DIAGNÓSTICO: Listar todos los triggers en la tabla retiros
--    (ejecutar esta query primero para ver qué triggers existen)
SELECT tgname AS trigger_name,
       pg_get_triggerdef(oid) AS trigger_def
FROM pg_trigger
WHERE tgrelid = 'public.retiros'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- 2. ELIMINAR triggers que validan método de pago por país.
--    Busca triggers cuyo nombre o definición contenga palabras clave
--    relacionadas con la validación de método/residencia/país.
--    Si el trigger es de fraude VPN (validar_fraude_vpn), se CONSERVA.
DO $$
DECLARE
  r RECORD;
  v_def TEXT;
  v_bajar BOOLEAN;
BEGIN
  FOR r IN
    SELECT tgname, pg_get_triggerdef(oid) AS def
    FROM pg_trigger
    WHERE tgrelid = 'public.retiros'::regclass
      AND NOT tgisinternal
  LOOP
    v_def := COALESCE(r.def, '');
    -- Bajar si el trigger menciona método/pais/residente/argentina/seguridad
    -- pero NO es el de fraude VPN
    v_bajar := (
      v_def ILIKE '%metodo%' OR
      v_def ILIKE '%residente%' OR
      v_def ILIKE '%argentina%' OR
      v_def ILIKE '%mercadopago%' OR
      v_def ILIKE '%mercado_pago%' OR
      r.tgname ILIKE '%metodo%' OR
      r.tgname ILIKE '%validar_metodo%' OR
      r.tgname ILIKE '%check_metodo%' OR
      r.tgname ILIKE '%forzar_metodo%' OR
      r.tgname ILIKE '%seguridad_retiros%'
    ) AND r.tgname NOT ILIKE '%vpn%' AND r.tgname NOT ILIKE '%fraude%';

    IF v_bajar THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.retiros', r.tgname);
      RAISE NOTICE 'Trigger eliminado: %', r.tgname;
    ELSE
      RAISE NOTICE 'Trigger conservado: %', r.tgname;
    END IF;
  END LOOP;
END;
$$;

-- 2b. DROP explícito del trigger tr_seguridad_retiros (valida método por país).
DROP TRIGGER IF EXISTS tr_seguridad_retiros ON public.retiros;

-- 3. VERIFICACIÓN: confirmar que quedan solo triggers legítimos
SELECT tgname AS trigger_name,
       pg_get_triggerdef(oid) AS trigger_def
FROM pg_trigger
WHERE tgrelid = 'public.retiros'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- 4. FIX CONSTRAINT: eliminar mercadopago, solo permitir payoneer/airtm/paypal.
--    Mercado Pago fue eliminado de la plataforma — Argentina usa los
--    mismos métodos que el resto de Latam.
ALTER TABLE public.retiros DROP CONSTRAINT IF EXISTS retiros_metodo_pago_check;
ALTER TABLE public.retiros ADD CONSTRAINT retiros_metodo_pago_check
  CHECK (metodo_pago IN ('payoneer', 'airtm', 'paypal'));

-- 5. Migrar cualquier retiro histórico con mercadopago a payoneer
--    (para que no violen la nueva constraint si existen)
UPDATE public.retiros SET metodo_pago = 'payoneer' WHERE metodo_pago = 'mercadopago';
UPDATE public.retiros SET metodo_pago = 'payoneer' WHERE metodo_pago = 'bitcoin';

-- 6. Migrar metodo_pago_preferido de perfiles: eliminar mercadopago
UPDATE public.perfiles SET metodo_pago_preferido = 'payoneer'
  WHERE metodo_pago_preferido IS NULL
     OR metodo_pago_preferido = 'mercadopago'
     OR metodo_pago_preferido = 'bitcoin';

-- 7. TEST: verificar que ahora se puede insertar un retiro con payoneer
--    para un usuario argentino (borrar el registro de prueba después)
--    Descomentar para ejecutar:
-- ============================================================
-- INSERT INTO public.retiros (user_id, puntos_solicitados, metodo_pago, detalles_pago, titular_nombre, estado)
-- VALUES ('f820a9d5-186d-4420-a4d1-ec1fb4e513c3', 1, 'payoneer', 'test', 'test', 'pendiente')
-- RETURNING id, metodo_pago;
-- -- Borrar el test:
-- DELETE FROM public.retiros WHERE user_id = 'f820a9d5-186d-4420-a4d1-ec1fb4e513c3' AND detalles_pago = 'test';
-- ============================================================

-- NOTA: Si el paso 1 muestra un trigger con un nombre que no contiene
-- las palabras clave pero igual bloquea, revisar su definición manualmente
-- y agregarlo a la lista de exclusión en el DO block.