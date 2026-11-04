# Activar la corrección de TheoremReach en Supabase

Los cambios locales NO despliegan funciones ni ejecutan SQL en Supabase automáticamente.

## 1. Base de datos primero

En el SQL Editor del proyecto actual, ejecutar `base44/shared/theoremreach_acreditacion_atomica.sql`.
Debe estar instalada la tabla `comisiones_pendientes` y las RPCs de saldo existentes.
Si `historial_tareas` todavía no permite `reversado`, aplicar antes `base44/shared/fix_constraint_reversado.sql`.
La nueva operación sólo admite `service_role`; no exponerla al frontend.

## 2. Redesplegar las tres funciones

Desde una terminal, en el proyecto vinculado a Supabase (NO en SQL Editor):

```bash
supabase functions deploy get-theoremreach-url --no-verify-jwt
supabase functions deploy theoremreach-postback --no-verify-jwt
supabase functions deploy theoremreach-event-webhook --no-verify-jwt
```

Antes del event-webhook ejecutar también `base44/shared/theoremreach_eventos.sql`.

La función del enlace verifica el token del usuario con Supabase Auth.
El postback no necesita JWT de usuario: exige la firma del proveedor.
Mantener los secretos existentes en Supabase, sin copiarlos a la URL del callback.

## 3. Panel de TheoremReach

Mantener el endpoint Supabase ya integrado; no usar el endpoint antiguo de Base44.
Configurar el Reward Callback con las variables documentadas para identificar la recompensa y al usuario:

```text
https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/theoremreach-postback?user_id={user_id}&tx_id={tx_id}&external_transaction_id={external_transaction_id}&reward={reward}
```

Confirmar que esta aplicación admite esas variables en su panel (la guía de Routers las documenta).
No añadir un `hash` manual: TheoremReach lo agrega al final sobre la URL exacta.
Los campos del callback deben viajar en la query; este endpoint no interpreta cuerpos JSON/form sin firmar.

**«URL del evento Webhook»** ahora tiene su propio endpoint:

```text
https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/theoremreach-event-webhook
```

Usa `enc_salt` en la URL y cuerpo JSON con `data.event_type` (`reversal` o `ban`), conforme a https://theoremreach.com/docs/reporting, sección Webhooks. La firma cubre la URL hasta `&hash=`; no cubre el cuerpo. `data.api_key` debe coincidir con `THEOREMREACH_API_KEY`.

La documentación pública no define el formato del botón TEST. Se admite `event_type=test` únicamente si llega explícitamente con firma válida y la API key correspondiente; no mueve saldo. No se garantiza compatibilidad del botón TEST sin conocer su petición real.

Los reversos usan `amount_in_currency` (puntos, no dólares) y el propietario del evento; si ya existe el crédito, la operación descuenta sus puntos originales y cancela comisiones pendientes. Los bloqueos se registran para conciliación sin bloquear Supabase Auth ni restringir automáticamente el acceso al proveedor. Los reenvíos se deduplican por `enc_salt` en la misma transacción que sus efectos.

El debug del Reward Callback también se firma: no aceptar callbacks sin firma.
Confirmar que `partner_id=25593` corresponde a la aplicación/placement y que el secreto pertenece a ella.
Los nuevos enlaces envían `exchange_rate=1000`: **1000 puntos = 1 USD**.
No multiplicar nuevamente `reward`; ya viene expresado en puntos.
Las sesiones abiertas con el enlace anterior conservan su tasa anterior; no reajustar recompensas históricas automáticamente.

## Alcance de los reversos

Acepta `reversal=true` del Reward Callback y cantidades negativas documentadas para el router fijo.
El Event Webhook de bans/reversals es un mecanismo distinto y no debe apuntarse a este endpoint.
Cancela comisiones aún pendientes; no descuenta automáticamente comisiones ya pagadas al patrocinador.
Los registros históricos del endpoint anterior que figuran como aprobados no se acreditan de nuevo: requieren conciliación para determinar si el saldo realmente fue pagado.

## Confirmación de producción

La corrección sólo queda activa después del SQL, los despliegues y la configuración del panel.
No equivale a una confirmación de callback real exitoso.