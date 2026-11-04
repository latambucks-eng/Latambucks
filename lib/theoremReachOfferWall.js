import { callEdgeFunction } from "@/lib/supabaseClient";

// Abre la ventana de ofertas (offer wall) de TheoremReach. La ventana se abre
// de forma sincrónica (mismo patrón que CPX Research) para evitar el bloqueo
// de popups, y se redirige una vez que se obtiene la URL firmada desde el backend.
//
// Requiere el token de Supabase del usuario para verificar la identidad
// server-side y calcular el HMAC-SHA1 sin exponer el secreto al cliente.
export async function openTheoremReachOfferWall(user, token) {
  if (!user || !token) return;
  const popup = window.open("about:blank", "_blank");
  try {
    const res = await callEdgeFunction("get-theoremreach-url", token);
    const url = res?.url;
    if (!url) {
      if (popup) popup.close();
      return;
    }
    if (popup) popup.location.href = url;
  } catch {
    if (popup) popup.close();
  }
}