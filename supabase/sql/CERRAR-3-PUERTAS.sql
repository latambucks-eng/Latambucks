/*
  LATAMBUCKS - CERRAR 3 PUERTAS ABIERTAS (script minimo)

  QUE SE COMPROBO EN VIVO, SIN SESION (con la clave publica):
    - Las TABLAS estan protegidas: perfiles, historial_tareas, retiros y
      campanas_locales devuelven 0 filas. Tu RLS funciona.
    - El resto de funciones de dinero ya esta cerrado (401).
    - Pero estas 3 responden 200 al publico y ninguna se llama desde el
      navegador:
         acreditar_saldo_usuario        -> regalarse puntos sin limite
         aplicar_resta_reverso_cpx      -> restar saldo a otro usuario
         procesar_comisiones_pendientes -> disparar el pago de comisiones

  QUE HACE ESTE SCRIPT
    Les quita el permiso al publico (PUBLIC, anon) y a los usuarios
    comunes (authenticated), y se lo deja SOLO a service_role, que es la
    llave secreta de las Edge Functions y de los cron.

  POR QUE NO ROMPE NADA
    - El navegador no llama a ninguna de las 3 (comprobado en el codigo).
    - Los postbacks y las Edge Functions entran con service_role y
      conservan el permiso (se les vuelve a conceder explicitamente).
    - Los cron corren como dueno de la funcion, no dependen de este GRANT.

  COMO EJECUTARLO
    Supabase -> SQL Editor -> New query -> pegar TODO -> Run.
    Es idempotente: se puede correr las veces que quieras.
*/


-- 1) Cerrar las 3 funciones
DO $$
DECLARE
  r record;
  v_lista text[] := ARRAY[
    'acreditar_saldo_usuario',
    'aplicar_resta_reverso_cpx',
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
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
      RAISE NOTICE 'Cerrada al publico (queda solo service_role): %', r.firma;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo ajustar %: %', r.firma, SQLERRM;
    END;
  END LOOP;
END $$;


-- 2) Resultado esperado: anon_puede = false, usuario_puede = false,
--    servicio_puede = true. Si servicio_puede saliera false, avisame:
--    ese postback no acreditaria.
SELECT p.proname                                                 AS funcion,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_puede,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS usuario_puede,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS servicio_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'acreditar_saldo_usuario',
    'aplicar_resta_reverso_cpx',
    'procesar_comisiones_pendientes'
  )
ORDER BY p.proname;


-- 3) Alarma: avisa si alguna quedo abierta al publico o sin servicio
DO $$
DECLARE
  r record;
  v_fallos int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'acreditar_saldo_usuario',
        'aplicar_resta_reverso_cpx',
        'procesar_comisiones_pendientes'
      )
  LOOP
    IF has_function_privilege('anon', r.oid, 'EXECUTE') THEN
      RAISE WARNING 'PELIGRO: % sigue abierta al publico sin sesion', r.proname;
      v_fallos := v_fallos + 1;
    END IF;
    IF NOT has_function_privilege('service_role', r.oid, 'EXECUTE') THEN
      RAISE WARNING 'PELIGRO: % perdio el permiso de servicio: ese postback no acreditaria', r.proname;
      v_fallos := v_fallos + 1;
    END IF;
  END LOOP;

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO OK: las 3 quedaron cerradas al publico y los postbacks conservan su permiso.';
  ELSE
    RAISE WARNING 'ATENCION: % revisiones fallaron. Avisame cual aparece.', v_fallos;
  END IF;
END $$;