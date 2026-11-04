import { callEdgeFunction } from "@/lib/supabaseClient";

// Enlace directo del muro de ofertas de TimeWall.
//
// URL oficial aprobada por TimeWall (ver integración "Juegos"):
//   https://timewall.io/users/login?oid=23136e7e5bb49f18&uid={UNIQUE_USER_ID}
//
// TimeWall recomienda ENCARECIDAMENTE abrir el muro en un navegador externo
// en lugar de un WebView/iframe: la caja de subida de archivos de la pestaña
// "Tareas" no funciona dentro de un WebView. Por eso se abre en una pestaña
// nueva (window.open), no en un iframe. El postback de TimeWall llega igual
// al backend con el uid del usuario y acredita los puntos sin necesidad de
// mantener la sesión dentro de la app.
//
// El {UNIQUE_USER_ID} es el UUID de Supabase del usuario (user.id), que es el
// mismo identificador que usa el backend (timewall-postback) para acreditar.

export const TIMEWALL_OID = "23136e7e5bb49f18";

// Construye el enlace directo de TimeWall con el uid del usuario.
export function buildTimeWallUrl(userId) {
  return `https://timewall.io/users/login?oid=${TIMEWALL_OID}&uid=${encodeURIComponent(userId)}`;
}

// Abre el muro de ofertas de TimeWall en una pestaña aparte (navegador externo).
// Se llama de forma sincrónica para evitar el bloqueo de popups.
export function openTimeWallOfferWall(user) {
  if (!user?.id) return;
  window.open(buildTimeWallUrl(user.id), "_blank", "noopener,noreferrer");
}

// Obtiene la lista de encuestas disponibles de TimeWall vía Survey API oficial
// (POST https://api.timewall.io/get-surveys). La consulta se hace server-side
// en la Edge Function get-timewall-survey-url con la API Key; el cliente solo
// recibe la lista de encuestas con sus enlaces individuales.
// Devuelve el array de encuestas (vacío si falla).
export async function fetchTimeWallSurveys(user, token) {
  if (!user?.id || !token) return { surveys: [], error: "Sin sesión" };
  try {
    const res = await callEdgeFunction("get-timewall-survey-url", token);
    if (res?.error) return { surveys: [], error: res.error };
    if (!res?.success) return { surveys: [], error: "TimeWall no respondió correctamente" };
    if (!Array.isArray(res.surveys)) return { surveys: [], error: "Respuesta inesperada de TimeWall" };
    return { surveys: res.surveys, error: null };
  } catch (e) {
    return { surveys: [], error: e?.message || "Error de conexión" };
  }
}