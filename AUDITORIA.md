# Auditoría de la copia independiente (noviembre 2026)

Revisión completa de esta carpeta (`latambucks-portable`) como proyecto
autónomo, listo para subir a GitHub y publicar sin depender de Base44.

## 1. Independencia de Base44 — OK

- No queda **ninguna** referencia a Base44 en el código de la app
  (`src/`): sin SDK, sin `base44Client`, sin llamadas a funciones del
  backend viejo, sin imágenes alojadas en sus servidores.
- Las únicas menciones de "Base44" están en `supabase/sql/` y en
  `supabase/README-MIGRACION.md`, y son **documentación/scripts de
  limpieza** (por ejemplo `ELIMINAR-RESTOS-BASE44.sql`), no dependencias.
- El build compilado no contiene la palabra "base44".

## 2. Build y código — OK

- `vite build` compila sin errores ni advertencias de imports.
- `eslint` pasa sin errores.
- 169 archivos de código revisados: **todos los imports resuelven**
  (ni rutas `@/` rotas ni paquetes faltantes en `package.json`).
- Sin variables de entorno obligatorias: el único uso es
  `import.meta.env.BASE_URL`, que Vite define solo.
- Sin claves de servicio en el cliente (solo la clave pública de
  Supabase, que es la que corresponde).
- `404.html` + `.nojekyll` + restauración de ruta: probado el fallback de
  GitHub Pages (copia `404.html` al build con la base correcta).

## 3. Base de datos — coherente

- Las 8 tablas y las 19 RPCs que usa el frontend **existen** en la base.
- Todas las columnas consultadas (`select`, `order`, filtros y joins)
  existen en sus tablas.
- Las 12 Edge Functions del proyecto están **desplegadas** y responden
  (401/400/403 correctos cuando falta autorización, nunca 404).
- Cron de comisiones: corregido (era un choque de tipos `uuid`/`text`).
  Verificado en vivo: procesa y acredita bien; 0 fallos.

## 4. Seguridad — 3 hallazgos corregidos con script

Detectados llamando la API pública **sin sesión** (rol `anon`):

| Función | Antes | Qué permitía |
|---|---|---|
| `acreditar_saldo_usuario` | respondía 200 | regalarse puntos sin límite |
| `aplicar_resta_reverso_cpx` | respondía 200 | restar saldo a otro usuario |
| `registrar_video_con_limite` (versión vieja, `p_user_id`) | ejecutable | acreditar videos sin validar los 15 s |

El resto de las RPC de dinero ya estaba bien cerrado (401).

**Solución:** ejecutar `supabase/sql/BLINDAJE-RPC-DINERO.sql` en el
SQL Editor de Supabase. Revoca esas funciones para `anon` y para
usuarios comunes, y las deja solo para `service_role` (las Edge
Functions). **Ninguna pantalla de la app las usa**, así que nada se rompe.

Después se ejecuta `supabase/sql/VERIFICAR-PERMISOS-Y-FLUJOS.sql`, que
fija el mapa completo de permisos y lo muestra en pantalla:

| Rol | Qué puede hacer |
|---|---|
| `anon` (sin sesión) | nada: ninguna RPC de dinero |
| `authenticated` (usuario con sesión) | todas las RPC de la app (cajas, check-in, giros, videos, pruebas, disputas, campañas, retiros, referidos, ganadores, aviso, admin, comisiones, TimeWall) |
| `service_role` | todo, incluidos los postbacks de los 5 proveedores |

Ese script además imprime las políticas RLS por tabla (quién lee, edita
y borra) y avisa si alguna tabla quedó con RLS desactivado.

**Postbacks verificados en vivo:** los proveedores no escriben ni leen
tablas directamente. CPAGrip, CPX, TimeWall, RapidoReach y TheoremReach
llegan a su Edge Function, y esa llama a la RPC con `service_role`
(probado: las 5 de dinero y las 4 de TheoremReach responden 200 con esa
clave y 401 sin ella).

## 5. Observaciones menores (sin impacto en el funcionamiento)

- `insertHistorialTarea` está exportada en el cliente pero ninguna
  pantalla la usa: la política de INSERT de `historial_tareas` para
  usuarios autenticados podría cerrarse. Hoy no permite ganar dinero
  (el saldo solo se acredita desde las RPC), así que es cosmético.
- Las páginas `Login`, `Register`, `ForgotPassword` y `ResetPassword`
  reutilizan `AuthScreen`; conviven con la pantalla principal de acceso
  sin conflicto.
- Hay 58 scripts SQL históricos. Los vigentes son
  `BLINDAJE-RPC-DINERO.sql`, `VERIFICAR-PERMISOS-Y-FLUJOS.sql`,
  `CRONS-SUPABASE.sql` y `FIX-COMISIONES-UUID.sql`; el resto queda como
  historial.

## 6. Para publicar

```bash
npm install
npm run build     # genera dist/ listo para GitHub Pages o cualquier hosting
```

En GitHub Pages con subdirectorio: `PUBLIC_BASE=/nombre-del-repo/ npm run build`.