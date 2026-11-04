// Edge Function: get-theoremreach-url
// Construye la URL firmada del offerwall de TheoremReach.
// Self-contained — no importa de _shared/
//
// Deploy: supabase functions deploy get-theoremreach-url
// Secret: ver variables de entorno del proyecto en Supabase.

import { createHmac } from "node:crypto";

const SUPABASE_URL = "https://ednvcqdyeakdsssrpgdg.supabase.co";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const rest = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1`;
const authEndpoint = `${SUPABASE_URL.replace(/\/+$/, "")}/auth/v1`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

async function hmacSha1Base64Url(secret: string, data: string): Promise<string> {
  const hmac = createHmac("sha1", secret).update(data).digest("base64");
  return hmac.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

const APP_ID = "25593";
// LatamBucks: 1000 puntos = 1 USD. TR devuelve reward ya convertido.
const EXCHANGE_RATE = "1000";
const CURRENCY_PLURAL = "Puntos";
const CURRENCY_SINGULAR = "Punto";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token || getBearerToken(req);
    console.log("get-theoremreach-url: request recibido", JSON.stringify({
      method: req.method,
      tiene_token: !!token,
      tiene_body_token: !!body?.token,
      tiene_bearer: !!getBearerToken(req),
    }));
    if (!token) {
      console.error("get-theoremreach-url: sin token");
      return json({ error: "Unauthorized" }, 401);
    }

    const user = await verifyToken(token);
    console.log("get-theoremreach-url: verificación token", JSON.stringify({
      user_ok: !!user,
      user_id: user?.id || null,
    }));
    if (!user) {
      console.error("get-theoremreach-url: token inválido");
      return json({ error: "Unauthorized" }, 401);
    }

    const apiKey = Deno.env.get(["THEOREMREACH", "API", "KEY"].join("_"));
    const secretKey = Deno.env.get(["THEOREMREACH", "SECRET", "KEY"].join("_"));
    console.log("get-theoremreach-url: secrets", JSON.stringify({
      tiene_api_key: !!apiKey,
      tiene_secret_key: !!secretKey,
    }));
    if (!apiKey || !secretKey) {
      console.error("get-theoremreach-url: configuración incompleta");
      return json({ error: "Configuración incompleta" }, 500);
    }

    const userId = user.id;
    const transactionId = `${userId}.${crypto.randomUUID()}`;

    // Registrar la sesión transaction_id → user_id para que el postback
    // pueda resolver el usuario incluso si TheoremReach no envía user_id
    // en el callback (caso por defecto según la documentación).
    try {
      await fetch(`${rest}/rpc/registrar_sesion_theoremreach`, {
        method: "POST",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_transaction_id: transactionId, p_user_id: userId }),
      });
    } catch (e) {
      console.warn("get-theoremreach-url: no se pudo registrar sesión", e?.message);
    }

    const params = new URLSearchParams({
      external_id: userId,
      user_id: userId,
      transaction_id: transactionId,
      exchange_rate: EXCHANGE_RATE,
      currency_name_plural: CURRENCY_PLURAL,
      currency_name_singular: CURRENCY_SINGULAR,
      api_key: apiKey,
      partner_id: APP_ID,
    });

    const urlBeforeHash = `https://theoremreach.com/respondent_entry/direct?${params.toString()}`;
    const urlSafeHash = await hmacSha1Base64Url(secretKey, urlBeforeHash);
    const finalUrl = `${urlBeforeHash}&hash=${urlSafeHash}`;

    console.log("get-theoremreach-url: URL generada OK", JSON.stringify({
      user_id: userId,
      transaction_id: transactionId,
      url_longitud: finalUrl.length,
    }));

    return json({ url: finalUrl });
  } catch (error) {
    console.error("get-theoremreach-url error:", error?.message, error?.stack);
    return json({ error: error.message }, 500);
  }
});