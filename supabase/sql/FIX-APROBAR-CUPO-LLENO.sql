/*
  LATAMBUCKS — FIX: aprobar una tarea cuando la campaña ya usó todos sus cupos

  QUÉ SE COMPROBÓ EN VIVO (producción, 03/11/2026)
    Las campañas llevan un contador de cupos:
        visitas_compradas = cupos pagados por el anunciante
        visitas_actuales  = cupos ya entregados
    y la tabla tiene la regla check_limite_visitas:
        visitas_actuales <= visitas_compradas

    Al aprobar una prueba se llama a incrementar_visitas_campana, que suma 1
    SIEMPRE, sin mirar el tope.

    Resultado del fallo (reproducido):
      · Campaña con 2 cupos, 3 usuarios enviaron prueba.
      · Se aprueban 2 → visitas_actuales = 2.
      · Al aprobar la tercera, el UPDATE choca con la regla y devuelve:
          ERROR 23514: new row for relation "campanas_locales"
          violates check constraint "check_limite_visitas"
      · La prueba queda "pendiente" PARA SIEMPRE: el usuario no cobra y
        nadie puede aprobarla ni rechazarla (el botón solo da error rojo).

  QUÉ HACE ESTE SCRIPT
    Reemplaza incrementar_visitas_campana por una versión que nunca pasa del
    tope: suma 1 si hay lugar y, si la campaña ya está llena, deja el
    contador donde está (no lanza error).

    Así el cobro del usuario NO depende del contador: se acreditan sus
    puntos, queda en el historial y la comisión del patrocinador se
    registra igual. El contador nunca supera los cupos pagados, así que
    check_limite_visitas se sigue respetando.

  QUÉ **NO** CAMBIA — revisado punto por punto
    1. Nombre y argumento: se copian los REALES de la función que ya está
       en la base (nombre del argumento y tipo, sea INTEGER o BIGINT).
       No se crea una versión paralela, así que las dos llamadas
       `/rpc/incrementar_visitas_campana` (las de aprobarPrueba y
       autoAprobarVencidas) siguen encontrando UNA sola función y no
       aparece el error de ambigüedad PGRST203.
    2. Tipo de retorno: se copia el que ya tiene (void). Los dos
       llamadores ignoran la respuesta, así que nada se altera.
    3. Modo de seguridad: se copia el que ya tiene (DEFINER o INVOKER,
       el script lo lee y lo repite). No deshace el endurecimiento de
       security_fix_rpc_advisor.sql ni lo aplica dos veces.
    4. Permisos: CREATE OR REPLACE los conserva tal cual. Comprobado en
       vivo que hoy responde 204 con la llave de servicio y 401 sin
       sesión: eso sigue igual.
    5. Nada más se toca: ni tablas, ni RLS, ni disparadores, ni otra
       función. Y el contador sólo se escribe en este único lugar
       (comprobado: ningún otro script ni función hace "SET
       visitas_actuales"), así que el arreglo queda completo y aislado.
    6. Con la campaña NO llena, suma exactamente igual que hoy. Si alguna
       campaña vieja tuviera visitas_compradas en NULL (sin tope), se
       comporta como antes: suma 1 sin límite. Y el contador NUNCA baja:
       si una campaña ya estuviera por encima del tope, se deja como está.
    7. Cron jobs: no se modifican. El de las 06:00 corre el barrido
       auto_aprobar_tareas_vencidas, que es SECURITY DEFINER y sólo se
       beneficia (deja de cortarse cuando una campaña se llena). El de
       comisiones no la usa.

  CÓMO EJECUTARLO
    Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
    Es idempotente: se puede correr las veces que quieras.
*/


-- ============================================================
-- 1) REEMPLAZO — copia de la función real, sólo cambia la suma
-- ============================================================
DO $$
DECLARE
  r record;
  v_ok int := 0;
  v_clausula text;
BEGIN
  FOR r IN
    SELECT p.oid,
           p.pronargs,
           pg_get_function_identity_arguments(p.oid) AS args_identidad,
           format_type(p.proargtypes[0], NULL)       AS tipo_arg,
           format_type(p.prorettype, NULL)           AS tipo_ret,
           COALESCE(p.proargnames[1], 'p_campana_id') AS nombre_arg,
           p.prosecdef
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'incrementar_visitas_campana'
  LOOP
    IF r.pronargs <> 1 THEN
      RAISE NOTICE 'Se omite %: tiene % argumentos (se esperaba 1).', r.args_identidad, r.pronargs;
      CONTINUE;
    END IF;

    -- Mismo modo de seguridad que ya tiene: no se toca nada de seguridad.
    v_clausula := CASE WHEN r.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END;

    BEGIN
      EXECUTE format($ddl$
        CREATE OR REPLACE FUNCTION public.incrementar_visitas_campana(%I %s)
        RETURNS %s
        LANGUAGE plpgsql
        %s
        SET search_path = public
        AS $cuerpo$
        BEGIN
          -- LATAMBUCKS-TOPE-CUPOS: suma 1 sólo si hay lugar. Si la campaña
          -- ya está llena deja el contador como está: nunca lo baja y nunca
          -- pasa del tope (así check_limite_visitas se sigue respetando).
          UPDATE public.campanas_locales
          SET visitas_actuales = CASE
                WHEN visitas_compradas IS NULL
                  THEN COALESCE(visitas_actuales, 0) + 1
                WHEN COALESCE(visitas_actuales, 0) < visitas_compradas
                  THEN COALESCE(visitas_actuales, 0) + 1
                ELSE COALESCE(visitas_actuales, 0)
              END
          WHERE id = %I;
        END;
        $cuerpo$
      $ddl$, r.nombre_arg, r.tipo_arg, r.tipo_ret, v_clausula, r.nombre_arg);

      v_ok := v_ok + 1;
      RAISE NOTICE 'Actualizada incrementar_visitas_campana(%) [%]: nunca pasa de los cupos.', r.tipo_arg, v_clausula;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'No se pudo actualizar %: % — la función quedó como estaba.', r.args_identidad, SQLERRM;
    END;
  END LOOP;

  IF v_ok = 0 THEN
    RAISE WARNING 'No se actualizó ninguna función. Revisá los avisos de arriba antes de seguir.';
  END IF;
END $$;


-- ============================================================
-- 2) VERIFICACIÓN — qué debe salir
--    · una sola fila (si salieran dos, se habría duplicado la función)
--    · tiene_tope      = true
--    · servicio_puede  = true   (aprobar y el barrido la necesitan)
--    · anon_puede      = false  (sin sesión no se puede tocar)
-- ============================================================
SELECT p.proname                                              AS funcion,
       pg_get_function_identity_arguments(p.oid)              AS argumento,
       format_type(p.prorettype, NULL)                        AS devuelve,
       p.prosecdef                                            AS es_definer,
       position('LATAMBUCKS-TOPE-CUPOS' in pg_get_functiondef(p.oid)) > 0 AS tiene_tope,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS servicio_puede,
       has_function_privilege('anon', p.oid, 'EXECUTE')         AS anon_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'incrementar_visitas_campana';


-- ============================================================
-- 3) PRUEBAS PENDIENTES TRABADAS POR ESTE FALLO
--    Si devuelve filas, son usuarios que hicieron el trabajo y todavía
--    no cobraron: después de correr el script se aprueban sin problema
--    desde Admin → Disputas.
-- ============================================================
SELECT p.id                        AS prueba_id,
       p.usuario_id,
       p.campana_id,
       c.titulo                    AS campana,
       c.visitas_actuales,
       c.visitas_compradas,
       c.puntos_recompensa,
       p.creado_el
FROM public.pruebas_tareas_locales p
JOIN public.campanas_locales c ON c.id = p.campana_id
WHERE p.estado = 'pendiente'
  AND COALESCE(c.visitas_actuales, 0) >= COALESCE(c.visitas_compradas, 0)
ORDER BY p.creado_el;


-- ============================================================
-- 4) ALARMA FINAL
--    "TODO OK" = el tope quedó puesto, no se duplicó la función y los
--    permisos siguen igual. Si dice PELIGRO, no sigas aprobando y avisame.
-- ============================================================
DO $$
DECLARE
  r record;
  v_funciones int := 0;
  v_tope boolean := false;
  v_servicio boolean := false;
  v_anon boolean := true;
  v_trabadas int;
  v_fallos int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, position('LATAMBUCKS-TOPE-CUPOS' in pg_get_functiondef(p.oid)) > 0 AS tope
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'incrementar_visitas_campana'
  LOOP
    v_funciones := v_funciones + 1;
    v_tope := v_tope OR r.tope;
    v_servicio := v_servicio OR has_function_privilege('service_role', r.oid, 'EXECUTE');
    v_anon := v_anon AND has_function_privilege('anon', r.oid, 'EXECUTE');
  END LOOP;

  IF v_funciones <> 1 THEN
    RAISE WARNING 'PELIGRO: hay % versiones de la función (debe ser 1). Avisame antes de aprobar nada.', v_funciones;
    v_fallos := v_fallos + 1;
  END IF;

  IF NOT v_tope THEN
    RAISE WARNING 'PELIGRO: la función no quedó con el tope. Revisá la VERIFICACIÓN 2.';
    v_fallos := v_fallos + 1;
  END IF;

  IF NOT v_servicio THEN
    RAISE WARNING 'PELIGRO: service_role perdió el permiso: aprobar y el barrido dejarían de sumar la visita.';
    v_fallos := v_fallos + 1;
  END IF;

  IF v_anon THEN
    RAISE WARNING 'PELIGRO: quedó ejecutable sin sesión (antes no lo estaba).';
    v_fallos := v_fallos + 1;
  END IF;

  SELECT count(*) INTO v_trabadas
  FROM public.pruebas_tareas_locales p
  JOIN public.campanas_locales c ON c.id = p.campana_id
  WHERE p.estado = 'pendiente'
    AND COALESCE(c.visitas_actuales, 0) >= COALESCE(c.visitas_compradas, 0);

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO OK: aprobar una tarea ya no puede fallar por cupos llenos y todo lo demás quedó igual.';
  ELSE
    RAISE WARNING 'ATENCION: % revisión(es) fallaron. No cierres nada más y avisame.', v_fallos;
  END IF;

  IF v_trabadas > 0 THEN
    RAISE NOTICE 'Quedan % prueba(s) pendientes en campañas llenas: aprobalas desde Admin > Disputas.', v_trabadas;
  END IF;
END $$;