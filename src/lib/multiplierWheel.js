import { callRpc } from "@/lib/supabaseClient";

// Toda la lógica de la Ruleta Multiplicadora vive en Supabase (funciones
// SECURITY DEFINER). El frontend solo pide estado y manda la apuesta: nunca
// calcula probabilidades, topes ni saldos.

// Si el SQL de la ruleta todavía no se ejecutó en Supabase, PostgREST
// responde "Could not find the function ... in the schema cache". Ese texto
// crudo no le dice nada al usuario: se reemplaza por una instrucción clara.
function errorRuleta(e) {
  const mensaje = String(e?.message || "");
  if (mensaje.toLowerCase().includes("could not find the function")) {
    return new Error(
      "La ruleta todavía no está activada en el servidor. Ejecutá el archivo ruleta_multiplicadora.sql en el SQL Editor de Supabase."
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