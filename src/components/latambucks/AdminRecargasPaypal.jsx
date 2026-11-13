import React, { useCallback, useEffect, useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import {
  fetchRecargasPaypalPendientes,
  rpcAprobarRecargaAdmin,
  rpcRechazarRecargaAdmin,
} from "@/lib/supabaseClient";
import { getRecargas } from "@/lib/i18n/content/recargas";
import { Check, Loader2, Inbox, Wallet, X } from "lucide-react";
import toast from "react-hot-toast";

// Admin: aprobación en 1 clic de las recargas pagadas por PayPal.
export default function AdminRecargasPaypal() {
  const { lang } = useI18n();
  const c = getRecargas(lang);
  const a = c.admin;
  const { token } = useLatamBucks();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecargasPaypalPendientes(token);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const ejecutar = async (row, aprobar) => {
    setErr("");
    setBusy(row.id);
    try {
      const res = aprobar
        ? await rpcAprobarRecargaAdmin(token, row.id)
        : await rpcRechazarRecargaAdmin(token, row.id);
      if (!res?.success) throw new Error(res?.error || a.err);
      setRows((r) => r.filter((x) => x.id !== row.id));
      toast.success(aprobar ? a.approved : a.rejected);
    } catch (e) {
      setErr(e.message || a.err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-sky-400" />
        <h3 className="font-display text-sm font-semibold text-foreground">{a.title}</h3>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-8 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{a.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const email = r.perfiles?.email ?? "—";
            const monto = Number(r.monto_usd ?? 0);
            const puntos = Number(r.puntos_promocion ?? 0);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-foreground">{email}</p>
                  <span className="shrink-0 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-400">
                    ${monto.toLocaleString("es")} USD
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    {a.points}:{" "}
                    <span className="font-mono text-foreground">
                      {puntos.toLocaleString("es")}
                    </span>
                  </p>
                  <p className="leading-relaxed">
                    {a.comprobante}:{" "}
                    <span className="break-words text-foreground">{r.comprobante_info ?? "—"}</span>
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => ejecutar(r, true)}
                    disabled={busy !== null}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    {busy === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {a.approve}
                  </button>
                  <button
                    type="button"
                    onClick={() => ejecutar(r, false)}
                    disabled={busy !== null}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    {a.reject}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
