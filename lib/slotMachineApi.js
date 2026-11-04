// ============================================================
//  Tragamonedas — API cliente
//  Llama a los RPC y la Edge Function que creamos en el backend.
//  Toda la lógica de premios y giros corre server-side (blindada
//  contra hacks del cliente); acá solo se envían/reciben resultados.
// ============================================================

import { callRpc, callEdgeFunction } from "@/lib/supabaseClient";

// Símbolos visuales del tragamonedas (índice 0-9 = valor de cada rueda).
// El 7 (7️⃣) es el símbolo del Premio Gordo: 7-7-7 dispara el jackpot.
export const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "⭐", "💎", "7️⃣", "💰", "👑"];

// Smart Link de Monetag para recargar giros extra.
export const MONETAG_SMART_LINK = "https://uplcm.com/4/11827535";

// Mapea el país al tier de premios del tragamonedas.
//   Tier 1 (US, CA, GB, DE, FR) → premios (0.5/1.0/1.5 pts)
//   Tier 2 (ES, MX, CL, BR)     → premios medios (0.5/0.8/1.0 pts)
//   Tier 3 (Latam/Resto)        → premios fraccionados (0.1/0.2/0.3 pts)
//
// Recibe el código ISO del país detectado por la Edge Function (pais_detectado,
// ej. "US", "ES", "AR") o, si aún no se detectó, el valor estático del
// registro ("Latam"/"Otros" → Tier 3). Acepta nombres de país y códigos.
export function paisToTier(pais) {
  const p = String(pais || "").trim().toLowerCase();
  // Tier 1 — países de alto eCPM (US, CA, GB, DE, FR)
  if (["estados unidos", "ee. uu.", "eeuu", "usa", "us", "canadá", "canada", "ca", "reino unido", "uk", "gb", "alemania", "de", "francia", "fr"].includes(p)) {
    return "tier1";
  }
  // Tier 2 — intermedios
  if (["españa", "es", "méxico", "mexico", "mx", "chile", "cl", "brasil", "bra", "br"].includes(p)) {
    return "tier2";
  }
  // "Latam", "Otros" y cualquier otro → Tier 3 (Resto del mundo)
  return "tier3";
}

// Procesa un giro del tragamonedas. Devuelve:
//   { rueda1, rueda2, rueda3, puntos_ganados, es_premio_gordo,
//     giros_gratuitos, giros_extra }
export async function procesarGiroTragamonedas(token, paisTier) {
  const rows = await callRpc(token, "procesar_giro_tragamonedas", {
    p_pais_tier: paisTier,
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

// Recarga +3 giros extra vía el Smart Link de Monetag. La Edge Function
// valida la sesión, detecta el país por encabezado de red, aplica el
// frequency capping (máx. 4/día) y suma los giros atómicamente.
// Devuelve: { success, giros_extra, recargas_hoy, pais_detectado }
//   o      { success: false, error, recargas_hoy }
export async function recargarGirosSmartlink(token) {
  return await callEdgeFunction("recargar-giros-smartlink", token);
}

// Consulta remota (multidispositivo) del conteo de recargas realizadas hoy.
// Usa el modo `check` de la Edge Function: cuenta con service_role (bypass
// RLS) SIN llamar al RPC ni realizar recarga. Devuelve { check, recargas_hoy }.
export async function consultarRecargasHoy(token) {
  return await callEdgeFunction("recargar-giros-smartlink", token, { check: true });
}