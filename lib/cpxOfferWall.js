import { callEdgeFunction } from "@/lib/supabaseClient";
import { cpxLogo } from "@/lib/localAssets";

const CPX_APP_ID = 36329;

export const CPX_LOGO_URL = cpxLogo;

// Abre la ventana de ofertas (offer wall) de CPX Research. La ventana se abre
// de forma sincrónica (mismo patrón que el video recompensado) para evitar el
// bloqueo de popups, y se redirige una vez que se obtiene el secure_hash.
//
// Requiere el token de Supabase del usuario para verificar la identidad
// server-side y calcular el secure_hash sin exponer el secreto al cliente.
export async function openCpxOfferWall(user, token) {
  if (!user || !token) return;
  const popup = window.open("about:blank", "_blank");
  try {
    const res = await callEdgeFunction("get-cpx-config", token, { ext_user_id: user.id });
    const hash = res?.secure_hash;
    if (!hash) {
      if (popup) popup.close();
      return;
    }
    const email = encodeURIComponent(user.email || "");
    const url = `https://offers.cpx-research.com/index.php?app_id=${CPX_APP_ID}&ext_user_id=${encodeURIComponent(
      user.id
    )}&secure_hash=${encodeURIComponent(hash)}&username=${email}&email=${email}`;
    if (popup) popup.location.href = url;
  } catch {
    if (popup) popup.close();
  }
}