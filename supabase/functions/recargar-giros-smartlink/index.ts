// ============================================================
//  Edge Function: recargar-giros-smartlink
//  Recarga +3 giros extra cuando el usuario hace clic manual y
//  voluntario en el Smart Link de Monetag.
//
//  - Geodetección por encabezado de red (x-forwarded-for-country)
//  - Frequency capping: máx. 4 recargas/día por usuario (server-side)
//  - Suma atómica de giros vía RPC recargar_giros_smartlink
//
//  Deploy:  supabase functions deploy recargar-giros-smartlink
//  Secrets:
//    SUPABASE_URL            — URL del proyecto
//    SUPABASE_ANON_KEY       — anon key (para validar el JWT del usuario)
//    SUPABASE_SERVICE_ROLE_KEY — service_role (para llamar al RPC)
//
//  Self-contained — no importa de _shared/.
// ============================================================

const SUPABASE_URL = "https://ednvcqdyeakdsssrpgdg.supabase.co";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

// Valida el JWT del usuario contra Supabase Auth.
async function verifyUser(token: string): Promise<string | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${AUTH}/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id || null;
  } catch {
    return null;
  }
}

// Geodetección: lee el país de los encabezados de red.
// Supabase/Deno Deploy puede exponer el país vía distintos headers
// según el edge; se intentan varios y se normaliza a ISO-3166 alpha-2.
function detectCountry(req: Request): string | null {
  const headers = [
    "x-forwarded-for-country", // header pedido por el enunciado
    "cf-ipcountry",            // Cloudflare
    "x-vercel-ip-country",     // Vercel
    "x-country-code",
    "fly-client-ip-country",   // Fly.io (Supabase edge)
  ];
  for (const h of headers) {
    const v = req.headers.get(h);
    if (v && v.trim() && v.trim().length <= 3) return v.trim().toUpperCase();
  }
  return null;
}

// Medianoche Argentina (UTC-3, sin DST) como ISO timestamptz (= 03:00 UTC).
// Replica el cálculo del RPC recargar_giros_smartlink para el modo consulta.
function argentinaMidnightUtcIso(): string {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const y = ar.getUTCFullYear();
  const m = String(ar.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ar.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T03:00:00Z`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token || getBearerToken(req);
    if (!token) return json({ error: "Unauthorized" }, 401);

    // 1. Validar sesión
    const userId = await verifyUser(token);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    // Modo consulta (check): cuenta las recargas reales de hoy del usuario
    // con service_role (bypass RLS) SIN llamar al RPC ni realizar recarga.
    // Permite bloquear el botón multidispositivo al cargar el componente.
    if (body?.check === true) {
      const hoyIso = argentinaMidnightUtcIso();
      const countRes = await fetch(
        `${REST}/recargas_smartlink?usuario_id=eq.${encodeURIComponent(userId)}&creado_el=gte.${hoyIso}&select=id`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
      );
      if (!countRes.ok) return json({ error: "No se pudo consultar el límite" }, 500);
      const rows = await countRes.json();
      const recargasHoy = Array.isArray(rows) ? rows.length : 0;
      return json({ check: true, recargas_hoy: recargasHoy });
    }

    // 2. Geodetección por encabezado de red
    const pais = detectCountry(req);

    // 3. Llamar al RPC recargar_giros_smartlink con el token del usuario.
    //    El RPC usa auth.uid() para resolver el ID: con service_role es NULL
    //    y la función falla (además el GRANT EXECUTE es solo a authenticated/
    //    anon). Con el token del usuario, auth.uid() devuelve el ID real y el
    //    GRANT aplica. El RPC es SECURITY DEFINER → INSERT/UPDATE corren como
    //    owner (bypass RLS), así que la auditoría y la suma de giros funcionan.
    const rpcRes = await fetch(`${REST}/rpc/recargar_giros_smartlink`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_pais: pais }),
    });

    // El RPC devuelve una fila { success, giros_extra, recargas_hoy, error }
    const rows = await rpcRes.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    if (!row?.success) {
      // Límite diario u otro error de negocio → 429
      return json(
        { success: false, error: row?.error || "No se pudo recargar", recargas_hoy: row?.recargas_hoy ?? 0 },
        429
      );
    }

    return json({
      success: true,
      giros_extra: row.giros_extra,
      recargas_hoy: row.recargas_hoy,
      pais_detectado: pais,
    });
  } catch (error) {
    console.error("recargar-giros-smartlink error:", error?.message, error?.stack);
    return json({ error: error?.message || "Error interno del servidor" }, 500);
  }
});