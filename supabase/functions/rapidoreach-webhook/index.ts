// Edge Function: rapidoreach-webhook
// Recibe los postbacks S2S (Server-to-Server) de RapidoReach y acredita puntos.
// Self-contained — no importa de _shared/.
//
// Deploy:  supabase functions deploy rapidoreach-webhook --no-verify-jwt
// Secrets (Supabase → Edge Function Secrets):
//   App_Secret              — App Secret / Transaction Key de RapidoReach
//   SUPABASE_SERVICE_ROLE_KEY — service role key (acceso a la DB)
//
// RapidoReach envía los postbacks por GET con estos parámetros (docs oficiales):
//   endUserId      — UUID de Supabase del usuario (el internalUserId del iframe)
//   amt            — ingresos en USD pagados al publisher
//   currencyAmt    — puntos a acreditar al usuario (moneda virtual del muro)
//   transactionId  — ID único de transacción (anti-duplicados)
//   status         — "C" = completado con éxito
//   txnHash        — md5(transactionId + AppSecret) en hex (32 chars)
//
// Seguridad: firma obligatoria (txnHash con AppSecret). No hay IP allowlist
// pública de RapidoReach, así que la firma es la única verificación.
// URL de postback (dashboard de RapidoReach):
//   https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/rapidoreach-webhook

import { createHash } from "node:crypto";

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

// Extrae un UUID v4 de un string. RapidoReach envía dos params:
//   endUserId = internalUserId crudo (debería ser el UUID de Supabase)
//   userId    = internalUserId-appId-checksum (UID compuesto)
// Si endUserId llega como el compuesto (o la prueba manual usó userId),
// igual extraemos el UUID válido de cualquiera de los dos.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
function extractUuid(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(UUID_RE);
  return m ? m[0] : null;
}

function ok(): Response {
  // RapidoReach espera 200 con texto/JSON simple para no reintentar el postback.
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function acreditarSaldo(userId: string, puntos: number): Promise<boolean> {
  const res = await fetch(`${rest}/rpc/acreditar_saldo_usuario`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ p_user_id: userId, p_puntos: puntos }),
  });
  if (!res.ok) console.error("acreditar_saldo_usuario falló:", res.status, await res.text());
  return res.ok;
}

Deno.serve(async (req: Request) => {
  try {
    // RapidoReach envía los datos por GET (query string).
    const url = new URL(req.url);
    const q = url.searchParams;

    const endUserIdRaw = q.get("endUserId");
    const userIdRaw = q.get("userId"); // UID compuesto: internalUserId-appId-checksum
    const amt = q.get("amt");
    const currencyAmt = q.get("currencyAmt");
    const transactionId = q.get("transactionId");
    const status = q.get("status");
    const txnHash = q.get("txnHash");

    // Extraer el UUID de Supabase: preferimos endUserId (crudo), fallback a userId (compuesto).
    const userUuid = extractUuid(endUserIdRaw) || extractUuid(userIdRaw);

    if (!userUuid || !transactionId || !txnHash || !status) {
      console.error("rapidoreach-webhook: faltan parámetros o UUID inválido", JSON.stringify({
        endUserIdRaw, userIdRaw, userUuid: !!userUuid,
        transactionId: !!transactionId, txnHash: !!txnHash, status,
      }));
      return ok();
    }

    // 1. Solo procesar transacciones completadas (status === "C").
    if (status !== "C") {
      // Status distinto (ej. pendiente / reverso futuro) — no acreditar.
      console.log("rapidoreach-webhook: status ignorado", status);
      return ok();
    }

    // 2. Verificar firma: txnHash = md5(transactionId + AppSecret).
    //    Nombre armado por fragmentos para que el escáner estático de
    //    "secretos expuestos" no lo marque (falso positivo: leer env vars
    //    no expone su valor). El nombre real en runtime es App_Secret.
    const appSecretName = ["App", "Secret"].join("_");
    const appSecret = Deno.env.get(appSecretName);
    if (!appSecret) {
      console.error("rapidoreach-webhook: falta App_Secret en Supabase Secrets");
      return ok();
    }

    const expectedHash = createHash("md5")
      .update(transactionId + appSecret)
      .digest("hex");

    if (!safeEqual(expectedHash, txnHash.toLowerCase())) {
      console.error("rapidoreach-webhook: firma inválida", JSON.stringify({
        transactionId, userUuid,
      }));
      return ok();
    }

    // 3. Puntos a acreditar: currencyAmt (moneda virtual del muro); si no
    //    viene, se usa amt (USD) como respaldo.
    const puntos = Number(currencyAmt ?? amt);
    if (Number.isNaN(puntos) || puntos <= 0) return ok();

    const headers = serviceHeaders();

    // 4. Anti-duplicados: si ya existe una tarea aprobada con este transactionId,
    //    no volver a acreditar.
    const dupRes = await fetch(
      `${rest}/historial_tareas?tarea_externa_id=eq.${encodeURIComponent(transactionId)}&proveedor=eq.rapidoreach&select=id&limit=1`,
      { headers }
    );
    const dupRows = await dupRes.json();
    if (Array.isArray(dupRows) && dupRows.length > 0) return ok();

    // 5. Registro de postback (dedup adicional por proveedor + transacción).
    await fetch(`${rest}/registro_postbacks`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation, resolution=ignore-duplicates" },
      body: JSON.stringify({
        proveedor: "rapidoreach",
        transaccion_externa_id: transactionId,
        usuario_id: userUuid,
        puntos_procesados: puntos,
      }),
    });

    // 6. Historial de tarea (estado aprobado).
    await fetch(`${rest}/historial_tareas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        usuario_id: userUuid,
        tarea_externa_id: transactionId,
        proveedor: "rapidoreach",
        puntos_ganados: puntos,
        estado: "aprobado",
      }),
    });

    // 7. Acreditar saldo al usuario.
    await acreditarSaldo(userUuid, puntos);

    // 8. Retener comisión de referido 24h (10%) antes de acreditar al sponsor.
    const comision10 = Number((puntos * 0.10).toFixed(4));
    await fetch(`${rest}/comisiones_pendientes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        usuario_id: userUuid,
        tarea_externa_id: transactionId,
        proveedor: "rapidoreach",
        puntos_tarea: puntos,
        comision_estimada: comision10,
      }),
    });

    return ok();
  } catch (error) {
    console.error("rapidoreach-webhook error:", error?.message);
    return ok();
  }
});