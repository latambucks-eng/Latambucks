# Migración a Supabase — Sin créditos de integración de Base44

## Resumen

Se migraron **21 backend functions** a Supabase (RPCs directos + Edge Functions).
Quedan **12 Edge Functions** que necesitás deployar manualmente en Supabase.

El frontend ya es 100% independiente de Base44: no usa su SDK, ni su backend,
ni sus imágenes. Todo va directo a Supabase por HTTPS.

---

## PASO 1: Ejecutar los SQL scripts en Supabase

### RUTA A — Base que ya está funcionando (tu caso)

Solo falta un archivo. Copiar y pegar **completo** en el SQL Editor → Run:

1. `supabase/sql/PENDIENTES-SUPABASE.sql`

Instala las 4 piezas que faltaban (bono de bienvenida, descuento al reversar
tareas CPX y las dos protecciones de saldo/rol), más el CHECK de proveedores
con `rapidoreach`. Es idempotente y al final muestra una verificación: deben
aparecer 4 funciones y 4 triggers.

`supabase/sql/tablas_base.sql` **no** hace falta en tu caso: las 5 tablas
troncales y el bucket `capturas-tareas` ya existen en esta base. Ese archivo
es el Paso 0 de la RUTA B (base nueva desde cero).

### RUTA B — Base nueva desde cero

Ejecutar en este orden en el **SQL Editor**:

**Núcleo**
0. `supabase/sql/tablas_base.sql` — las 5 tablas troncales (perfiles, retiros, historial_tareas, campanas_locales, pruebas_tareas_locales) + bucket `capturas-tareas`
1. `supabase/sql/migracion_supabase.sql` — tablas, RPCs y RLS base
2. `supabase/sql/config_supabase.sql` — tabla `app_config`
3. `supabase/sql/rls_policies.sql` — políticas RLS de todas las tablas
4. `supabase/sql/ejecutar_seguridad.sql` — bloqueo de columnas sensibles
5. `supabase/sql/seguridad_rpc_campana_saldo.sql`
6. `supabase/sql/reintegro_saldo_campanas.sql`
7. `supabase/sql/tragamonedas.sql` — giros, premio gordo, recargas
8. `supabase/sql/bono_bienvenida.sql` — bono de 500 pts
9. `supabase/sql/saldo_bono_columna.sql`
10. `supabase/sql/trigger_descontar_reverso.sql`
11. `supabase/sql/comprobante_pago.sql` — bucket `comprobantes-pagos`
12. `supabase/sql/avisos_usuario.sql`
13. `supabase/sql/theoremreach_eventos.sql`
14. `supabase/sql/sesiones_theoremreach.sql`
15. `supabase/sql/theoremreach_acreditacion_atomica.sql`

**Parches de corrección (todos idempotentes)**
16. `supabase/sql/fix_seguridad_perfiles.sql`
17. `supabase/sql/fix_descuento_reverso.sql`
18. `supabase/sql/fix_constraint_reversado.sql`
19. `supabase/sql/fix_comisiones_referido.sql`
20. `supabase/sql/comisiones_pendientes.sql`
21. `supabase/sql/fix_procesar_comisiones_pendientes.sql`
22. `supabase/sql/fix_procesar_comisiones_v2.sql`
23. `supabase/sql/registrar_referido_rpc.sql`
24. `supabase/sql/fix_rpc_referidos_definitivo.sql`
25. `supabase/sql/fix_get_mis_referidos_404.sql`
26. `supabase/sql/fix_overload_pgrst203.sql`
27. `supabase/sql/fix_trigger_retiros.sql`
28. `supabase/sql/fix_grants_authenticated.sql`
29. `supabase/sql/fix_avisos_admin_y_ganadores.sql`
30. `supabase/sql/ajuste_ganadores_todas.sql`
31. `supabase/sql/rls_fix_comisiones.sql`
32. `supabase/sql/rls_fix_recursion_pruebas.sql`
33. `supabase/sql/rls_reactivar_perfiles_campanas.sql`
34. `supabase/sql/security_advisor_fix.sql`
35. `supabase/sql/security_fix_rpc_advisor.sql`
36. `supabase/sql/security_fix_rpc_advisor_0028_final.sql`
37. `supabase/sql/security_fix_rpc_advisor_0028_extra.sql`
38. `supabase/sql/unificar_metodos_pago.sql`
39. `supabase/sql/paypal_surcharge.sql`
40. `supabase/sql/saldo_promocion.sql`
41. `supabase/sql/saldo_bono_backfill.sql` (opcional: bono a usuarios viejos)
42. `supabase/sql/rapidoreach_proveedor_check.sql`
43. `supabase/sql/corregir_video_15_segundos.sql`
44. `supabase/sql/fix_definitivo_actualizado.sql`
45. `supabase/sql/auto_aprobar_pg_cron.sql` — activa el cron de tareas vencidas

**IMPORTANTE:** En `config_supabase.sql`, actualizar los valores placeholders:
```sql
UPDATE public.app_config SET value = 'TU_TASA_REAL' WHERE key = 'usd_to_ars_rate';
UPDATE public.app_config SET value = 'TU_EMAIL_REAL_DE_PAYONEER' WHERE key = 'payoneer_email';
```

**Lo que se puede verificar por API y lo que no:** tablas, columnas, RPCs y
buckets de Storage se pueden auditar desde el panel; si los trabajos
programados (corte de los jueves, tareas vencidas, comisiones) están activos
se revisa en **Database → Cron jobs**.

---

## PASO 2: Deployar las Edge Functions en Supabase

Las 6 Edge Functions están en `supabase/functions/`:

### 2.1 Instalar Supabase CLI (si no lo tenés)
```bash
npm install -g supabase
```

### 2.2 Hacer login y linkear el proyecto
```bash
supabase login
supabase link --project-ref ednvcqdyeakdsssrpgdg
```

### 2.3 Configurar los secrets
```bash
supabase secrets set SUPABASE_URL=https://TU-PROYECTO.supabase.co
supabase secrets set SUPABASE_ANON_KEY=tu_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
supabase secrets set CPX_SECURITY_TOKEN=tu_cpx_security_token
supabase secrets set CPX_SECURE_HASH=tu_cpx_secure_hash
supabase secrets set THEOREMREACH_API_KEY=tu_theoremreach_api_key
supabase secrets set THEOREMREACH_SECRET_KEY=tu_theoremreach_secret_key
supabase secrets set TIMEWALL_SECRET_KEY=tu_timewall_secret_key
supabase secrets set CPALEAD_POSTBACK_PASSWORD=tu_password_de_cpagrip
supabase secrets set RAPIDOREACH_APP_ID=tu_app_id_de_rapidoreach
supabase secrets set USD_TO_ARS_RATE=1000
```

### 2.4 Deployar las 12 Edge Functions
```bash
supabase functions deploy get-theoremreach-url --no-verify-jwt
supabase functions deploy get-cpx-config --no-verify-jwt
supabase functions deploy get-encuestas-disponibles --no-verify-jwt
supabase functions deploy get-timewall-survey-url --no-verify-jwt
supabase functions deploy get-rapidoreach-url --no-verify-jwt
supabase functions deploy cpx-postback --no-verify-jwt
supabase functions deploy theoremreach-postback --no-verify-jwt
supabase functions deploy theoremreach-event-webhook --no-verify-jwt
supabase functions deploy timewall-postback --no-verify-jwt
supabase functions deploy rapidoreach-webhook --no-verify-jwt
supabase functions deploy cpagrip-postback --no-verify-jwt
supabase functions deploy recargar-giros-smartlink --no-verify-jwt
```

---

## PASO 3: Actualizar URLs de postbacks en los dashboards de los proveedores

### CPX Research
- URL anterior: `https://latambucks.base44.app/functions/cpxPostback`
- URL nueva: `https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/cpx-postback`

### TheoremReach
- URL anterior: `https://latambucks.base44.app/functions/theoremreachPostback`
- URL nueva: `https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/theoremreach-postback`

### TimeWall
- URL anterior: `https://latambucks.base44.app/functions/timewallPostback`
- URL nueva: `https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/timewall-postback`

### RapidoReach
- URL nueva: `https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/rapidoreach-webhook`

### CPAGrip
- URL anterior: `https://latambucks.base44.app/functions/cpagripPostback`
- URL nueva: `https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/cpagrip-postback`

---

## PASO 4: Compilar y publicar en GitHub Pages

El frontend es una app estática: vive entera en GitHub Pages, sin servidor.

### 4.1 Compilar

```bash
npm install
npm run build      # genera la carpeta dist/
```

- **Usuario/organización** (`https://usuario.github.io/`) → sin nada extra.
- **Repositorio** (`https://usuario.github.io/nombre-del-repo/`) → compilá con
  la base del repo:

```bash
PUBLIC_BASE=/nombre-del-repo/ npm run build
```

Esa base la usan a la vez los assets, el router y el fallback de rutas, así
que no hay nada más que editar a mano.

### 4.2 Publicar

Settings → Pages → *Build and deployment* → **Deploy from a branch** →
rama `main`, carpeta `/ (root)` si `dist/` se sube como raíz del repo, o
`/docs` si renombrás `dist/` a `docs`. También sirve subir `dist/` con
GitHub Actions.

### 4.3 Fallback de rutas (ya incluido)

GitHub Pages no reescribe URLs y no tiene reglas de redirect como otros
hostings: las rutas del cliente (`/faq`, `/terminos`, `/perfiles`…) devuelven
404 al entrar directo o al recargar. Se resuelve con el 404 propio de GitHub:

1. `404.html` (en la raíz del proyecto) guarda la ruta pedida y vuelve al index.
2. `index.html` la restaura con `history.replaceState` antes de que arranque React.

El build copia `404.html` a `dist/` reemplazando `__BASE_URL__` por la base
real, así funciona igual en dominio raíz que en subdirectorio. `public/.nojekyll`
evita que Jekyll procese el sitio.

### Verificación rápida después de subir

1. Entrá a la home y logueate.
2. Entrá directo (pegando la URL a mano) a `/faq` y a `/terminos`: deben abrir
   la página, no un 404.
3. Recargá la app estando logueado: la sesión debe seguir activa.

---

## Lo que se migró (21 funciones → Supabase RPCs)

| Función Base44 | Reemplazo |
|---|---|
| checkAdminStatus | RPC `is_admin()` |
| getExchangeRate | Tabla `app_config` |
| getAvisoActivo | RPC `get_aviso_activo()` |
| getPayoneerEmail | Tabla `app_config` |
| getGanadoresRecientes | RPC `get_ganadores_recientes()` |
| getMisReferidos | RPC `get_mis_referidos()` |
| manageAvisoSistema | CRUD directo tabla `avisos_sistema` |
| timewallMantenimiento | RPCs `get/set_timewall_mantenimiento()` |
| updatePassword | Supabase Auth API directo |
| buscarReferido | RPC `buscar_referido()` |
| reclamarCheckinDiario | RPC `reclamar_checkin()` |
| abrirCajaSorpresa | RPC `abrir_caja_sorpresa()` |
| iniciarSesionVideo | RPC `iniciar_sesion_video()` |
| registrarVideo | RPC `registrar_video_con_limite()` |
| aprobarPrueba | RPC `aprobar_prueba()` |
| rechazarPrueba | RPC `rechazar_prueba()` |
| iniciarDisputa | RPC `iniciar_disputa()` |
| rechazarRetiro | RPC `rechazar_retiro()` |
| autoAprobarVencidas | pg_cron (ya configurado) |
| procesarCicloFacturacion | pg_cron (nuevo) |
| acreditarComisionReferido | Trigger + RPC interno |

## Lo que quedó como Edge Functions (12 funciones — necesitan secretos)

| Función Base44 | Edge Function |
|---|---|
| getTheoremReachUrl | `get-theoremreach-url` |
| getCpxConfig | `get-cpx-config` |
| getEncuestasDisponibles | `get-encuestas-disponibles` |
| (TimeWall) | `get-timewall-survey-url` |
| (RapidoReach) | `get-rapidoreach-url` |
| cpxPostback | `cpx-postback` |
| theoremreachPostback | `theoremreach-postback` |
| (TheoremReach eventos) | `theoremreach-event-webhook` |
| timewallPostback | `timewall-postback` |
| (RapidoReach postback) | `rapidoreach-webhook` |
| cpagripPostback | `cpagrip-postback` |
| (recarga de giros) | `recargar-giros-smartlink` |