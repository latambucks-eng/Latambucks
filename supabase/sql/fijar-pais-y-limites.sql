-- ============================================================
-- LatamBucks — PAÍS POR IP + LÍMITES DE LA RULETA
-- ============================================================
-- EJECUTAR EN: Supabase → SQL Editor (no en la terminal).
-- Es idempotente: se puede volver a correr sin romper nada.
--
-- Qué hace:
--   1. Crea la columna perfiles.pais_detectado (la escribe la
--      Edge Function detectar-pais con service_role).
--   2. Actualiza fn_wheel_limits para que reconozca el país tanto
--      por código ISO (US) como por nombre completo (Estados Unidos).
-- ============================================================

-- 1. Columna del país real detectado por IP
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS pais_detectado text;

COMMENT ON COLUMN public.perfiles.pais_detectado IS
  'Código ISO del país real detectado por IP. Solo lo escribe la Edge Function detectar-pais con service_role; el usuario no puede modificarlo.';

-- 2. Límites de la ruleta por país
CREATE OR REPLACE FUNCTION public.fn_wheel_limits(p_pais text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    -- Se acepta el código ISO (el que fija la detección por IP) y también el
    -- nombre completo, por si algún perfil viejo lo guardó así.
    WHEN upper(coalesce(p_pais, '')) IN ('US', 'USA', 'ESTADOS UNIDOS', 'UNITED STATES')
      THEN '{"requisito": 500, "apuesta_max": 1000, "tope_neto": 2000}'::jsonb
    ELSE '{"requisito": 50, "apuesta_max": 200, "tope_neto": 400}'::jsonb
  END;
$$;

-- 3. Recargar el esquema para que la API vea la columna nueva
NOTIFY pgrst, 'reload schema';

-- 4. Verificación: debe devolver la fila de la columna y el límite de US
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'perfiles'
   AND column_name = 'pais_detectado';

SELECT public.fn_wheel_limits('US') AS limites_us,
       public.fn_wheel_limits('AR') AS limites_resto;