// Lógica única para los callbacks de TheoremReach.
// Cada runtime proporciona sus secretos y SU URL pública de firma.
// Esta copia espeja supabase/sql/theoremreachRewardHandler.ts — mantener
// ambas sincronizadas si se modifica la lógica de validación o acreditación.
import { createHmac, timingSafeEqual } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(message, status = 200) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function handleTheoremreachReward(req, config) {
  try {
    if (req.method !== "GET" && req.method !== "POST") return text("Method not allowed", 405);
    const { secret, serviceKey, callbackUrl } = config;
    const supabaseUrl = (config.supabaseUrl || "").replace(/\/+$/, "");
    if (!secret || !supabaseUrl || !serviceKey) {
      console.error("theoremreach-postback: configuración incompleta");
      return text("Service unavailable", 503);
    }
    const q = new URL(req.url).searchParams;
    for (const key of new Set(q.keys())) {
      if (q.getAll(key).length !== 1) return text("Duplicate parameter", 400);
    }
    const receivedHash = q.get("hash") || "";
    const queryIndex = req.url.indexOf("?");
    const rawQuery = queryIndex >= 0 ? req.url.slice(queryIndex + 1) : "";
    const isTest = q.get("debug") === "true" || q.get("debug") === "1";
    const hashSuffix = rawQuery.match(/&hash=([A-Za-z0-9_-]{27})$/);
    if (!hashSuffix || receivedHash !== hashSuffix[1]) return text("Invalid signature", 403);
    // Conservar orden y encoding originales; nunca reconstruir la query.
    const signingString = `${callbackUrl}?${rawQuery.slice(0, hashSuffix.index)}`;
    const expectedHash = createHmac("sha1", secret).update(signingString).digest("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const encoder = new TextEncoder();
    if (!timingSafeEqual(encoder.encode(receivedHash), encoder.encode(expectedHash))) {
      console.error("theoremreach-postback: firma inválida");
      return text("Invalid signature", 403);
    }
    if (q.has("enc_salt")) {
      console.error("theoremreach-postback: Event Webhook enviado al endpoint de recompensas");
      return text("Event Webhook is not supported by this reward endpoint", 400);
    }
    if (isTest) {
      console.log("theoremreach-postback: prueba autenticada, sin acreditar");
      return text("OK");
    }
    // La transacción de recompensa NO es la sesión del offerwall.
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
    if (!userId && sessionUserId && UUID.test(sessionUserId)) userId = sessionUserId;
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    if (!userId && (txId || externalTxId)) {
      const lookupId = txId || externalTxId;
      try {
        const sessRes = await fetch(`${supabaseUrl}/rest/v1/rpc/resolver_usuario_theoremreach`, {
          method: "POST", headers, body: JSON.stringify({ p_transaction_id: lookupId }),
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData?.success && sessData?.user_id) userId = sessData.user_id;
        }
      } catch { /* El reverso puede resolver el propietario en la RPC. */ }
    }
    if (userId && !UUID.test(userId)) return text("Invalid user ID", 400);
    if (userId && sessionUserId && UUID.test(sessionUserId) && userId.toLowerCase() !== sessionUserId.toLowerCase()) {
      return text("Conflicting user ID", 400);
    }
    if (!userId && !isReversal) return text("Missing user ID", 400);
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/procesar_postback_theoremreach`, {
      method: "POST", headers,
      body: JSON.stringify({ p_tx_id: txId, p_user_id: userId || null, p_puntos: Math.abs(reward), p_reversal: isReversal }),
    });
    if (!res.ok) {
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
}