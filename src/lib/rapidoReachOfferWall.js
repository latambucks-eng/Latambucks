import { callEdgeFunction } from "@/lib/supabaseClient";

// Logo oficial de RapidoReach (icon-512x512 del manifest).
export const RAPIDOREACH_LOGO_URL = "https://www.rapidoreach.com/icon-512x512.png";

// Solicita al backend de Supabase (Edge Function get-rapidoreach-url) la URL
// firmada del muro de ofertas de RapidoReach para el usuario autenticado.
//
// El UID que exige RapidoReach (internalUserId-appId-checksum) se arma y
// firma server-side con el appKey, que NUNCA se expone al cliente. El
// frontend solo recibe la URL final ya armada y la incrusta en el iframe.
//
// Contrato esperado de la Edge Function:
//   Éxito  -> { url: "https://www.rapidoreach.com/ofw/?userId=<UID-encoded>" }
//   Error  -> { error: "mensaje" }
//
// Devuelve { url, error } para que el componente maneje ambos estados.
export async function fetchRapidoReachUrl(token) {
  if (!token) return { url: null, error: "Sin sesión" };
  try {
    const res = await callEdgeFunction("get-rapidoreach-url", token);
    if (res?.error) return { url: null, error: res.error };
    if (!res?.url || typeof res.url !== "string") {
      return { url: null, error: "El backend no devolvió una URL válida" };
    }
    return { url: res.url, error: null };
  } catch (e) {
    return { url: null, error: e?.message || "Error de conexión con el backend" };
  }
}

// Abre el muro de ofertas de RapidoReach en una pestaña nueva.
// Pide la URL firmada al backend y la abre; si falla, devuelve el error
// para que el llamador pueda mostrar feedback al usuario.
export async function openRapidoReachOfferWall(token) {
  const { url, error } = await fetchRapidoReachUrl(token);
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return { url, error: null };
  }
  return { url: null, error };
}