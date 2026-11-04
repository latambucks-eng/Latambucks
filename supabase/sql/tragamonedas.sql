-- ============================================================
--  TRAGAMONEDAS (Slot Machine) — LatamBucks
--  Reemplaza el script de video publicitario automático por un
--  minijuego de giros con premios dinámicos por país (tier).
--  Equivalencia estricta: 1.000 puntos = 1 USD (1 punto = $0.001).
--
--  Ejecutar una sola vez en Supabase → SQL Editor.
--  Idempotente (usa IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ============================================================
-- PARTE 1 — ESQUEMA DE BASE DE DATOS + RLS
-- ============================================================

-- 1.a) Columnas de giros en la tabla existente `perfiles`.
--       saldo_disponible actúa como la columna de `puntos` del enunciado
--       (ya se usa con la equivalencia 1.000 pts = 1 USD en toda la app).
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS giros_gratuitos_restantes integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS giros_extra_disponibles  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_reinicio_giros    timestamptz NOT NULL DEFAULT now();

-- 1.b) Asegurar que saldo_disponible admita premios fraccionados
--       (Tier 3 entrega 0.1 / 0.2 / 0.3 puntos). Si hoy es integer, migrar
--       a numeric(20,4) sin perder datos.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'perfiles' AND column_name = 'saldo_disponible'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE perfiles
      ALTER COLUMN saldo_disponible TYPE numeric(20,4)
      USING saldo_disponible::numeric(20,4);
  END IF;
END $$;

-- 1.c) Tabla del Premio Gordo mensual (una sola entrega global por mes).
CREATE TABLE IF NOT EXISTS premio_gordo_mensual (
  anio_mes          text        NOT NULL,          -- 'YYYY-MM' (zona AR)
  entregado         boolean     NOT NULL DEFAULT false,
  ganador_user_id   uuid,
  fecha_entrega     timestamptz,
  puntos_entregados numeric(20,4),
  PRIMARY KEY (anio_mes)                          -- garantiza 1 fila por mes
);

-- 1.d) Tabla de auditoría de recargas por Smart Link (frequency capping).
CREATE TABLE IF NOT EXISTS recargas_smartlink (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  pais        text,
  creado_el   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recargas_user_fecha
  ON recargas_smartlink (usuario_id, creado_el DESC);

-- 1.e) RLS — bloquear modificación directa de `puntos` (saldo_disponible)
--       desde el frontend (clave anon). Los RPC SECURITY DEFINER corren
--       como `postgres`, y el service_role como `service_role`: ambos
--       quedan exentos. Un PATCH directo de un usuario autenticado
--       (current_user = 'authenticated'/'anon') se rechaza.
CREATE OR REPLACE FUNCTION proteger_saldo_directo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.saldo_disponible IS DISTINCT FROM OLD.saldo_disponible
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin')
  THEN
    RAISE EXCEPTION 'No puedes modificar tu saldo directamente. Usa los canales habilitados.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_saldo ON perfiles;
CREATE TRIGGER trg_proteger_saldo
  BEFORE UPDATE ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION proteger_saldo_directo();

-- RLS sobre tablas nuevas: sin políticas públicas → solo service_role
-- y los RPC SECURITY DEFINER (que corren como owner) acceden.
ALTER TABLE premio_gordo_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE recargas_smartlink   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PARTE 2 + 4 — RPC procesar_giro_tragamonedas (con Jackpot)
-- ============================================================
-- Blindada contra hacks del cliente: toda la lógica (verificación de
-- giros, aleatoriedad, cálculo de premio, acreditación y jackpot) corre
-- server-side. El frontend solo recibe el resultado.

CREATE OR REPLACE FUNCTION procesar_giro_tragamonedas(p_pais_tier text DEFAULT 'tier3')
RETURNS TABLE(
  rueda1              integer,
  rueda2              integer,
  rueda3              integer,
  puntos_ganados      numeric(20,4),
  es_premio_gordo     boolean,
  giros_gratuitos     integer,
  giros_extra         integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_perfil   record;
  v_usar     text;                       -- 'gratis' | 'extra'
  v_r1       integer;
  v_r2       integer;
  v_r3       integer;
  v_premio   numeric(20,4) := 0;
  v_jackpot  boolean := false;
  v_tier     integer;
  v_mes      text := to_char(now() AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM');
  v_jp       record;
  v_jp_pts   numeric(20,4);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Resolver tier (acepta nombre de tier o código de país)
  v_tier := CASE
    WHEN lower(p_pais_tier) IN ('tier1','us','ca','gb','de') THEN 1
    WHEN lower(p_pais_tier) IN ('tier2','es','mx','cl','br') THEN 2
    ELSE 3
  END;

  -- Bloquear fila del perfil (evita race condition entre giros concurrentes)
  SELECT * INTO v_perfil FROM perfiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  -- a) Verificar giros disponibles
  IF v_perfil.giros_gratuitos_restantes > 0 THEN
    v_usar := 'gratis';
  ELSIF v_perfil.giros_extra_disponibles > 0 THEN
    v_usar := 'extra';
  ELSE
    RAISE EXCEPTION 'No tienes giros disponibles. Recarga con el enlace patrocinado.';
  END IF;

  -- c) Tres ruedas aleatorias (0-9)
  v_r1 := floor(random() * 10)::int;
  v_r2 := floor(random() * 10)::int;
  v_r3 := floor(random() * 10)::int;

  -- PARTE 4 — Jackpot: solo si las 3 ruedas son 7
  IF v_r1 = 7 AND v_r2 = 7 AND v_r3 = 7 THEN
    SELECT * INTO v_jp FROM premio_gordo_mensual WHERE anio_mes = v_mes FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO premio_gordo_mensual (anio_mes) VALUES (v_mes) RETURNING * INTO v_jp;
    END IF;
    -- Restricción global: una sola entrega por mes
    IF NOT v_jp.entregado THEN
      v_jackpot := true;
      v_jp_pts  := CASE WHEN v_tier = 1 THEN 2000 ELSE 500 END;
      v_premio  := v_jp_pts;
      UPDATE premio_gordo_mensual
        SET entregado         = true,
            ganador_user_id   = v_uid,
            fecha_entrega     = now(),
            puntos_entregados = v_jp_pts
        WHERE anio_mes = v_mes;
    END IF;
  END IF;

  -- d) Premio normal por tier (si no salió el jackpot)
  IF NOT v_jackpot THEN
    IF v_r1 = v_r2 AND v_r2 = v_r3 THEN
      -- 3 iguales → premio mayor del tier
      v_premio := CASE v_tier WHEN 1 THEN 5 WHEN 2 THEN 1.0 ELSE 0.3 END;
    ELSIF v_r1 = v_r2 OR v_r2 = v_r3 OR v_r1 = v_r3 THEN
      -- 2 iguales → premio medio
      v_premio := CASE v_tier WHEN 1 THEN 3 WHEN 2 THEN 0.8 ELSE 0.2 END;
    ELSE
      -- sin coincidencia → premio mínimo
      v_premio := CASE v_tier WHEN 1 THEN 2 WHEN 2 THEN 0.5 ELSE 0.1 END;
    END IF;
  END IF;

  -- b) Descontar el giro del balance correspondiente
  IF v_usar = 'gratis' THEN
    UPDATE perfiles
      SET giros_gratuitos_restantes = giros_gratuitos_restantes - 1
      WHERE id = v_uid;
  ELSE
    UPDATE perfiles
      SET giros_extra_disponibles = giros_extra_disponibles - 1
      WHERE id = v_uid;
  END IF;

  -- e) Acreditar premio (el trigger permite: corre como `postgres`)
  UPDATE perfiles
    SET saldo_disponible = saldo_disponible + v_premio
    WHERE id = v_uid;

  -- Devolver estado final de giros
  SELECT giros_gratuitos_restantes, giros_extra_disponibles
    INTO v_perfil.giros_gratuitos_restantes, v_perfil.giros_extra_disponibles
    FROM perfiles WHERE id = v_uid;

  RETURN QUERY
    SELECT v_r1, v_r2, v_r3, v_premio, v_jackpot,
           v_perfil.giros_gratuitos_restantes,
           v_perfil.giros_extra_disponibles;
END;
$$;

-- Permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION procesar_giro_tragamonedas(text) TO authenticated, anon;


-- ============================================================
-- RPC recargar_giros_smartlink — invocado por la Edge Function
-- (Parte 3). Frequency capping atómico + suma de giros extra.
-- ============================================================
CREATE OR REPLACE FUNCTION recargar_giros_smartlink(p_pais text DEFAULT NULL)
RETURNS TABLE(success boolean, giros_extra integer, recargas_hoy integer, error text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_hoy    timestamptz;
  v_count  integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'No autenticado'::text;
    RETURN;
  END IF;

  -- Medianoche Argentina (UTC-3) = 03:00 UTC del día actual
  v_hoy := (date_trunc('day', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
            AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamptz;

  -- Frequency capping: máximo 4 recargas por día por usuario
  SELECT count(*) INTO v_count
    FROM recargas_smartlink
    WHERE usuario_id = v_uid AND creado_el >= v_hoy;

  IF v_count >= 4 THEN
    RETURN QUERY SELECT false, 0, v_count, 'Límite diario de recargas alcanzado (4/día)'::text;
    RETURN;
  END IF;

  -- Registrar la recarga y sumar +3 giros extra atómicamente
  INSERT INTO recargas_smartlink (usuario_id, pais) VALUES (v_uid, p_pais);

  UPDATE perfiles
    SET giros_extra_disponibles = giros_extra_disponibles + 3
    WHERE id = v_uid;

  RETURN QUERY
    SELECT true,
           (SELECT giros_extra_disponibles FROM perfiles WHERE id = v_uid),
           v_count + 1,
           NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION recargar_giros_smartlink(text) TO authenticated, anon;