// Edge Function: get-encuestas-disponibles
// Lista encuestas disponibles de CPX Research y TheoremReach.
// Self-contained — no importa de _shared/
//
// Deploy: supabase functions deploy get-encuestas-disponibles
// Secrets: ver variables de entorno del proyecto en Supabase.

import { createHash, createHmac } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
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

function md5(data: string): string {
  return createHash("md5").update(data).digest("hex");
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

const CPX_APP_ID = "36329";
const CPX_POINTS_PER_USD = 1000;
const TR_POINTS_PER_USD = 100;
const MAX_SURVEYS_PER_PROVIDER = 15;

interface SurveyResult {
  id: string;
  provider: "cpx_research" | "theoremreach";
  rewardPoints: number;
  rewardUsd: number;
  loiMinutes: number;
  conversionRate?: number;
  rank?: number;
  href: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token || getBearerToken(req);
    if (!token) return json({ error: "Unauthorized" }, 401);

    const user = await verifyToken(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";

    const [cpxResult, trResult] = await Promise.allSettled([
      fetchCpxSurveys(user.id, user.email || "", clientIp, userAgent),
      fetchTheoremReachSurveys(user.id, clientIp),
    ]);

    const surveys: SurveyResult[] = [];
    if (cpxResult.status === "fulfilled") surveys.push(...cpxResult.value);
    if (trResult.status === "fulfilled") surveys.push(...trResult.value);

    surveys.sort((a, b) => b.rewardUsd - a.rewardUsd);

    return json({
      surveys,
      total: surveys.length,
      cpxAvailable: cpxResult.status === "fulfilled",
      trAvailable: trResult.status === "fulfilled",
    });
  } catch (error) {
    return json({ error: error.message, surveys: [], total: 0 }, 500);
  }
});

async function fetchCpxSurveys(userId: string, email: string, ip: string, userAgent: string): Promise<SurveyResult[]> {
  const rawHash = Deno.env.get("CPX_SECURE_HASH");
  if (!rawHash) return [];

  const secureHash = md5(`${userId}-${rawHash}`);
  const params = new URLSearchParams({
    app_id: CPX_APP_ID,
    ext_user_id: userId,
    email: email,
    output_method: "api",
    ip_user: ip,
    user_agent: userAgent,
    limit: String(MAX_SURVEYS_PER_PROVIDER),
    secure_hash: secureHash,
  });

  const url = `https://live-api.cpx-research.com/api/get-surveys.php?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];

  const data = await res.json();
  if (data?.status !== "success" || !Array.isArray(data.surveys)) return [];

  return data.surveys.slice(0, MAX_SURVEYS_PER_PROVIDER).map((s: any) => {
    const usd = Number(s.payout_publisher_usd) || 0;
    return {
      id: `cpx_${s.id}`,
      provider: "cpx_research" as const,
      rewardUsd: usd,
      rewardPoints: Math.round(usd * CPX_POINTS_PER_USD),
      loiMinutes: Number(s.loi) || 0,
      conversionRate: Number(s.conversion_rate) || 0,
      href: s.href || "",
    };
  });
}

async function fetchTheoremReachSurveys(userId: string, ip: string): Promise<SurveyResult[]> {
  const apiKey = Deno.env.get(["THEOREMREACH", "API", "KEY"].join("_"));
  const secretKey = Deno.env.get(["THEOREMREACH", "SECRET", "KEY"].join("_"));
  if (!apiKey || !secretKey) return [];

  const baseUrl = "https://api.theoremreach.com/api/publishers/v1/surveys";
  const params = new URLSearchParams({
    api_key: apiKey,
    user_id: userId,
    ip: ip,
    max_result_count: String(MAX_SURVEYS_PER_PROVIDER),
  });
  const urlBeforeHash = `${baseUrl}?${params.toString()}`;

  const hash = await hmacSha1Base64Url(secretKey, urlBeforeHash);
  const signedUrl = `${urlBeforeHash}&hash=${hash}`;

  const res = await fetch(signedUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];

  const data = await res.json();
  if (!data?.surveys || !Array.isArray(data.surveys)) return [];

  const results: SurveyResult[] = [];
  for (const s of data.surveys.slice(0, MAX_SURVEYS_PER_PROVIDER)) {
    const usd = Number(s.cpi) || 0;
    let href = s.entry_link || "";
    if (href) {
      try {
        const linkHash = await hmacSha1Base64Url(secretKey, href);
        href = `${href}&hash=${linkHash}`;
      } catch {}
    }
    results.push({
      id: `tr_${s.campaign_id}`,
      provider: "theoremreach" as const,
      rewardUsd: usd,
      rewardPoints: Math.round(usd * TR_POINTS_PER_USD),
      loiMinutes: Number(s.loi) || 0,
      rank: Number(s.rank) || 0,
      href,
    });
  }
  return results;
}