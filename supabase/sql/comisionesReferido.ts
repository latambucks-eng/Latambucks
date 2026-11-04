// Acredita la comisión del 10% al patrocinador de un usuario referido.
// Usa service_role (bypass RLS). Debe llamarse solo desde backend functions.
//
// Política de comisiones (vigente desde 2026-09-24):
//   - Tareas locales (anunciantes): 10% inmediato (aprobado por el anunciante)
//   - Encuestas (CPX, TheoremReach, TimeWall): 10% retenido 24h vía
//     comisiones_pendientes (pg_cron verifica reversiones antes de pagar)
//   - Videos diarios: sin comisión
//   - Check-in diario: sin comisión
//   - Cajas Sorpresa normales: sin comisión
//   - Cajas Sorpresa premio gordo: incentivo fijo de 50 pts (acreditarIncentivoGordo)

const COMISION_PCT = 0.10;

export async function acreditarComisionReferido(supabaseUrl, serviceKey, usuarioId, puntos) {
  if (!supabaseUrl || !serviceKey || !usuarioId || !puntos) {
    return { acreditado: false };
  }

  const rest = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // 1. Buscar referido_por en el perfil del usuario que completó la tarea
  const perfilRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(usuarioId)}&select=referido_por&limit=1`,
    { headers }
  );
  if (!perfilRes.ok) return { acreditado: false };
  const perfilRows = await perfilRes.json();
  const referidoPor = perfilRows?.[0]?.referido_por;
  if (!referidoPor) return { acreditado: false };

  // 2. Buscar el perfil del patrocinador (solo verificamos existencia; el
  //    incremento del saldo se hace atómicamente vía RPC en el paso 3)
  const sponsorRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(referidoPor)}&select=id&limit=1`,
    { headers }
  );
  if (!sponsorRes.ok) return { acreditado: false };
  const sponsorRows = await sponsorRes.json();
  const sponsor = sponsorRows?.[0];
  if (!sponsor) return { acreditado: false };

  // 3. Incrementar saldo y puntos por referidos atómicamente vía RPC de Supabase.
  //    Fallback: si el RPC no existe, read-then-write (no atómico).
  const comision = Number((puntos * COMISION_PCT).toFixed(4));
  const rpcRes = await fetch(`${rest}/rpc/incrementar_saldo_referido`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_sponsor_id: sponsor.id,
      p_comision: comision,
    }),
  });

  if (rpcRes.ok) return { acreditado: true, comision, sponsorId: sponsor.id };

  // Fallback: read-then-write (no atómico, pero funciona sin el RPC)
  const spRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(sponsor.id)}&select=saldo_disponible,puntos_por_referidos&limit=1`,
    { headers }
  );
  if (!spRes.ok) return { acreditado: false };
  const spRows = await spRes.json();
  const sp = spRows?.[0];
  if (!sp) return { acreditado: false };

  const nuevoSaldo = (Number(sp.saldo_disponible) || 0) + comision;
  const nuevosPuntos = (Number(sp.puntos_por_referidos) || 0) + comision;
  const updateRes = await fetch(`${rest}/perfiles?id=eq.${encodeURIComponent(sponsor.id)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      saldo_disponible: nuevoSaldo,
      puntos_por_referidos: nuevosPuntos,
    }),
  });

  return { acreditado: updateRes.ok, comision, sponsorId: sponsor.id };
}

// Acredita un incentivo fijo (50 pts) al patrocinador cuando su referido
// gana un premio gordo (100+ pts) en Cajas Sorpresa. No es porcentaje.
// Una sola vez por premio gordo (dedup vía ComisionReferido.tarea_id).
export async function acreditarIncentivoGordo(supabaseUrl, serviceKey, usuarioId, incentivo) {
  if (!supabaseUrl || !serviceKey || !usuarioId || !incentivo) {
    return { acreditado: false };
  }

  const rest = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // 1. Buscar referido_por en el perfil del usuario que ganó el gordo
  const perfilRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(usuarioId)}&select=referido_por&limit=1`,
    { headers }
  );
  if (!perfilRes.ok) return { acreditado: false };
  const perfilRows = await perfilRes.json();
  const referidoPor = perfilRows?.[0]?.referido_por;
  if (!referidoPor) return { acreditado: false };

  // 2. Incrementar saldo del patrocinador vía RPC (mismo que comisiones)
  const rpcRes = await fetch(`${rest}/rpc/incrementar_saldo_referido`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_sponsor_id: referidoPor,
      p_comision: incentivo,
    }),
  });

  if (rpcRes.ok) return { acreditado: true, comision: incentivo, sponsorId: referidoPor };

  // Fallback: read-then-write
  const spRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(referidoPor)}&select=saldo_disponible,puntos_por_referidos&limit=1`,
    { headers }
  );
  if (!spRes.ok) return { acreditado: false };
  const spRows = await spRes.json();
  const sp = spRows?.[0];
  if (!sp) return { acreditado: false };

  const nuevoSaldo = (Number(sp.saldo_disponible) || 0) + incentivo;
  const nuevosPuntos = (Number(sp.puntos_por_referidos) || 0) + incentivo;
  const updateRes = await fetch(`${rest}/perfiles?id=eq.${encodeURIComponent(referidoPor)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      saldo_disponible: nuevoSaldo,
      puntos_por_referidos: nuevosPuntos,
    }),
  });

  return { acreditado: updateRes.ok, comision: incentivo, sponsorId: referidoPor };
}