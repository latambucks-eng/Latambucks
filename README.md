# LatamBucks

Sitio completo de microtareas (tragamonedas, cajas sorpresa, encuestas, ofertas,
referidos y retiros) con frontend React + Vite y backend 100% **Supabase**.

Este repositorio es independiente: no usa el SDK, el plugin ni el hosting de
ninguna plataforma propietaria. Toda la autenticación, los datos y las reglas de
negocio corren en Supabase.

## Requisitos

- Node.js 18 o superior
- Una cuenta/proyecto de Supabase con las tablas y RPC del proyecto

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
```

## Supabase

La URL del proyecto y la clave publicable se configuran en
`src/lib/supabaseClient.js` (`SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`). Es una
clave pública: los permisos reales los aplica RLS en la base.

Los scripts SQL (tablas, RPC, políticas RLS, triggers) están en `supabase/sql/`.
Se ejecutan una vez en el SQL Editor del proyecto, en el orden indicado por
`supabase/README-MIGRACION.md`.

Las Edge Functions viven en `supabase/functions/`. Para desplegarlas:

```bash
supabase functions deploy get-encuestas-disponibles
supabase functions deploy recargar-giros-smartlink
supabase functions deploy timewall-postback
supabase functions deploy theoremreach-postback
supabase functions deploy theoremreach-event-webhook
supabase functions deploy cpx-postback
supabase functions deploy cpagrip-postback
supabase functions deploy rapidoreach-webhook
supabase functions deploy get-rapidoreach-url
supabase functions deploy get-cpx-config
supabase functions deploy get-theoremreach-url
supabase functions deploy get-timewall-survey-url
```

Secrets que esperan esas funciones:

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
`SUPABASE_PUBLISHABLE_KEY`, `CPX_SECURITY_TOKEN`, `CPX_SECURE_HASH`,
`THEOREMREACH_API_KEY`, `THEOREMREACH_SECRET_KEY`, `CPALEAD_POSTBACK_PASSWORD`,
`CRON_SECRET`, `PAYONEER_EMAIL`, `ADMIN_EMAIL`, `USD_TO_ARS_RATE`.

```bash
supabase secrets set NOMBRE=valor
```

## Publicar en GitHub Pages

1. Subí el proyecto a un repositorio de GitHub.
2. Generá el build. En `usuario.github.io/nombre-del-repo/` hace falta la base:

```bash
PUBLIC_BASE=/nombre-del-repo/ npm run build
```

En un repo de usuario/organización (`usuario.github.io`) alcanza con
`npm run build`: la base por defecto es `/`.

3. En Settings → Pages elegí la rama y la carpeta donde quede `dist/`
   (por ejemplo, renombrá `dist/` a `docs/` y publicá `/docs`).

El fallback de rutas ya viene resuelto y el build lo genera solo: `404.html`
(con la base inyectada) guarda la ruta pedida y `index.html` la restaura antes
de que arranque React, así entrar directo a `/faq`, `/terminos` o recargar
estando logueado funciona igual en GitHub Pages. `public/.nojekyll` evita que
Jekyll procese el sitio.

## Estructura

```
src/
  pages/            Páginas (shell principal + legales)
  components/       UI y componentes de LatamBucks
  lib/              Supabase (auth, RPC, edge functions), i18n, lógica de juego
  assets/           Imágenes locales (slot, cajas, logos, ilustraciones)
supabase/
  functions/        Edge Functions (postbacks, URLs firmadas, encuestas)
  sql/              Esquema, RPC y políticas RLS
public/             favicon, og-image y logos estáticos
```

## Notas

- El idioma del sitio se guarda en `localStorage` (`lb_lang`) y sale por defecto
  en español.
- La sesión se guarda en `lb_token` + `lb_refresh_token` y se renueva sola antes
  de vencer.
- Todos los recursos gráficos son locales: no hay imágenes servidas desde
  servicios externos de la plataforma original.