// Supabase Edge Function: theoremreach-event-webhook
// Event Webhook de TheoremReach (reversals + bans). NO es el Reward Callback.
// POST con JSON { data: { api_key, event_type, user_id, reversed_transactions, ... } }.
// Documentación: https://theoremreach.com/docs/reporting — sección Webhooks.
// HMAC-SHA1 sobre la URL pública hasta &hash=, incluyendo enc_salt.
// El cuerpo NO está firmado según esa sección; api_key y at vienen en data.
// URL pública: https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/theoremreach-event-webhook
// Deploy: supabase functions deploy theoremreach-event-webhook --no-verify-jwt
// Requiere: secretos de TheoremReach + config de Supabase (ver variables de entorno).
// Aplicar antes: supabase/sql/theoremreach_eventos.sql

import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = "https://ednvcqdyeakdsssrpgdg.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(message: string, status = 200): Response {
  // Registrar el motivo exacto sin exponer URL, firmas, claves ni datos personales.
  if (status >= 400) console.warn("theoremreach-event-webhook: solicitud rechazada", JSON.stringify({ status, reason: message }));
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function b64url(s: string): string {
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return text("Method not allowed", 405);
    const secret = Deno.env.get(["THEOREMREACH", "SECRET", "KEY"].join("_"));
    const apiKey = Deno.env.get(["THEOREMREACH", "API", "KEY"].join("_"));
    if (!secret || !apiKey || !SUPABASE_URL || !SERVICE_KEY) {
      console.error("theoremreach-event-webhook: configuración incompleta");
      return text("Service unavailable", 503);
    }

    const url = new URL(req.url);
    const q = url.searchParams;
    for (const key of new Set(q.keys())) {
      if (q.getAll(key).length !== 1) return text("Duplicate parameter", 400);
    }
    const encSalt = q.get("enc_salt") || "";
    const receivedHash = q.get("hash") || "";
    if (!encSalt || encSalt.length > 512) return text("Invalid event ID", 400);
    const queryIndex = req.url.indexOf("?");
    const rawQuery = queryIndex >= 0 ? req.url.slice(queryIndex + 1) : "";
    const hashPart = rawQuery.match(/&hash=([A-Za-z0-9_-]{27})(?:&|$)/);
    if (!hashPart || receivedHash !== hashPart[1]) return text("Invalid signature", 403);
    const callbackUrl = `${SUPABASE_URL}/functions/v1/theoremreach-event-webhook`;
    const signingString = `${callbackUrl}?${rawQuery.slice(0, hashPart.index)}`;
    const expectedHash = b64url(createHmac("sha1", secret).update(signingString).digest("base64"));
    const enc = new TextEncoder();
    if (!timingSafeEqual(enc.encode(receivedHash), enc.encode(expectedHash))) {
      console.error("theoremreach-event-webhook: firma inválida");
      return text("Invalid signature", 403);
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).length > 262144) return text("Payload too large", 413);
    let body: { data?: any } = {};
    try { body = JSON.parse(rawBody); } catch { return text("Invalid JSON", 400); }
    const data = body?.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return text("Invalid data", 400);
    // Confirma el placement; esto NO constituye una firma del cuerpo.
    if (String(data.api_key || "") !== apiKey) return text("Invalid app", 403);
    const eventType = data.event_type;
    // 'test' se reconoce sólo si llega explícitamente: no se presume que el
    // botón TEST use ese formato, pues no lo documenta la página pública.
    if (!["reversal", "ban", "test"].includes(eventType)) return text("Unsupported event type", 400);
    const userId = data.user_id != null ? String(data.user_id) : "";
    if (eventType !== "test" && (!userId || userId.length > 512)) return text("Invalid user ID", 400);
    // TheoremReach puede enviar IDs ajenos al formato UUID de LatamBucks.
    // Registrar el evento autenticado para revisión, SIN ejecutar reversos ni
    // fingir que se procesó. También conserva las pruebas con IDs de ejemplo.
    if (eventType !== "test" && !UUID.test(userId)) {
      const receipt = await fetch(`${SUPABASE_URL}/rest/v1/theoremreach_eventos?on_conflict=event_id`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({
          event_id: encSalt,
          event_type: eventType,
          usuario_id: userId,
          payload: body,
          procesado: false,
        }),
      });
      if (!receipt.ok) {
        console.error("theoremreach-event-webhook: registro pendiente fallido", receipt.status);
        return text("Recording failed", 503);
      }
      console.warn("theoremreach-event-webhook: registrado sin procesar; ID externo no UUID", eventType);
      // 200 OK: TheoremReach marca como fallido cualquier código que no sea 2xx
      // normal (202 incluido). El evento ya quedó registrado para revisión.
      return text("Recorded for review; no balance changes");
    }

    // Validar los importes sólo cuando el evento va a ejecutar cambios de saldo.
    // Los IDs externos se registran arriba para revisión, sin procesar dinero.
    if (eventType === "reversal") {
      const transactions = data.reversed_transactions;
      if (!Array.isArray(transactions) || transactions.length < 1 || transactions.length > 100) return text("Invalid transactions", 400);
      for (const transaction of transactions) {
        const id = transaction?.transaction_id;
        const amount = Number(transaction?.amount_in_currency);
        if (id == null || !String(id).length || String(id).length > 512 || !Number.isFinite(amount) || amount === 0) return text("Invalid reversal", 400);
      }
    }

    // enc_salt identifica el evento; usarlo para deduplicar reenvíos.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/procesar_evento_theoremreach`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_event_id: encSalt,
        p_event_type: eventType,
        p_user_id: data.user_id != null ? String(data.user_id) : null,
        p_payload: rawBody,
      }),
    });
    if (!res.ok) {
      console.error("theoremreach-event-webhook: operación atómica fallida", res.status);
      return text("Processing failed", 503);
    }
    const result = await res.json();
    if (result?.success !== true) return text("Processing failed", 503);
    console.log("theoremreach-event-webhook: procesado", JSON.stringify({ encSalt, eventType, estado: result.estado }));
    return text("OK");
  } catch (error) {
    console.error("theoremreach-event-webhook: fallo", error instanceof Error ? error.name : "UnknownError");
    return text("Processing failed", 503);
  }
});