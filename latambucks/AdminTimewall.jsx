import React, { useState, useEffect, useCallback } from "react";
import { rpcGetTimewallMantenimiento, rpcSetTimewallMantenimiento } from "@/lib/supabaseClient";
import { useLatamBucks } from "@/lib/latambucksStore";
import { Clock, Loader2, Power } from "lucide-react";

export default function AdminTimewall() {
  const { token } = useLatamBucks();
  const [enMantenimiento, setEnMantenimiento] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await rpcGetTimewallMantenimiento(token);
      setEnMantenimiento(res?.en_mantenimiento === true);
    } catch {
      setEnMantenimiento(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await rpcSetTimewallMantenimiento(token, !enMantenimiento);
      setEnMantenimiento(res?.en_mantenimiento === true);
    } catch (e) {
      setErr(e.message || "Error al cambiar el estado");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-orange-400" />
        <h3 className="font-display text-sm font-semibold text-foreground">
          Modo "Próximamente" — TimeWall
        </h3>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Activá este modo para mostrar un cartel de "Próximamente" en la pestaña Ofertas
          mientras tu cuenta de TimeWall está en revisión. Cuando la desactives, el muro
          de ofertas volverá a verse normalmente.
        </p>

        {err && (
          <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
        )}

        {loading ? (
          <div className="mt-3 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                enMantenimiento
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-emerald-500/15 text-emerald-400"
              }`}
            >
              {enMantenimiento ? "Próximamente activo" : "TimeWall visible"}
            </span>
            <button
              onClick={toggle}
              disabled={busy}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
                enMantenimiento
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
              }`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {enMantenimiento ? "Activar TimeWall" : "Mostrar Próximamente"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}