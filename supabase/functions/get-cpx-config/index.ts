// Edge Function: get-cpx-config
// Devuelve el secure_hash = MD5(ext_user_id + '-' + CPX_SECURE_HASH)
// Self-contained — no importa de _shared/
//
// Deploy: supabase functions deploy get-cpx-config
// Secret: supabase secrets set CPX_SECURE_HASH=xxx

import { createHash } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const authEndpoint = `${SUPABASE_URL.replace(/\/+$/, "")}/auth/v1`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function md5(data: string): string {
  return createHash("md5").update(data).digest("hex");
}

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function verifyToken(token: string): Promise<{ id: string; email: string } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${authEndpoint}/user`, {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token || getBearerToken(req);
    const extUserId = body?.ext_user_id;
    if (!token) return json({ error: "Unauthorized" }, 401);
    if (!extUserId || typeof extUserId !== "string") {
      return json({ error: "Falta ext_user_id" }, 400);
    }

    const user = await verifyToken(token);
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (user.id !== extUserId) return json({ error: "Forbidden" }, 403);

    const rawHash = Deno.env.get("CPX_SECURE_HASH");
    if (!rawHash) return json({ error: "Configuración no disponible" }, 500);

    const secureHash = md5(`${user.id}-${rawHash}`);
    return json({ secure_hash: secureHash });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});