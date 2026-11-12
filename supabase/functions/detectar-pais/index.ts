// ============================================================
//  Edge Function: detectar-pais
//  Detecta el país REAL del usuario por su IP y lo fija en el
//  perfil (perfiles.pais_detectado). Corre UNA sola vez por
//  usuario: si la columna ya tiene valor, no la vuelve a tocar.
//
//  Deploy:  supabase functions deploy detectar-pais
//  Secretos: SUPABASE_URL, SUPABASE_ANON_KEY y
//            SUPABASE_SERVICE_ROLE_KEY (los inyecta Supabase).
//
//  Self-contained — no importa de _shared/.
//
//  Seguridad: el cliente NO puede escribir pais_detectado (un
//  trigger lo bloquea). Solo esta función, con service_role, lo
//  fija, y el código ISO sale de la IP real de la petición — nunca
//  del navegador. Así nadie puede declararse "AR" para esquivar el
//  requisito de EE. UU. de la ruleta.
//
//  Respuesta: { pais_detectado: "AR" | null, pais, detectado }
// ============================================================

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const REST = `${SUPABASE_URL}/rest/v1`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function serviceHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function verifyUser(token: string): Promise<string | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id || null;
  } catch {
    return null;
  }
}

function esIso(value: string | null | undefined): boolean {
  const v = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1";
}

// Geodetección por encabezados de red (si el edge los expone).
function paisPorEncabezado(req: Request): string | null {
  const nombres = [
    "x-forwarded-for-country",
    "cf-ipcountry",
    "x-vercel-ip-country",
    "x-country-code",
  ];
  for (const h of nombres) {
    const v = req.headers.get(h);
    if (esIso(v)) return String(v).trim().toUpperCase();
  }
  return null;
}

const IP_PRIVADA = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/i,
  /^f[cd]/i,
  /^fe80/i,
];

// IP pública del usuario final (el edge appendea la real al final del XFF).
function ipDelCliente(req: Request): string | null {
  const candidatas = [
    ...(req.headers.get("x-forwarded-for") || "").split(","),
    req.headers.get("x-real-ip") || "",
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  for (const ip of candidatas) {
    if (!IP_PRIVADA.some((re) => re.test(ip))) return ip;
  }
  return null;
}

// Geolocalización por IP: ipwho.is (gratis, HTTPS, sin clave) y
// ipapi.co como respaldo. Si ambas fallan, el país queda sin fijar
// y se reintenta en el próximo inicio de sesión.
async function paisPorIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  try {
    const res = await fetch(`https://ipwho.is/${ip}?fields=success,country_code`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data?.success && esIso(data?.country_code)) {
      return String(data.country_code).trim().toUpperCase();
    }
  } catch {
    /* se prueba el respaldo */
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: AbortSignal.timeout(5000),
    });
    const txt = (await res.text()).trim();
    if (esIso(txt)) return txt.toUpperCase();
  } catch {
    /* sin geolocalización */
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = getBearerToken(req);
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userId = await verifyUser(token);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    // 1. ¿Ya está fijado? Nunca se sobrescribe.
    const filas = await fetch(
      `${REST}/perfiles?id=eq.${encodeURIComponent(userId)}&select=pais,pais_detectado`,
      { headers: serviceHeaders() },
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    const perfil = Array.isArray(filas) ? filas[0] : null;

    if (perfil?.pais_detectado) {
      return json({
        pais_detectado: perfil.pais_detectado,
        pais: perfil.pais ?? null,
        detectado: true,
        ya_definido: true,
      });
    }

    // 2. País por encabezado de red o, si no viene, por IP.
    const code = paisPorEncabezado(req) || (await paisPorIp(ipDelCliente(req)));
    if (!code) {
      return json({
        pais_detectado: null,
        pais: perfil?.pais ?? null,
        detectado: false,
      });
    }

    // 3. Se fija con service_role: el cliente no puede escribir esta columna.
    const patch = await fetch(`${REST}/perfiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: serviceHeaders(),
      body: JSON.stringify({ pais_detectado: code }),
    });
    if (!patch.ok) {
      console.error("detectar-pais: no se pudo guardar", await patch.text());
      return json({ error: "No se pudo guardar el país" }, 500);
    }

    return json({ pais_detectado: code, pais: perfil?.pais ?? null, detectado: true });
  } catch (error) {
    console.error("detectar-pais error:", error?.message, error?.stack);
    return json({ error: "Error interno del servidor" }, 500);
  }
});