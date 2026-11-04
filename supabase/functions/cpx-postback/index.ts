// Edge Function: cpx-postback
// Recibe postbacks de CPX Research y acredita/reversa puntos.
// Siempre responde "OK" (requerido por CPX).
// Self-contained — no importa de _shared/
//
// CÓDIGO LISTO PARA SUPABASE EDGE FUNCTIONS (Deno).
// Deploy: supabase functions deploy cpx-postback
// Secret: CPX_SECURITY_TOKEN
// URL a configurar en CPX: https://ednvcqdyeakdsssrpgdg.supabase.co/functions/v1/cpx-postback
//
// Nota: CPX Research manda el ID de transacción suelto al inicio de la
// query string SIN la etiqueta trans_id=:
//   .../cpx-postback?1001217342736&user_id=eb688586...
// Por eso, si no viene la etiqueta, se toma el primer segmento suelto.

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
    let trans_id: string | null = null;
    let user_id: string | null = null;
    let amount_local: string | null = null;
    let token: string | null = null;
    let status: string | null = null;

    const url = new URL(req.url);
    const q = url.searchParams;

    if (q.get("trans_id") || q.get("user_id") || q.get("amount_local") || q.get("security_token") || q.get("status")) {
      // CPX Research manda el ID de transacción suelto al inicio de la
      // query string, SIN la etiqueta trans_id=:
      //   .../cpx-postback?1001217342736&user_id=eb688586...
      // Si no viene la etiqueta trans_id, tomamos el primer segmento de
      // search solo si no contiene '=' (es un valor suelto, no una etiqueta).
      const firstRaw = (url.search.split("&")[0] || "").replace(/^\?/, "");
      trans_id = q.get("trans_id") || (!firstRaw.includes("=") ? firstRaw : null);
      user_id = q.get("user_id");
      amount_local = q.get("amount_local");
      token = q.get("security_token");
      status = q.get("status");
    } else if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json();
        trans_id = body?.trans_id ?? body?.transaction_id ?? null;
        user_id = body?.user_id ?? null;
        amount_local = body?.amount_local ?? body?.amount ?? null;
        token = body?.security_token ?? body?.token ?? null;
        status = body?.status != null ? String(body.status) : null;
      } else {
        const form = await req.formData();
        trans_id = (form.get("trans_id") as string) || null;
        user_id = (form.get("user_id") as string) || null;
        amount_local = (form.get("amount_local") as string) || null;
        token = (form.get("security_token") as string) || null;
        status = (form.get("status") as string) || null;
      }
    }

    // Validación del token compartido (silenciosa: siempre responde OK).
    const expectedToken = Deno.env.get("CPX_SECURITY_TOKEN");
    if (!expectedToken || !token || !safeEqual(token, expectedToken)) {
      return ok();
    }

    // trans_id y user_id son obligatorios en todo postback (crédito o reverso).
    if (!trans_id || !user_id || !isUuid(user_id)) {
      return ok();
    }

    const headers = serviceHeaders();

    console.log("cpx-postback recibido:", JSON.stringify({ trans_id, user_id, status, amount_local, tiene_token: !!token }));

    // status=2 → reverso/chargeback por fraude detectado (CPX reusa el mismo trans_id).
    // Debe ir ANTES del validado de puntos: el reverso no trae amount_local.
    if (status === "2" || status === "2.0") {
      console.log("cpx-postback: entrando rama REVERSO para trans_id=", trans_id);
      const existingRes = await fetch(
        `${rest}/historial_tareas?tarea_externa_id=eq.${encodeURIComponent(trans_id)}&proveedor=eq.cpx_research&estado=eq.aprobado&select=id,usuario_id,puntos_ganados&limit=1`,
        { headers }
      );
      const existingRows = await existingRes.json();
      console.log("cpx-postback: registro aprobado previo encontrado:", JSON.stringify(existingRows));
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        const record = existingRows[0];
        const puntosOriginales = Math.abs(Number(record.puntos_ganados) || 0);
        console.log("cpx-postback: revirtiendo", puntosOriginales, "puntos del usuario", record.usuario_id);

        const reverseRes = await fetch(
          `${rest}/historial_tareas?id=eq.${encodeURIComponent(record.id)}&estado=eq.aprobado`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ estado: "reversado" }),
          }
        );
        const reverseRows = await reverseRes.json();
        console.log("cpx-postback: resultado PATCH reversado:", JSON.stringify(reverseRows));
        if (!Array.isArray(reverseRows) || reverseRows.length === 0) {
          console.log("cpx-postback: PATCH no afectó filas (ya estaba reversado?)");
          return ok();
        }

        // El descuento del saldo lo hace el trigger de BD
        // trigger_descontar_saldo_reverso al pasar el estado a 'reversado'
        // (solo para proveedor = 'cpx_research'). Llamar ADEMÁS a la RPC
        // descontar_saldo_reverso descontaba los puntos DOS veces:
        // una por el trigger y otra por la RPC.
        console.log("cpx-postback: estado reversado, el trigger de BD descuenta", puntosOriginales, "puntos");

        await fetch(`${rest}/registro_postbacks`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation, resolution=ignore-duplicates" },
          body: JSON.stringify({
            proveedor: "cpx_research",
            transaccion_externa_id: trans_id,
            usuario_id: record.usuario_id,
            puntos_procesados: -puntosOriginales,
          }),
        });
      }
      return ok();
    }

    // status=1 → acreditar puntos. Validar monto positivo.
    console.log("cpx-postback: entrando rama CRÉDITO para trans_id=", trans_id, "amount_local=", amount_local);
    if (amount_local === null) return ok();
    // CPX puede enviar amount_local en USD (ej. 0.10 = 10 centavos). Si el
    // monto es menor a 1, lo tratamos como USD y lo convertimos a puntos con
    // la misma tasa del resto de la app (1000 puntos = 1 USD). Si ya viene en
    // puntos/pesos (valor >= 1) se acredita tal cual.
    const bruto = Number(amount_local);
    if (Number.isNaN(bruto) || bruto <= 0) return ok();
    const tasaStr = Deno.env.get("USD_TO_ARS_RATE");
    const tasa = Number(tasaStr) > 0 ? Number(tasaStr) : 1000;
    const puntos = bruto < 1 ? Number((bruto * tasa).toFixed(2)) : bruto;
    if (puntos <= 0) return ok();

    // Verificar duplicado (evita doble acreditación por reintentos de CPX).
    const dupRes = await fetch(
      `${rest}/historial_tareas?tarea_externa_id=eq.${encodeURIComponent(trans_id)}&proveedor=eq.cpx_research&select=id&limit=1`,
      { headers }
    );
    const dupRows = await dupRes.json();
    console.log("cpx-postback: chequeo duplicado:", JSON.stringify(dupRows));
    if (Array.isArray(dupRows) && dupRows.length > 0) {
      console.log("cpx-postback: DUPLICADO detectado, no se acredita");
      return ok();
    }

    // Auditoría
    await fetch(`${rest}/registro_postbacks`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation, resolution=ignore-duplicates" },
      body: JSON.stringify({
        proveedor: "cpx_research",
        transaccion_externa_id: trans_id,
        usuario_id: user_id,
        puntos_procesados: puntos,
      }),
    });

    // Insertar en historial_tareas
    await fetch(`${rest}/historial_tareas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        usuario_id: user_id,
        tarea_externa_id: trans_id,
        proveedor: "cpx_research",
        puntos_ganados: puntos,
        estado: "aprobado",
      }),
    });

    // Acreditar saldo
    await acreditarSaldo(user_id, puntos);

    // Retener comisión 24h
    const comision10 = Number((puntos * 0.10).toFixed(4));
    await fetch(`${rest}/comisiones_pendientes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        usuario_id: user_id,
        tarea_externa_id: trans_id,
        proveedor: "cpx_research",
        puntos_tarea: puntos,
        comision_estimada: comision10,
      }),
    });

    return ok();
  } catch (error) {
    console.error("cpx-postback error:", error?.message);
    return ok();
  }
});