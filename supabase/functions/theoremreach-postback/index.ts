// Supabase Edge Function: theoremreach-postback
// Reward Callback con parámetros en la URL y HMAC-SHA1 Base64 URL-safe.
// No es el Event Webhook de bans/reversals (tiene otro formato).
// Aplicar supabase/sql/theoremreach_acreditacion_atomica.sql antes del deploy.
// Deploy: supabase functions deploy theoremreach-postback --no-verify-jwt
import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(message: string, status = 200): Response {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

Deno.serve(async (req: Request) => {
  try {
    // GET oficial; POST sólo si lleva los mismos datos firmados en la URL.
    // Nunca leer datos de recompensa del cuerpo: no quedan autenticados por
    // una firma calculada únicamente sobre la URL.
    if (req.method !== "GET" && req.method !== "POST") return text("Method not allowed", 405);
    const secret = Deno.env.get(["THEOREMREACH", "SECRET", "KEY"].join("_"));
    if (!secret || !SUPABASE_URL || !SERVICE_KEY) {
      console.error("theoremreach-postback: configuración incompleta");
      return text("Service unavailable", 503);
    }
    const url = new URL(req.url);
    const q = url.searchParams;
    // Evita ambigüedad entre lo firmado y lo interpretado.
    for (const key of new Set(q.keys())) {
      if (q.getAll(key).length !== 1) return text("Duplicate parameter", 400);
    }
    const receivedHash = q.get("hash") || "";
    const queryIndex = req.url.indexOf("?");
    const rawQuery = queryIndex >= 0 ? req.url.slice(queryIndex + 1) : "";
    // El debug del Reward Callback también debe estar firmado.
    // El TEST de Event Webhook es un mecanismo distinto, no un debug.
    const isTest = q.get("debug") === "true" || q.get("debug") === "1";

    const hashSuffix = rawQuery.match(/&hash=([A-Za-z0-9_-]{27})$/);
    if (!hashSuffix || receivedHash !== hashSuffix[1]) return text("Invalid signature", 403);

    // Supabase puede entregar una URL interna al runtime. El origen y ruta
    // públicos son fijos; conservar la query original, su orden y encoding.
    // No confiar en Host/X-Forwarded-* ni reconstruir con URLSearchParams.
    const callbackUrl = "https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/theoremreach-postback";
    const signingString = `${callbackUrl}?${rawQuery.slice(0, hashSuffix.index)}`;
    const expectedHash = createHmac("sha1", secret).update(signingString).digest("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const encoder = new TextEncoder();
    if (!timingSafeEqual(encoder.encode(receivedHash), encoder.encode(expectedHash))) {
      // Nunca registrar secretos, firmas esperadas o la URL completa.
      console.error("theoremreach-postback: firma inválida");
      return text("Invalid signature", 403);
    }

    // Event Webhook usa enc_salt y un cuerpo JSON con data.event_type.
    // No confirmar como procesados eventos que esta función no maneja.
    if (q.has("enc_salt")) {
      console.error("theoremreach-postback: Event Webhook enviado al endpoint de recompensas; corregir URL del evento Webhook en TheoremReach");
      return text("Event Webhook is not supported by this reward endpoint", 400);
    }
    // La prueba del Reward Callback puede no enviar identificadores.
    if (isTest) {
      console.log("theoremreach-postback: prueba autenticada, sin acreditar");
      return text("OK");
    }
    // tx_id identifica la RECOMPENSA; external_transaction_id la sesión.
    // No deduplicar por sesión: una sesión puede generar varias recompensas.
    const txId = q.get("tx_id") || q.get("transaction_id");
    const externalTxId = q.get("external_transaction_id");
    if (!txId || txId.length > 512) return text("Missing reward transaction ID", 400);
    const rewardText = q.get("reward");
    const reward = Number(rewardText);
    const isReversal = q.get("reversal") === "true" || q.get("reversal") === "1";
    if (!rewardText || !Number.isFinite(reward) || reward === 0 || (!isReversal && reward < 0)) {
      return text("Invalid reward", 400);
    }
    let userId = q.get("user_id");
    const sessionUserId = externalTxId?.split(".")[0];
    // Sólo el identificador externo del publisher puede llevar nuestro UUID.
    if (!userId && sessionUserId && UUID.test(sessionUserId)) userId = sessionUserId;
    // Fallback: resolver por sesión registrada al abrir el offerwall.
    // TheoremReach no envía user_id por defecto; la sesión guarda la relación
    // transaction_id → user_id.
    if (!userId && (txId || externalTxId)) {
      const lookupId = txId || externalTxId;
      try {
        const sessRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolver_usuario_theoremreach`, {
          method: "POST",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ p_transaction_id: lookupId }),
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData?.success && sessData?.user_id) userId = sessData.user_id;
        }
      } catch { /* ignorar; el reverso no necesita userId explícito */ }
    }
    if (userId && !UUID.test(userId)) return text("Invalid user ID", 400);
    if (userId && sessionUserId && UUID.test(sessionUserId) && userId.toLowerCase() !== sessionUserId.toLowerCase()) {
      return text("Conflicting user ID", 400);
    }
    // En un reverso, la RPC toma el propietario del crédito original.
    if (!userId && !isReversal) return text("Missing user ID", 400);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/procesar_postback_theoremreach`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_tx_id: txId, p_user_id: userId || null, p_puntos: Math.abs(reward), p_reversal: isReversal }),
    });
    if (!res.ok) {
      // Un error no se confirma como procesado; la operación SQL hace rollback.
      console.error("theoremreach-postback: operación atómica fallida", res.status);
      return text("Processing failed", 503);
    }
    const result = await res.json();
    if (result?.success !== true) return text("Processing failed", 503);
    console.log("theoremreach-postback: procesado", JSON.stringify({ txId, estado: result.estado }));
    return text("OK");
  } catch (error) {
    console.error("theoremreach-postback: fallo de procesamiento", error instanceof Error ? error.name : "UnknownError");
    return text("Processing failed", 503);
  }
});