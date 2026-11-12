// LatamBucks - Supabase REST client (native fetch).

const SUPABASE_URL = "https://ednvcqdyeakdsssrpgdg.supabase.co";
let _key = "";
const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;
const FUNCTIONS = `${SUPABASE_URL}/functions/v1`;
// Publishable key de Supabase: es una clave PÚBLICA, pensada para usarse en el
// navegador. No otorga permisos extra — cada tabla la sigue controlando RLS.
// Antes se pedía a una función del backend en cada carga de la app; ahora vive
// acá para que el login, el registro, la recuperación de contraseña y la
// restauración de sesión funcionen siempre, sin depender de la disponibilidad
// del backend.
// Si se rota la key en Supabase, actualizar también el secret
// SUPABASE_PUBLISHABLE_KEY y este valor.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gF_BcQPjHQAykcpjjaNEfw_ZKZgJYyj";

export async function initSupabaseConfig() {
  if (_key) return;
  if (!SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
    throw new Error('La configuración pública de Supabase no es válida');
  }
  _key = SUPABASE_PUBLISHABLE_KEY;
}

function baseHeaders(token) {
  return {
    apikey: _key,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Guardián de sesión: cuando Supabase rechaza el token (JWT expirado o
// inválido), todas las llamadas (REST, auth, storage, edge) notifican acá
// para que la app cierre la sesión local y muestre el login limpio, en vez
// de dejar un "JWT expirado" en rojo al usuario.
let _onSessionExpired = null;
export function setSessionExpiredHandler(fn) {
  _onSessionExpired = fn;
}

// Detecta si un error corresponde a un token de Supabase vencido/inválido.
function isJwtExpiredError(message) {
  const m = String(message || "").toLowerCase();
  return (
    m.includes("jwt expired") ||
    m.includes("jwt expirado") ||
    m.includes("invalid jwt") ||
    m.includes("jwt token is invalid")
  );
}

// ---- Refresh token: renueva el access_token antes de que venza ----
export const REFRESH_TOKEN_KEY = "lb_refresh_token";

// Notifica al store de React cuando un refresh exitoso actualiza el token,
// para que todos los componentes usen el token nuevo.
let _onTokenRefreshed = null;
export function setTokenRefreshedHandler(fn) {
  _onTokenRefreshed = fn;
}

// Singleton: evita múltiples refreshes simultáneos si varias llamadas
// reciben 401 al mismo tiempo (ej: polling de 5s + evento focus).
let _refreshPromise = null;

export async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error("No refresh token");
      await initSupabaseConfig();
      const res = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
        method: "POST",
        headers: baseHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
      const data = await res.json();
      if (data?.access_token) {
        localStorage.setItem("lb_token", data.access_token);
        if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        try { _onTokenRefreshed && _onTokenRefreshed(data.access_token); } catch (_e) {}
      }
      return data.access_token;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

// Decodifica el claim `exp` del JWT (segundos epoch) para saber cuándo vence.
// Soporta base64url (reemplaza - y _ de vuelta a + y /).
export function decodeJwtExp(token) {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

// Offset de reloj cliente→servidor en ms. Se calcula una sola vez leyendo el
// header `Date` de una respuesta de Supabase REST y se cachea por sesión.
// Devuelve la diferencia (serverNow - clientNow), así el cliente puede
// calcular la hora del servidor como Date.now() + offset. Si falla o no se
// puede leer, devuelve 0 (cae al reloj del cliente, como hasta ahora).
let _serverTimeOffset = null;
export async function getServerTimeOffset() {
  if (_serverTimeOffset !== null) return _serverTimeOffset;
  try {
    // HEAD a la raíz del REST: respuesta mínima, el servidor siempre manda Date.
    const res = await fetch(`${REST}/perfiles?select=id&limit=1`, {
      method: "GET",
      headers: baseHeaders(null),
    });
    const dateHeader = res.headers.get("Date");
    if (!dateHeader) return 0;
    const serverMs = Date.parse(dateHeader);
    if (!Number.isFinite(serverMs)) return 0;
    // Mitiga el RTT: el servidor respondió ~mid-way del round-trip, así que
    // sumamos la mitad del RTT medido para acercarnos al "ahora" del servidor.
    const clientMs = Date.now();
    _serverTimeOffset = serverMs - clientMs;
    return _serverTimeOffset;
  } catch (_e) {
    return 0;
  }
}

async function parse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message =
      (data && (data.msg || data.message || data.error_description || data.error)) ||
      `Error ${res.status}`;
    const finalMsg = typeof message === "string" ? message : JSON.stringify(message);
    // 401 con JWT vencido: intentar refresh ANTES de cerrar sesión. Si el
    // refresh funciona, el token se actualiza en localStorage y se notifica
    // al store; la llamada actual falla (no se puede reintentar desde acá)
    // pero las siguientes usan el token nuevo → el usuario NO es deslogueado.
    // Si el refresh también falla (refresh token inválido/revocado), recién
    // ahí se cierra la sesión como antes.
    if (res.status === 401 && isJwtExpiredError(finalMsg)) {
      try {
        await refreshAccessToken();
        const err = new Error(finalMsg);
        err.tokenRefreshed = true;
        throw err;
      } catch (_refreshErr) {
        try { _onSessionExpired && _onSessionExpired(); } catch (_e) {}
      }
    }
    throw new Error(finalMsg);
  }
  return data;
}

/* ---------- AUTH ---------- */
export async function supabaseSignup(email, password) {
  const res = await fetch(`${AUTH}/signup`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return parse(res);
}

export async function supabaseLogin(email, password) {
  const res = await fetch(`${AUTH}/token?grant_type=password`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return parse(res); // { access_token, user, ... }
}

export async function supabaseGetUser(token) {
  const res = await fetch(`${AUTH}/user`, { headers: baseHeaders(token) });
  return parse(res);
}

export async function supabaseLogout(token) {
  await fetch(`${AUTH}/logout`, { method: "POST", headers: baseHeaders(token) });
}

// Elimina la cuenta del usuario autenticado en Supabase (DELETE /auth/v1/user).
// El servidor borra el usuario y sus datos de auth; los registros asociados
// (historial, perfil) dependen de la configuración de triggers/cascade del
// proyecto. Lanza si la solicitud falla.
export async function supabaseDeleteAccount(token) {
  const res = await fetch(`${AUTH}/user`, {
    method: "DELETE",
    headers: baseHeaders(token),
  });
  if (!res.ok) {
    throw new Error("No se pudo eliminar la cuenta");
  }
  return true;
}

export async function supabaseUpdateUser(token, data) {
  const res = await fetch(`${AUTH}/user`, {
    method: "PUT",
    headers: baseHeaders(token),
    body: JSON.stringify(data),
  });
  return parse(res);
}

export async function supabaseRecoverPassword(email) {
  // BASE_URL respeta subdirectorios (GitHub Pages: /repo/). En dominio raíz
  // es "/" y el enlace queda igual que antes.
  const basePath = (import.meta.env?.BASE_URL || "/").replace(/\/+$/, "");
  const redirectTo = `${window.location.origin}${basePath}/actualizar-clave`;
  const res = await fetch(`${AUTH}/recover`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
  return parse(res);
}

/* ---------- DB (perfiles) ---------- */
export async function fetchPerfil(token, userId) {
  const res = await fetch(
    `${REST}/perfiles?id=eq.${encodeURIComponent(userId)}&select=*`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  return Array.isArray(rows) ? rows[0] : null;
}

// País real por IP: la Edge Function valida el JWT, resuelve la
// geolocalización y fija perfiles.pais_detectado con service_role (el
// cliente no puede escribir esa columna). Devuelve { pais_detectado } o
// null si no se pudo detectar; se reintenta en el próximo inicio de sesión.
export async function detectarPaisUsuario(token) {
  if (!token) return null;
  const res = await fetch(`${FUNCTIONS}/detectar-pais`, {
    method: "POST",
    headers: baseHeaders(token),
    body: "{}",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.pais_detectado ? data : null;
}

export async function insertPerfil(token, userId, email, pais, referidoPor) {
  const body = {
    id: userId,
    email,
    pais,
    saldo_disponible: 0,
    saldo_pendiente: 0,
    codigo_referido: `LB-${userId.slice(0, 6).toUpperCase()}`,
  };
  if (referidoPor) body.referido_por = referidoPor;
  const res = await fetch(`${REST}/perfiles`, {
    method: "POST",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return parse(res);
}

export async function fetchRetiros(token, userId) {
  const res = await fetch(
    `${REST}/retiros?user_id=eq.${encodeURIComponent(userId)}&select=*&order=creado_el.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

export async function fetchPendingRetiros(token) {
  const res = await fetch(
    `${REST}/retiros?estado=eq.pendiente&select=*,perfiles(email,pais)&order=creado_el.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

export async function patchRetiro(token, id, payload) {
  const res = await fetch(`${REST}/retiros?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function insertHistorialTarea(token, payload) {
  const res = await fetch(`${REST}/historial_tareas`, {
    method: "POST",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function updatePerfil(token, userId, payload) {
  const res = await fetch(`${REST}/perfiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function insertRetiro(token, payload) {
  const res = await fetch(`${REST}/retiros`, {
    method: "POST",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function fetchCampanasLocales(token) {
  const res = await fetch(
    `${REST}/campanas_locales?activa=eq.true&estado_pago=eq.aprobado&select=*&order=created_at.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

export async function fetchPendingCampanas(token) {
  const res = await fetch(
    `${REST}/campanas_locales?estado_pago=eq.pendiente&select=*&order=created_at.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

export async function patchCampana(token, id, payload) {
  const res = await fetch(`${REST}/campanas_locales?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function insertCampanaLocal(token, payload) {
  const res = await fetch(`${REST}/campanas_locales`, {
    method: "POST",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

// Activa una campaña financiada con el saldo promocional interno del
// anunciante. RPC SECURITY DEFINER: valida auth, autorización (anunciante
// == caller o admin), saldo suficiente, y descuenta el saldo + crea la
// campaña activa/aprobada ATOMICAMENTE en el servidor. Reemplaza el par
// (updatePerfil de saldo + insertCampanaLocal) que el frontend hacía por
// separado — un usuario ya NO puede incrementar su propio saldo_promocion.
export async function activarCampanaConSaldo(token, args) {
  const res = await fetch(`${REST}/rpc/activar_campana_con_saldo`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      p_titulo: args.titulo,
      p_enlace_url: args.enlace_url,
      p_instrucciones: args.instrucciones,
      p_puntos_recompensa: Number(args.puntos_recompensa),
      p_monto: Number(args.monto),
      p_anunciante_email: args.anunciante_email,
      p_moneda: args.moneda,
      p_visitas_compradas: Number(args.visitas_compradas),
    }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "Error al activar la campaña con saldo");
  }
  return data;
}

export async function fetchPerfilByCodigo(token, codigo) {
  const res = await fetch(
    `${REST}/perfiles?codigo_referido=eq.${encodeURIComponent(codigo)}&select=*&limit=1`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  if (Array.isArray(rows) && rows.length) return rows[0];
  const res2 = await fetch(
    `${REST}/perfiles?id=eq.${encodeURIComponent(codigo)}&select=*&limit=1`,
    { headers: baseHeaders(token) }
  );
  const rows2 = await parse(res2);
  return Array.isArray(rows2) && rows2.length ? rows2[0] : null;
}

// Inicia una sesión de video recompensado — registra el timestamp de
// inicio en el servidor. El frontend llama esta función al hacer clic en
// "Ver Video"; después de 20 segundos llama a rpcRegistrarVideoConLimite
// con el sesion_id devuelto. El servidor valida que pasaron 20s reales.
export async function iniciarSesionVideo(token) {
  const res = await fetch(`${REST}/rpc/iniciar_sesion_video`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  const sesionId = await parse(res);
  return { sesion_id: sesionId };
}

export async function rpcRegistrarVideoConLimite(token, userId, sesionId) {
  // El RPC valida server-side que hayan pasado al menos 15 segundos
  // desde que se inició la sesión (anti-bypass del temporizador).
  const res = await fetch(`${REST}/rpc/registrar_video_con_limite`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      p_limite: 20,
      p_recompensa: 1,
      p_sesion_id: sesionId,
    }),
  });
  return await parse(res);
}

/* ---------- PRUEBAS TAREAS LOCALES ---------- */

// Trae los campana_id que el usuario ya envió (para ocultarlos)
export async function fetchPruebasByUsuario(token, userId) {
  const res = await fetch(
    `${REST}/pruebas_tareas_locales?usuario_id=eq.${encodeURIComponent(userId)}&select=campana_id,estado`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

// Sube la captura al bucket público "capturas-tareas" y devuelve la URL pública
export async function uploadCapturaToStorage(token, file, userId) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${STORAGE}/object/capturas-tareas/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: _key,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Error al subir captura");
  }
  return `${STORAGE}/object/public/capturas-tareas/${path}`;
}

// Sube el comprobante de pago al bucket público "comprobantes-pagos" y devuelve la URL pública
export async function uploadComprobanteToStorage(token, file, userId) {
  const ext = (file.name.split(".").pop() || "webp").toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${STORAGE}/object/comprobantes-pagos/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: _key,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Error al subir comprobante");
  }
  return `${STORAGE}/object/public/comprobantes-pagos/${path}`;
}

// Inserta la prueba con estado = 'pendiente'
export async function insertPruebaTarea(token, payload) {
  const res = await fetch(`${REST}/pruebas_tareas_locales`, {
    method: "POST",
    headers: { ...baseHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

// JOIN pruebas_tareas_locales + campanas_locales — solo pendientes del anunciante
export async function fetchPendingPruebasForAnunciante(token, email) {
  const res = await fetch(
    `${REST}/pruebas_tareas_locales?select=*,campanas_locales!inner(titulo,enlace_url,puntos_recompensa,anunciante_email,instrucciones)&estado=eq.pendiente&campanas_locales.anunciante_email=eq.${encodeURIComponent(email)}&order=creado_el.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

// Aprobar: delega al backend function (service_role) que valida autorización
// del anunciante/admin server-side y ejecuta todo el flujo de forma segura.
export async function aprobarPrueba(token, prueba) {
  const pruebaId = typeof prueba === "string" ? prueba : prueba?.id;
  const res = await fetch(`${REST}/rpc/aprobar_prueba`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_prueba_id: String(pruebaId) }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "Error al aprobar la prueba");
  }
  return data;
}

// Rechazar: delega al backend function (service_role) que valida autorización
// del anunciante/admin server-side y ejecuta el rechazo de forma segura.
export async function rechazarPrueba(token, pruebaId, motivo) {
  const pruebaIdValue = typeof pruebaId === "string" ? pruebaId : pruebaId?.id;
  const res = await fetch(`${REST}/rpc/rechazar_prueba`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_prueba_id: String(pruebaIdValue), p_motivo: motivo || null }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "Error al rechazar la prueba");
  }
  return data;
}

// Verifica si el usuario es anunciante (tiene campañas con su email)
export async function checkIsAnunciante(token, email) {
  const res = await fetch(
    `${REST}/campanas_locales?anunciante_email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  return Array.isArray(rows) && rows.length > 0;
}

// Reintegra cupos sobrantes de una campaña al saldo_promocion del anunciante.
// Llamado por admin cuando una campaña se pausa/expira (service-side via RPC).
export async function reintegrarSaldoCampana(token, campanaId) {
  const res = await fetch(`${REST}/rpc/reintegrar_saldo_campana`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_campana_id: campanaId }),
  });
  return parse(res);
}

// Pausa/desactiva una campaña y reintegra automáticamente el saldo sobrante
// al saldo_promocion del anunciante (admin o anunciante propietario). Valida
// autorización server-side y ejecuta el reintegro en la misma transacción.
export async function administrarEstadoCampana(token, campanaId, activa = false) {
  const res = await fetch(`${REST}/rpc/administrar_estado_campana`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_campana_id: String(campanaId), p_activa: !!activa }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "Error al pausar la campaña");
  }
  return data;
}

// Trae todas las campañas del anunciante (activas y pendientes de aprobación)
export async function fetchMisCampanas(token, email) {
  const res = await fetch(
    `${REST}/campanas_locales?anunciante_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

/* ---------- BLOG ---------- */

// Artículos del blog: lectura pública, sin sesión. Si la tabla todavía no
// existe o viene vacía devuelve [] y las páginas usan el contenido incluido
// en el repo (src/lib/blog/blogContent.js).
export async function fetchBlogArticulos() {
  try {
    await initSupabaseConfig();
    const res = await fetch(
      `${REST}/blog_articulos?publicado=eq.true&select=slug,titulo,extracto,etiquetas,contenido,autor,minutos_lectura,publicado_en&order=publicado_en.desc`,
      { headers: baseHeaders() }
    );
    const rows = await parse(res);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/* ---------- DISPUTAS Y RECLAMOS ---------- */

// Avisos de reversos/descuentos: trae las tareas de historial_tareas que el
// proveedor revirtió (estado = 'reversado'), para mostrar al usuario en su
// perfil el detalle de qué proveedor descontó puntos y cuándo.
export async function fetchAvisosReversos(token, userId) {
  const res = await fetch(
    `${REST}/historial_tareas?usuario_id=eq.${encodeURIComponent(userId)}&estado=eq.reversado&order=creado_el.desc&select=id,proveedor,tarea_externa_id,puntos_ganados,creado_el`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

// Avisos individuales que el admin envió a este usuario (tabla avisos_usuario).
// Si la tabla no existe todavía, devuelve array vacío sin romper el flujo.
export async function fetchAvisosUsuario(token, userId) {
  try {
    const res = await fetch(
      `${REST}/avisos_usuario?usuario_id=eq.${encodeURIComponent(userId)}&order=creado_el.desc&select=id,titulo,mensaje,tipo,creado_el`,
      { headers: baseHeaders(token) }
    );
    const rows = await parse(res);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

// Admin: busca usuarios por email (para seleccionar a quién enviar el aviso)
export async function searchUsuariosByEmail(token, email) {
  await initSupabaseConfig();
  const res = await fetch(
    `${REST}/perfiles?email=ilike.${encodeURIComponent(`%${email}%`)}&select=id,email,pais&limit=10`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

// Admin: crea un aviso individual para un usuario
export async function createAvisoUsuario(token, data) {
  await initSupabaseConfig();
  const res = await fetch(`${REST}/avisos_usuario`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      usuario_id: data.usuario_id,
      titulo: String(data.titulo).slice(0, 120),
      mensaje: String(data.mensaje).slice(0, 1000),
      tipo: ["info", "success", "warning", "error"].includes(data.tipo) ? data.tipo : "info",
    }),
  });
  return parse(res);
}

// Admin: lista todos los avisos enviados (con email del destinatario).
// Dos consultas: primero los avisos y después los perfiles de sus destinatarios
// (no hay FK entre avisos_usuario y perfiles, por eso no se pueden embeber).
export async function fetchAllAvisosUsuario(token) {
  await initSupabaseConfig();
  const res = await fetch(
    `${REST}/avisos_usuario?order=creado_el.desc&select=*&limit=100`,
    { headers: baseHeaders(token) }
  );
  const avisos = await parse(res);
  if (!Array.isArray(avisos) || avisos.length === 0) return [];

  const ids = [...new Set(avisos.map((a) => a.usuario_id).filter(Boolean))];
  const perfilesMap = new Map();
  if (ids.length > 0) {
    const perfilesRes = await fetch(
      `${REST}/perfiles?id=in.(${ids.map((i) => encodeURIComponent(i)).join(",")})&select=id,email,pais`,
      { headers: baseHeaders(token) }
    );
    const perfiles = await parse(perfilesRes);
    if (Array.isArray(perfiles)) {
      for (const p of perfiles) perfilesMap.set(p.id, p);
    }
  }

  return avisos.map((a) => ({
    ...a,
    email: perfilesMap.get(a.usuario_id)?.email || null,
    pais: perfilesMap.get(a.usuario_id)?.pais || null,
  }));
}

// Admin: borra un aviso
export async function deleteAvisoUsuario(token, id) {
  await initSupabaseConfig();
  const res = await fetch(`${REST}/avisos_usuario?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: baseHeaders(token),
  });
  return res.ok;
}

// Historial completo del usuario con datos de la campaña
export async function fetchHistorialPruebas(token, userId) {
  const res = await fetch(
    `${REST}/pruebas_tareas_locales?usuario_id=eq.${encodeURIComponent(userId)}&select=*,campanas_locales(titulo,puntos_recompensa,anunciante_email,instrucciones)&order=creado_el.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

// Usuario inicia disputa sobre una prueba rechazada — validación server-side
// (propiedad, estado, sin disputa previa, límite de 24hs)
export async function iniciarDisputa(token, pruebaId, motivo) {
  const res = await fetch(`${REST}/rpc/iniciar_disputa`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_prueba_id: String(pruebaId), p_motivo: motivo }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "Error al iniciar la disputa");
  }
  return data;
}

// Admin: trae todas las disputas pendientes con datos de campaña y usuario
export async function fetchPendingDisputas(token) {
  const res = await fetch(
    `${REST}/pruebas_tareas_locales?estado=eq.en_disputa&select=*,campanas_locales(titulo,enlace_url,puntos_recompensa,anunciante_email,instrucciones),perfiles(email)&order=creado_el.desc`,
    { headers: baseHeaders(token) }
  );
  return parse(res);
}

// Auto-aprobar tareas con más de 48h sin revisar — delega al backend
// function (service_role) que acredita saldo + comisión de referido.
export async function rpcAutoAprobarVencidas(token) {
  const res = await fetch(`${REST}/rpc/auto_aprobar_tareas_vencidas`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  const data = await parse(res);
  const aprobadas = data?.aprobadas ?? (Array.isArray(data) ? (data[0]?.aprobadas || 0) : 0) ?? 0;
  return { success: true, aprobadas };
}

/* ---------- ESTADÍSTICAS (INICIO) ---------- */

export async function fetchTareasHoy(token, userId) {
  // Zona horaria Argentina (UTC-3, sin DST): medianoche Argentina = 03:00 UTC.
  // Se usa timestamp ISO completo porque PostgRest rechaza date-only (400)
  // al filtrar columnas timestamptz.
  const now = new Date();
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const today = `${ar.getUTCFullYear()}-${String(ar.getUTCMonth() + 1).padStart(2, "0")}-${String(ar.getUTCDate()).padStart(2, "0")}T03:00:00Z`;
  const res = await fetch(
    `${REST}/historial_tareas?usuario_id=eq.${encodeURIComponent(userId)}&estado=eq.aprobado&creado_el=gte.${today}&select=id`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  return Array.isArray(rows) ? rows.length : 0;
}

export async function fetchVideosHoy(token, userId) {
  const now = new Date();
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const today = `${ar.getUTCFullYear()}-${String(ar.getUTCMonth() + 1).padStart(2, "0")}-${String(ar.getUTCDate()).padStart(2, "0")}T03:00:00Z`;
  const res = await fetch(
    `${REST}/historial_tareas?usuario_id=eq.${encodeURIComponent(userId)}&proveedor=eq.monetag_video&creado_el=gte.${today}&select=id`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  return Array.isArray(rows) ? rows.length : 0;
}

export async function fetchRetirosTotales(token, userId) {
  const res = await fetch(
    `${REST}/retiros?user_id=eq.${encodeURIComponent(userId)}&select=id`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  return Array.isArray(rows) ? rows.length : 0;
}

/* ---------- CHECK-IN DIARIO ---------- */

// Verifica si el usuario ya reclamó y si NO pasaron 24 horas exactas desde
// el último reclamo. Busca el registro más reciente con prefijo
// checkin_<userId>_ en tarea_externa_id y compara creado_el con ahora.
export async function fetchCheckinHoy(token, userId) {
  const res = await fetch(
    `${REST}/historial_tareas?usuario_id=eq.${encodeURIComponent(userId)}&tarea_externa_id=like.${encodeURIComponent(`checkin_${userId}_*`)}&order=creado_el.desc&limit=1&select=creado_el`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  const VEINTICUATRO_HS = 24 * 60 * 60 * 1000;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].creado_el) {
    const ultimaFecha = new Date(rows[0].creado_el);
    if (Date.now() - ultimaFecha.getTime() < VEINTICUATRO_HS) {
      return {
        claimed: true,
        proximaDisponible: new Date(ultimaFecha.getTime() + VEINTICUATRO_HS).toISOString(),
      };
    }
  }
  return { claimed: false, proximaDisponible: null };
}

// Reclama la recompensa diaria — delega al backend function (service_role)
export async function reclamarCheckinDiario(token) {
  const res = await fetch(`${REST}/rpc/reclamar_checkin`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  return await parse(res);
}

/* ---------- CAJAS SORPRESA ---------- */

// Verifica si el usuario ya abrió una caja (cooldown 12h estricto)
export async function fetchCajaCooldown(token, userId) {
  const res = await fetch(
    `${REST}/historial_tareas?usuario_id=eq.${encodeURIComponent(userId)}&tarea_externa_id=like.${encodeURIComponent(`caja_${userId}_*`)}&order=creado_el.desc&limit=1&select=creado_el`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  const DOCE_HS = 12 * 60 * 60 * 1000;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].creado_el) {
    const ultimaFecha = new Date(rows[0].creado_el);
    if (Date.now() - ultimaFecha.getTime() < DOCE_HS) {
      return {
        claimed: true,
        proximaDisponible: new Date(ultimaFecha.getTime() + DOCE_HS).toISOString(),
      };
    }
  }
  return { claimed: false, proximaDisponible: null };
}

// Abre una caja sorpresa — RPC directo (sin backend function)
export async function abrirCajaSorpresa(token) {
  const res = await fetch(`${REST}/rpc/abrir_caja_sorpresa`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  return await parse(res);
}

/* ============================================================
   EDGE FUNCTIONS — Llamadas a Supabase Edge Functions (secretos)
   ============================================================ */
const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

export async function callEdgeFunction(name, token, body) {
  // El token va en el body Y en el header: las Edge Functions lo leen del body
  // (body.token) y además aceptan el Bearer del header como respaldo.
  const payload = { ...(body || {}) };
  if (token) payload.token = token;
  const res = await fetch(`${EDGE_BASE}/${name}`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await parse(res);
}

// Llamada genérica a un RPC de Supabase (PostgreSQL function SECURITY DEFINER).
// Devuelve el JSON parseado: un array de filas si el RPC RETURNS TABLE, o un
// objeto/escalar según la firma. Reutilizada por los wrappers del tragamonedas.
export async function callRpc(token, name, args = {}) {
  const res = await fetch(`${REST}/rpc/${name}`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  return await parse(res);
}

/* ---------- ACTUALIZAR CONTRASEÑA (directo a Supabase Auth) ---------- */

export async function supabaseUpdatePassword(accessToken, tokenHash, password) {
  await initSupabaseConfig();
  let token = accessToken;

  // Flujo PKCE: canjear token_hash por access_token
  if (!token && tokenHash) {
    const verifyRes = await fetch(`${AUTH}/verify`, {
      method: "POST",
      headers: { apikey: _key, "Content-Type": "application/json" },
      body: JSON.stringify({ token_hash: tokenHash, type: "recovery" }),
    });
    if (!verifyRes.ok) {
      throw new Error("Token de recuperación inválido o expirado");
    }
    const session = await verifyRes.json();
    token = session?.access_token;
  }

  if (!token) {
    throw new Error("Token de recuperación requerido");
  }

  // Actualizar la contraseña
  const updateRes = await fetch(`${AUTH}/user`, {
    method: "PUT",
    headers: { apikey: _key, "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });

  if (!updateRes.ok) {
    throw new Error("No se pudo actualizar la contraseña");
  }

  // Cerrar la sesión de recuperación
  await fetch(`${AUTH}/logout`, {
    method: "POST",
    headers: { apikey: _key, Authorization: `Bearer ${token}` },
  }).catch(() => {});

  return { success: true };
}

/* ============================================================
   RPC WRAPPERS — Reemplazan las antiguas backend functions
   ============================================================ */

// Verifica si el usuario es admin (reemplaza checkAdminStatus)
export async function rpcIsAdmin(token) {
  try {
    const res = await fetch(`${REST}/rpc/is_admin`, {
      method: "POST",
      headers: baseHeaders(token),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data;
  } catch {
    return false;
  }
}

// Busca el patrocinador por código de referido (reemplaza buscarReferido)
export async function rpcBuscarReferido(token, codigo) {
  const res = await fetch(`${REST}/rpc/buscar_referido`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_codigo: codigo }),
  });
  return await parse(res);
}

// Asigna el referido_por y el pais al usuario autenticado (reemplaza el
// INSERT que chocaba con el perfil ya creado por el trigger de Auth de
// Supabase). RPC SECURITY DEFINER: corre como owner, valida auth.uid() e
// impide re-asignar el sponsor si ya estaba asignado.
export async function rpcRegistrarReferido(token, codigo, pais) {
  const res = await fetch(`${REST}/rpc/registrar_referido_pro`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_codigo: codigo || null, p_pais: pais || null }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "No se pudo registrar el referido");
  }
  return data;
}

// Obtiene ganadores recientes con país del usuario (reemplaza getGanadoresRecientes).
// RPC get_ganadores_recientes(): corre en el servidor (SECURITY DEFINER), consulta
// historial_tareas + perfiles y devuelve cada ganador con su país (pais) para
// mostrar la bandera. No depende de ningún backend externo.
export async function rpcGetGanadores(token) {
  const data = await callRpc(token, "get_ganadores_recientes");
  return { ganadores: Array.isArray(data?.ganadores) ? data.ganadores : [] };
}

// Obtiene referidos del usuario (reemplaza getMisReferidos)
export async function rpcGetMisReferidos(token) {
  const res = await fetch(`${REST}/rpc/get_mis_referidos`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  return await parse(res);
}

// Obtiene el aviso activo (reemplaza getAvisoActivo)
export async function rpcGetAvisoActivo(token) {
  const res = await fetch(`${REST}/rpc/get_aviso_activo`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  return await parse(res);
}

// Obtiene el estado de mantenimiento de TimeWall
export async function rpcGetTimewallMantenimiento(token) {
  const res = await fetch(`${REST}/rpc/get_timewall_mantenimiento`, {
    method: "POST",
    headers: baseHeaders(token),
  });
  return await parse(res);
}

// Establece el estado de mantenimiento de TimeWall (solo admin)
export async function rpcSetTimewallMantenimiento(token, activo, mensaje) {
  const res = await fetch(`${REST}/rpc/set_timewall_mantenimiento`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_activo: activo, p_mensaje: mensaje || "Próximamente" }),
  });
  return await parse(res);
}

// Rechaza un retiro (reemplaza rechazarRetiro)
export async function rpcRechazarRetiro(token, retiroId, comentario) {
  const res = await fetch(`${REST}/rpc/rechazar_retiro`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ p_retiro_id: String(retiroId), p_comentario: comentario || null }),
  });
  const data = await parse(res);
  if (!data?.success) {
    throw new Error(data?.error || "Error al rechazar el retiro");
  }
  return data;
}

// Lee un valor de configuración desde app_config
export async function fetchAppConfig(token, key) {
  const res = await fetch(
    `${REST}/app_config?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
    { headers: baseHeaders(token) }
  );
  const rows = await parse(res);
  return Array.isArray(rows) && rows.length > 0 ? rows[0].value : null;
}

/* ---------- CRUD AVISOS SISTEMA (reemplaza manageAvisoSistema) ---------- */

export async function fetchAvisosSistema(token) {
  const res = await fetch(
    `${REST}/avisos_sistema?order=created_date.desc&select=*`,
    { headers: baseHeaders(token) }
  );
  return await parse(res);
}

export async function createAvisoSistema(token, data) {
  const res = await fetch(`${REST}/avisos_sistema`, {
    method: "POST",
    headers: { ...baseHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      titulo: String(data.titulo).slice(0, 120),
      mensaje: String(data.mensaje).slice(0, 1000),
      tipo: ["info", "success", "warning", "error"].includes(data.tipo) ? data.tipo : "info",
      activo: data.activo !== false,
    }),
  });
  return await parse(res);
}

export async function updateAvisoSistema(token, id, data) {
  const patch = {};
  if (data.titulo !== undefined) patch.titulo = String(data.titulo).slice(0, 120);
  if (data.mensaje !== undefined) patch.mensaje = String(data.mensaje).slice(0, 1000);
  if (data.tipo !== undefined && ["info", "success", "warning", "error"].includes(data.tipo)) patch.tipo = data.tipo;
  if (data.activo !== undefined) patch.activo = !!data.activo;
  patch.updated_date = new Date().toISOString();
  const res = await fetch(`${REST}/avisos_sistema?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...baseHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  return await parse(res);
}

export async function deleteAvisoSistema(token, id) {
  const res = await fetch(`${REST}/avisos_sistema?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: baseHeaders(token),
  });
  return res.ok;
}