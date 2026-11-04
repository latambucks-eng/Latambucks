// Acredita puntos al saldo_disponible del usuario.
// Usa service_role (bypass RLS). Debe llamarse solo desde backend functions.
//
// Intenta primero el RPC atómico `acreditar_saldo_usuario` (creado por el
// SQL de RLS). Si no existe aún, hace fallback a read-then-write.
// Una vez que se ejecute el SQL, todas las llamadas serán atómicas.

export async function acreditarSaldoUsuario(supabaseUrl, serviceKey, usuarioId, puntos) {
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

  // 1. Intentar RPC atómico (existe después de ejecutar el SQL de RLS)
  const rpcRes = await fetch(`${rest}/rpc/acreditar_saldo_usuario`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_user_id: usuarioId, p_puntos: Number(puntos) }),
  });
  if (rpcRes.ok) return { acreditado: true };

  // 2. Fallback: read-then-write (no atómico, pero funciona sin el RPC)
  const perfilRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(usuarioId)}&select=saldo_disponible&limit=1`,
    { headers }
  );
  if (!perfilRes.ok) return { acreditado: false };
  const perfilRows = await perfilRes.json();
  const saldoActual = Number(perfilRows?.[0]?.saldo_disponible) || 0;

  const updateRes = await fetch(
    `${rest}/perfiles?id=eq.${encodeURIComponent(usuarioId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ saldo_disponible: saldoActual + Number(puntos) }),
    }
  );
  return { acreditado: updateRes.ok };
}