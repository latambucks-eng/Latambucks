// Edge Function: cpagrip-postback
// Recibe postbacks PUBLISHER de CPAGrip (AdBlueMedia — offerwall/locker) y acredita puntos al usuario.
// Self-contained — no importa de _shared/
//
// Deploy: supabase functions deploy cpagrip-postback
// Secret:  CPALEAD_POSTBACK_PASSWORD (reutilizado — no hace falta crear uno nuevo)
// URL:     https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/cpagrip-postback
//
// Callback de CPAGrip (publisher) — HTTP GET con query params:
//   ?subid={tracking_id}&lead_id={id}&campaign_id={campaign_id}&payout={payout}&password={password}
//
// Formato configurado en el dashboard de CPAGrip: `subid` lleva el user.id
// (UUID de Supabase) que inyectamos en el src del locker (CpaleadOfferWall.jsx).
// La función resuelve el user_id desde:
//   1) subid                      (formato actual)
//   2) tracking_id con clave      (formato previo)
//   3) primer param sin clave UUID (formato previo)
//
// RESOLUCIÓN DEL USUARIO:
//   subid = el user.id (UUID de Supabase) que inyectamos en el src del
//   locker (CpaleadOfferWall.jsx). CPAGrip lo devuelve intacto en {tracking_id}
//   dentro del parámetro subid.
//
// DEDUP:
//   lead_id (macro {id} de CPAGrip) es el ID único de conversión. Se usa como
//   tarea_externa_id en historial_tareas (unique por proveedor+lead_id) para
//   evitar doble acreditación en reintentos.
//
// SEGURIDAD:
//   Se valida el password compartido (constante-time). Reutilizamos el secret
//   CPALEAD_POSTBACK_PASSWORD ya configurado en Supabase. NO es el password de
//   login de CPAGrip.
//
// RECOMPENSA:
//   {payout} llega en USD (decimal). Se convierte a puntos usando la tasa
//   USD→ARS del environment, redondeando hacia arriba al entero más cercano.
//   Ej: payout=0.50, tasa=1000 → 500 puntos.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const rest = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1`;

function serviceHeaders(): Record<string, string> {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function ok(): Response {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// Resuelve el user_id desde el query string de CPAGrip.
// La URL configura en CPAGrip usa `subid` con el user.id como tracking:
//   ?subid={tracking_id}&lead_id={id}&campaign_id={campaign_id}&payout={payout}&password={password}
// Por robustez, también aceptamos `tracking_id` explícito o un param sin
// clave que sea un UUID (formatos anteriores). El orden es:
//   1) subid (formato actual)
//   2) tracking_id (formato previo con clave)
//   3) primer param sin clave que sea un UUID (formato previo sin clave)
function resolveUserId(q: URLSearchParams): string | null {
  // 1) subid — formato actual configurado en el dashboard de CPAGrip
  const subid = q.get("subid");
  if (subid && isUuid(subid)) return subid;

  // 2) Clave explícita "tracking_id" (formato previo con clave)
  const explicit = q.get("tracking_id");
  if (explicit && isUuid(explicit)) return explicit;

  // 3) Formato previo: primer param sin clave que sea un UUID.
  //    URLSearchParams no expone params sin clave directamente, los parseamos
  //    a mano desde el query string original.
  const raw = q.toString();
  if (raw) {
    for (const piece of raw.split("&")) {
      const eq = piece.indexOf("=");
      // piece sin "=" (o con "=" vacío) → es un parámetro sin clave
      if (eq === -1 || eq === piece.length - 1) {
        const value = eq === -1 ? piece : piece.slice(0, eq);
        try {
          const decoded = decodeURIComponent(value);
          if (isUuid(decoded)) return decoded;
        } catch (_e) {
          // valor mal encodeado → ignorar
        }
      }
    }
  }

  return null;
}

async function acreditarSaldo(userId: string, puntos: number): Promise<boolean> {
  const res = await fetch(`${rest}/rpc/acreditar_saldo_usuario`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ p_user_id: userId, p_puntos: puntos }),
  });
  if (!res.ok) console.error("cpagrip-postback: acreditar_saldo_usuario falló:", res.status, (await res.text()).slice(0, 200));
  return res.ok;
}

Deno.serve(async (req: Request) => {
  try {
    // CPAGrip usa GET. Aceptamos POST también por robustez.
    const url = new URL(req.url);
    const q = url.searchParams;

    let userId: string | null = null;
    let leadId: string | null = null;
    let campaignId: string | null = null;
    let campaignName: string | null = null;
    let payout: string | null = null;
    let password: string | null = null;
    let countryIso: string | null = null;

    if (q.toString()) {
      // resolveUserId resuelve desde subid (formato actual) o tracking_id
      // / param sin clave (formatos previos).
      userId = resolveUserId(q);
      leadId = q.get("lead_id") || q.get("id") || q.get("transaction_id");
      campaignId = q.get("campaign_id") || q.get("offer_id");
      campaignName = q.get("campaign_name") || q.get("offer_name");
      payout = q.get("payout") || q.get("amount");
      password = q.get("password");
      countryIso = q.get("country_iso") || q.get("country_code");
    }

    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        userId = body?.subid != null ? String(body.subid) : (body?.tracking_id != null ? String(body.tracking_id) : userId);
        leadId = body?.lead_id != null ? String(body.lead_id) : (body?.id != null ? String(body.id) : (body?.transaction_id != null ? String(body.transaction_id) : leadId));
        campaignId = body?.campaign_id != null ? String(body.campaign_id) : (body?.offer_id != null ? String(body.offer_id) : campaignId);
        campaignName = body?.campaign_name != null ? String(body.campaign_name) : (body?.offer_name != null ? String(body.offer_name) : campaignName);
        payout = body?.payout != null ? String(body.payout) : (body?.amount != null ? String(body.amount) : payout);
        password = body?.password != null ? String(body.password) : password;
        countryIso = body?.country_iso != null ? String(body.country_iso) : (body?.country_code != null ? String(body.country_code) : countryIso);
      } else {
        const form = await req.formData().catch(() => new FormData());
        userId = (form.get("subid") as string) || (form.get("tracking_id") as string) || userId;
        leadId = (form.get("lead_id") as string) || (form.get("id") as string) || (form.get("transaction_id") as string) || leadId;
        campaignId = (form.get("campaign_id") as string) || (form.get("offer_id") as string) || campaignId;
        campaignName = (form.get("campaign_name") as string) || (form.get("offer_name") as string) || campaignName;
        payout = (form.get("payout") as string) || (form.get("amount") as string) || payout;
        password = (form.get("password") as string) || password;
        countryIso = (form.get("country_iso") as string) || (form.get("country_code") as string) || countryIso;
      }
    }

    if (leadId) leadId = String(leadId);

    // ===== 1. VALIDAR CAMPOS OBLIGATORIOS =====
    if (!leadId) {
      console.error("cpagrip-postback: falta lead_id");
      return ok();
    }
    if (!payout) {
      console.error("cpagrip-postback: falta payout", JSON.stringify({ leadId }));
      return ok();
    }

    // ===== 2. RESOLVER Y VALIDAR USER_ID =====
    if (!userId || !isUuid(userId)) {
      console.error("cpagrip-postback: tracking_id inválido o ausente", JSON.stringify({ userId, leadId }));
      return ok();
    }

    // ===== 3. VALIDAR PASSWORD COMPARTIDO =====
    const expectedPassword = Deno.env.get("CPALEAD_POSTBACK_PASSWORD");
    if (!expectedPassword) {
      console.error("cpagrip-postback: CPALEAD_POSTBACK_PASSWORD no configurado");
      return ok();
    }
    if (!password || !safeEqual(password, expectedPassword)) {
      console.error("cpagrip-postback: password inválido", JSON.stringify({ leadId, tiene_password: !!password }));
      return ok();
    }

    // ===== 4. CONFIGURACIÓN DE SUPABASE =====
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("cpagrip-postback: faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
      return ok();
    }

    // ===== 5. CONVERTIR PAYOUT A PUNTOS =====
    // payout viene en USD. Lo convertimos a puntos usando la tasa USD→ARS del
    // environment. Si no hay tasa, fallback a 1000 pts por USD (valor seguro).
    const payoutUsd = Number(payout);
    if (Number.isNaN(payoutUsd) || payoutUsd <= 0) {
      console.error("cpagrip-postback: payout inválido", payout);
      return ok();
    }
    const tasaStr = Deno.env.get("USD_TO_ARS_RATE");
    const tasa = tasaStr ? Number(tasaStr) : 1000;
    const tasaFinal = Number.isFinite(tasa) && tasa > 0 ? tasa : 1000;
    // Redondeo hacia arriba al entero más cercano (1 payout unit = X puntos).
    const puntos = Math.ceil(payoutUsd * tasaFinal);

    const headers = serviceHeaders();

    // ===== 6. DEDUP POR lead_id (tarea_externa_id único por proveedor) =====
    const dupRes = await fetch(
      `${rest}/historial_tareas?tarea_externa_id=eq.${encodeURIComponent(leadId)}&proveedor=eq.cpagrip&select=id&limit=1`,
      { headers }
    );
    const dupRows = await dupRes.json();
    if (Array.isArray(dupRows) && dupRows.length > 0) {
      console.log("cpagrip-postback: lead_id duplicado, ignorando", leadId);
      return ok();
    }

    // ===== 7. PERSISTENCIA DE AUDITORÍA (registro_postbacks) =====
    // La auditoría es secundaria; no debe impedir el crédito principal, pero
    // ahora sí logueamos el error para que deje de pasar silencioso.
    try {
      const regRes = await fetch(`${rest}/registro_postbacks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          proveedor: "cpagrip",
          transaccion_externa_id: leadId,
          usuario_id: userId,
          puntos_procesados: puntos,
        }),
      });
      if (!regRes.ok) console.error("cpagrip-postback: insert registro_postbacks falló:", regRes.status);
    } catch (_e) {
      // La auditoría es secundaria.
    }

    // ===== 8. INSERT EN historial_tareas =====
    const insRes = await fetch(`${rest}/historial_tareas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        usuario_id: userId,
        tarea_externa_id: leadId,
        proveedor: "cpagrip",
        puntos_ganados: puntos,
        estado: "aprobado",
      }),
    });
    if (!insRes.ok) {
      console.error("cpagrip-postback: insert historial_tareas falló:", insRes.status, (await insRes.text()).slice(0, 200));
      return ok();
    }

    // ===== 9. ACREDITAR SALDO =====
    const credited = await acreditarSaldo(userId, puntos);

    // ===== 10. RETENER COMISIÓN DE REFERIDO 24h =====
    try {
      const comision10 = Number((puntos * 0.10).toFixed(4));
      await fetch(`${rest}/comisiones_pendientes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          usuario_id: userId,
          tarea_externa_id: leadId,
          proveedor: "cpagrip",
          puntos_tarea: puntos,
          comision_estimada: comision10,
        }),
      });
    } catch (_e) {
      // La comisión es secundaria; no debe impedir el crédito principal.
    }

    console.log("cpagrip-postback: acreditado", JSON.stringify({
      userId, leadId, campaignId, campaignName, payoutUsd, puntos, credited, countryIso,
    }));
    return ok();
  } catch (error) {
    console.error("cpagrip-postback error:", error?.message);
    return ok();
  }
});