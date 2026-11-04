// Shared utilities for Supabase Edge Functions
// Import with: import { ... } from "../_shared/utils.ts"

import { createHash, createHmac } from "node:crypto";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

export const rest = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1`;
export const auth = `${SUPABASE_URL.replace(/\/+$/, "")}/auth/v1`;

export function serviceHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// HMAC-SHA1 base64-url-safe (for TheoremReach)
export async function hmacSha1Base64Url(secret: string, data: string): Promise<string> {
  const hmac = createHmac("sha1", secret).update(data).digest("base64");
  return hmac.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// MD5 hash (for CPX Research)
export function md5(data: string): string {
  return createHash("md5").update(data).digest("hex");
}

// Constant-time string comparison
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify Supabase token and return user { id, email } or null
export async function verifyToken(token: string): Promise<{ id: string; email: string } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${auth}/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.id) return null;
    return { id: user.id, email: user.email || "" };
  } catch {
    return null;
  }
}

// Check if user is admin
export async function isSupabaseAdmin(token: string): Promise<boolean> {
  const user = await verifyToken(token);
  if (!user) return false;
  try {
    const res = await fetch(
      `${rest}/rpc/is_admin`,
      { method: "POST", headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data;
  } catch {
    return false;
  }
}

// Acredit saldo to user
export async function acreditarSaldo(userId: string, puntos: number): Promise<boolean> {
  const res = await fetch(`${rest}/rpc/acreditar_saldo_usuario`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ p_user_id: userId, p_puntos: puntos }),
  });
  return res.ok;
}

// CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export function ok(): Response {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}