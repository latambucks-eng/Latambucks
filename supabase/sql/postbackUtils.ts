// Shared utilities para Edge Functions de postbacks de proveedores
// (TheoremReach, CPX, TimeWall, CPAlead).
//
// Uso:
//   import { serviceHeaders, safeEqual, ok, isUuid, acreditarSaldo } from "../../shared/postbackUtils.ts";
//
// Todas las funciones son self-contained y no importan nada externo.

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const REST = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1`;

export function serviceHeaders(): Record<string, string> {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function ok(): Response {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function acreditarSaldo(userId: string, puntos: number): Promise<boolean> {
  const res = await fetch(`${REST}/rpc/acreditar_saldo_usuario`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ p_user_id: userId, p_puntos: puntos }),
  });
  if (!res.ok) console.error("acreditar_saldo_usuario falló:", res.status, (await res.text()).slice(0, 200));
  return res.ok;
}