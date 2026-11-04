/*
  LATAMBUCKS - VERIFICAR Y FIJAR PERMISOS DE TODOS LOS FLUJOS

  QUE HACE ESTE SCRIPT
    1. Deja las RPC que usa la app disponibles para TODOS los usuarios
       con sesion (rol authenticated): cajas, check-in, tragamonedas,
       videos, pruebas, disputas, campanas, retiros, referidos, ganadores,
       aviso del sistema, admin, comisiones, TimeWall.
    2. Les quita el acceso al publico sin sesion (rol anon). Incluye
       procesar_giro_tragamonedas: la app siempre la llama con la sesion
       del usuario, y ademas valida la sesion por dentro.
    3. Deja las RPC de dinero y de postback SOLO para service_role
       (las Edge Functions). Coincide con BLINDAJE-RPC-DINERO.sql: los dos
       scripts son idempotentes y se pueden correr en cualquier orden.
    4. Muestra tres cosas para controlar a ojo:
         - matriz de permisos por funcion (anon / usuario / servicio)
         - politicas RLS por tabla (quien puede leer, editar y borrar)
         - tablas con RLS desactivado (no deberia haber ninguna)
    5. Alarma final: avisa si algun flujo de la app, algun postback o las
       politicas RLS quedaron sin permiso.

  COMPROBADO EN VIVO CONTRA LA BASE:
    - Las funciones de la lista EXISTEN con sus firmas.
    - Todas las RPC que llama el navegador existen (ningun 404).
    - Los 5 proveedores (CPAGrip, CPX, TimeWall, RapidoReach,
      TheoremReach) no tocan tablas: entran por su Edge Function y esa
      llama a la RPC con service_role. Verificado con service_role:
      responden 200 las 5 de dinero y las 4 de TheoremReach.

  COMO EJECUTARLO
    Supabase -> SQL Editor -> New query -> pegar TODO este archivo -> Run.
*/


-- ============================================================
-- 1) RPC QUE USA LA APP CON SESIÓN → authenticated SÍ, anon NO
--    (todas validan la sesión y los permisos por dentro)
-- ============================================================
DO $$
DECLARE
  r record;
  v_lista text[] := ARRAY[
    -- recompensas y juego
    'abrir_caja_sorpresa',
    'reclamar_checkin',
    'procesar_giro_tragamonedas',
    'iniciar_sesion_video',
    'registrar_video_con_limite',
    -- recargar_giros_smartlink: la Edge Function la llama con el TOKEN DEL
    -- USUARIO (rol authenticated), no con service_role. Si se cerrara,
    -- se rompería la recarga de giros por smartlink.
    'recargar_giros_smartlink',
    -- tareas, disputas y retiros
    'aprobar_prueba',
    'rechazar_prueba',
    'iniciar_disputa',
    'rechazar_retiro',
    -- anunciantes
    'activar_campana_con_saldo',
    'administrar_estado_campana',
    -- referidos y datos públicos de la app
    'registrar_referido_pro',
    'buscar_referido',
    'get_mis_referidos',
    'get_ganadores_recientes',
    'get_aviso_activo',
    'is_admin',
    -- comisiones y mantenimiento (panel admin)
    'auto_aprobar_tareas_vencidas',
    'get_timewall_mantenimiento',
    'set_timewall_mantenimiento'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (v_lista)
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.firma);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.firma);
      RAISE NOTICE 'Lista para usuarios con sesión: %', r.firma;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo ajustar %: %', r.firma, SQLERRM;
    END;
  END LOOP;
END $$;


-- ============================================================
-- 1-bis) EXCEPCIÓN OBLIGATORIA: is_admin()
--   Las políticas RLS la llaman por dentro (`USING public.is_admin()`) y una
--   política se evalúa con el rol de quien consulta. Si se le quitara el
--   permiso al público, cualquier consulta sin sesión a esas tablas fallaría
--   con "permission denied for function is_admin", y con sesión también en
--   las políticas declaradas sin TO (aplican a todos los roles).
--   Por eso queda abierta a todos: sin sesión devuelve false y no revela
--   nada; con sesión devuelve si el usuario es admin.
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.firma);
    RAISE NOTICE 'is_admin abierta a todos (la usan las politicas RLS): %', r.firma;
  END LOOP;
END $$;


-- ============================================================
-- 1-ter) reintegrar_saldo_campana → SOLO uso interno
--   ESTA NO ES UNA PANTALLA. No valida nada por dentro (no mira auth.uid()
--   ni el dueño) y devuelve el sobrante + apaga la campaña que le pasen.
--   Comprobado en vivo: un usuario común podía ejecutarla. El navegador no
--   la llama (usa administrar_estado_campana, que sí valida admin o dueño),
--   y los que la llaman por dentro son SECURITY DEFINER, así que necesitan
--   este permiso. Va aparte de la lista de arriba a propósito.
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'reintegrar_saldo_campana'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
    RAISE NOTICE 'Solo uso interno (la llaman los definer): %', r.firma;
  END LOOP;
END $$;


-- ============================================================
-- 2) RPC DE DINERO Y POSTBACK → SOLO service_role
--    (las Edge Functions). Igual que BLINDAJE-RPC-DINERO.sql.
-- ============================================================
DO $$
DECLARE
  r record;
  v_lista text[] := ARRAY[
    'acreditar_saldo_usuario',
    'aplicar_resta_reverso_cpx',
    'incrementar_saldo_referido',
    'incrementar_visitas_campana',
    'descontar_saldo_reverso',
    'reembolsar_retiro_usuario',
    'procesar_ciclo_usuario',
    'liberar_saldos_pendientes_cron',
    'procesar_cierre_ciclo_weekly',
    'procesar_reverso_proveedor',
    'procesar_postback_theoremreach',
    'procesar_evento_theoremreach',
    'resolver_usuario_theoremreach',
    'registrar_sesion_theoremreach',
    'cpx_postback_webhook',
    'procesar_comisiones_pendientes'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (v_lista)
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
      -- Sin este GRANT, al revocar PUBLIC los postbacks quedan en 401.
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
      RAISE NOTICE 'Solo servicio (postbacks OK): %', r.firma;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo ajustar %: %', r.firma, SQLERRM;
    END;
  END LOOP;
END $$;


-- ============================================================
-- 3) MATRIZ DE PERMISOS — qué debe mostrar cada columna
--      anon_puede     = false   (nadie sin sesión)
--      usuario_puede  = true    (flujos de la app para todos)
--      servicio_puede = true    (postbacks y dinero)
--    Única excepción esperada en anon_puede = true:
--      · is_admin → la llaman las políticas RLS (sin sesión devuelve false)
--    procesar_giro_tragamonedas NO queda abierta: la app la llama con la
--    sesión del usuario, así que en anon_puede debe salir false.
-- ============================================================
SELECT p.proname                                                  AS funcion,
       has_function_privilege('anon', p.oid, 'EXECUTE')           AS anon_puede,
       has_function_privilege('authenticated', p.oid, 'EXECUTE')  AS usuario_puede,
       has_function_privilege('service_role', p.oid, 'EXECUTE')   AS servicio_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'abrir_caja_sorpresa','reclamar_checkin','procesar_giro_tragamonedas',
    'iniciar_sesion_video','registrar_video_con_limite','aprobar_prueba',
    'rechazar_prueba','iniciar_disputa','rechazar_retiro',
    'activar_campana_con_saldo','administrar_estado_campana',
    'reintegrar_saldo_campana','registrar_referido_pro','buscar_referido',
    'get_mis_referidos','get_ganadores_recientes','get_aviso_activo',
    'is_admin','auto_aprobar_tareas_vencidas',
    'get_timewall_mantenimiento','set_timewall_mantenimiento',
    'recargar_giros_smartlink',
    'acreditar_saldo_usuario','aplicar_resta_reverso_cpx',
    'incrementar_saldo_referido','incrementar_visitas_campana',
    'descontar_saldo_reverso','reembolsar_retiro_usuario',
    'procesar_ciclo_usuario','liberar_saldos_pendientes_cron',
    'procesar_cierre_ciclo_weekly','procesar_reverso_proveedor',
    'procesar_postback_theoremreach','procesar_evento_theoremreach',
    'resolver_usuario_theoremreach','registrar_sesion_theoremreach',
    'cpx_postback_webhook','procesar_comisiones_pendientes'
  )
ORDER BY p.proname;


-- ============================================================
-- 4) RLS: quién puede leer / editar / borrar en cada tabla
--    Se espera, como mínimo, una política por tabla para `authenticated`
--    (dueño) y otra para admin (control total).
-- ============================================================
SELECT tablename                                   AS tabla,
       policyname                                  AS politica,
       cmd                                         AS permite,
       array_to_string(roles, ', ')                AS roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles','historial_tareas','retiros','campanas_locales',
    'pruebas_tareas_locales','comisiones_referido','avisos_usuario',
    'avisos_sistema','registro_postbacks'
  )
ORDER BY tablename, cmd, policyname;


-- ============================================================
-- 5) CONTROL FINAL — tablas con RLS desactivado
--    Debe salir VACÍO. Si aparece alguna, avisame.
-- ============================================================
SELECT c.relname AS tabla_sin_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;


-- ============================================================
-- 6) ALARMA — avisa si algún flujo quedó cerrado por error
--    Al terminar de correr el script, mira este resultado:
--
--    Tres roles, tres puertas distintas:
--      · anon           = sin sesión (cualquiera con la URL) → NADA
--      · authenticated  = usuario con sesión  → los flujos de la app
--      · service_role   = Edge Functions / postbacks (llave secreta,
--                         nunca pública) → el dinero
--
--    Si sale "TODO OK", los flujos de la app, los 6 postbacks y las
--    políticas RLS siguen funcionando. Si sale algún PELIGRO, esa es la
--    función a revisar antes de dar por cerrado el tema.
-- ============================================================
DO $$
DECLARE
  r       record;
  v_fallos int := 0;
  -- Pantallas de la app: las llama el navegador con la sesión del usuario.
  v_app text[] := ARRAY[
    'abrir_caja_sorpresa','reclamar_checkin','procesar_giro_tragamonedas',
    'iniciar_sesion_video','registrar_video_con_limite','aprobar_prueba',
    'rechazar_prueba','iniciar_disputa','activar_campana_con_saldo',
    'administrar_estado_campana','rechazar_retiro','registrar_referido_pro',
    'buscar_referido','get_mis_referidos','get_ganadores_recientes',
    'get_aviso_activo','auto_aprobar_tareas_vencidas',
    'get_timewall_mantenimiento','set_timewall_mantenimiento',
    'recargar_giros_smartlink'
  ];
  -- Dinero y postbacks: solo los llaman las Edge Functions con la llave secreta.
  v_dinero text[] := ARRAY[
    'acreditar_saldo_usuario','aplicar_resta_reverso_cpx',
    'incrementar_saldo_referido','incrementar_visitas_campana',
    'descontar_saldo_reverso','reembolsar_retiro_usuario',
    'procesar_ciclo_usuario','liberar_saldos_pendientes_cron',
    'procesar_cierre_ciclo_weekly','procesar_reverso_proveedor',
    'cpx_postback_webhook','procesar_comisiones_pendientes',
    'procesar_postback_theoremreach','procesar_evento_theoremreach',
    'resolver_usuario_theoremreach','registrar_sesion_theoremreach',
    'reintegrar_saldo_campana'
  ];
BEGIN
  -- A) Flujos de la app: deben quedar abiertos al usuario con sesión.
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (v_app)
  LOOP
    IF NOT has_function_privilege('authenticated', r.oid, 'EXECUTE') THEN
      RAISE WARNING 'PELIGRO: % quedo cerrada para usuarios con sesion: esa pantalla fallaria', r.proname;
      v_fallos := v_fallos + 1;
    END IF;
  END LOOP;

  -- B) Postbacks: deben conservar la llave de servicio o no acreditan nada.
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (v_dinero)
  LOOP
    IF NOT has_function_privilege('service_role', r.oid, 'EXECUTE') THEN
      RAISE WARNING 'PELIGRO: % quedo cerrada para service_role: ese postback NO acreditaria ni restaria saldo', r.proname;
      v_fallos := v_fallos + 1;
    END IF;
  END LOOP;

  -- C) is_admin: la usan las políticas RLS al evaluar cada consulta.
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  LOOP
    IF NOT has_function_privilege('anon', r.oid, 'EXECUTE') THEN
      RAISE WARNING 'PELIGRO: is_admin quedo cerrada y las politicas RLS fallarian con permission denied';
      v_fallos := v_fallos + 1;
    END IF;
  END LOOP;

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO OK: pantallas de la app, los 6 postbacks y las politicas RLS conservan su permiso.';
  ELSE
    RAISE WARNING 'ATENCION: % revisiones fallaron. No cierres nada mas y avisame cual aparece.', v_fallos;
  END IF;
END $$;