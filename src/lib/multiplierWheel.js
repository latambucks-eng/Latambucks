import { callRpc } from "@/lib/supabaseClient";

// Toda la lógica de la Ruleta Multiplicadora vive en Supabase (funciones
// SECURITY DEFINER). El frontend solo pide estado y manda la apuesta: nunca
// calcula probabilidades, topes ni saldos.

// Únicos proveedores externos oficiales: los únicos que desbloquean giros y
// suman al saldo apostable (saldo_encuestas).
export const PROVEEDORES_VALIDOS = [
  "timewall",
  "theoremreach",
  "rapidoreach",
  "cpx_research",
  "cpx",
];

// Tiers por país (código ISO de 2 letras en mayúsculas).
const TIER_1 = [
  "US", "CA", "GB", "UK", "AU", "DE", "CH", "NO", "SE", "DK",
  "NL", "NZ", "IE", "AT", "BE", "FI", "FR", "LU", "JP", "SG",
];
const TIER_2 = [
  "ES", "IT", "PT", "KR", "AE", "SA", "IL", "PL", "CZ", "PR",
  "TW", "HK", "QA", "KW",
];

// Espejo de public.fn_ruleta_config en Supabase. Solo aporta los valores por
// defecto mientras llega el estado del servidor: la autoridad es wheel_status.
export function obtenerConfigRuleta(pais) {
  const codigo = String(pais || "").trim().toUpperCase();
  if (TIER_1.includes(codigo)) return { min_encuesta: 500, apuesta_max: 1000, tope_neto: 2000 };
  if (TIER_2.includes(codigo)) return { min_encuesta: 150, apuesta_max: 400, tope_neto: 800 };
  return { min_encuesta: 50, apuesta_max: 200, tope_neto: 400 };
}

// Apuesta máxima real: el menor entre saldo apostable, saldo disponible y el
// máximo del país. Nunca se apuesta el bono ni el saldo de anunciante.
export function apuestaMaximaPermitida(status) {
  const saldoEncuestas = Number(status?.saldo_encuestas || 0);
  const saldoDisponible = Number(status?.saldo_disponible || 0);
  const maxPais = Number(status?.apuesta_max || 0);
  return Math.max(0, Math.floor(Math.min(saldoEncuestas, saldoDisponible, maxPais)));
}

// Si el SQL de la ruleta todavía no se ejecutó en Supabase, PostgREST
// responde "Could not find the function ... in the schema cache". Ese texto
// crudo no le dice nada al usuario: se reemplaza por una instrucción clara.
function errorRuleta(e) {
  const mensaje = String(e?.message || "");
  if (mensaje.toLowerCase().includes("could not find the function")) {
    return new Error(
      "La ruleta todavía no está activada en el servidor. Ejecutá el archivo ruleta_tiers_24h.sql en el SQL Editor de Supabase."
    );
  }
  return e;
}

export async function fetchWheelStatus(token) {
  try {
    const res = await callRpc(token, "wheel_status");
    return Array.isArray(res) ? res[0] : res;
  } catch (e) {
    throw errorRuleta(e);
  }
}

export async function spinMultiplierWheel(token, apuesta) {
  try {
    const res = await callRpc(token, "spin_multiplier_wheel", { p_apuesta: Number(apuesta) });
    return Array.isArray(res) ? res[0] : res;
  } catch (e) {
    throw errorRuleta(e);
  }
}
