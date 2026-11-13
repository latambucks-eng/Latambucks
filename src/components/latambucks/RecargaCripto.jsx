import React, { useEffect, useRef, useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { callEdgeFunction } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getRecargas, PAQUETES_USD } from "@/lib/i18n/content/recargas";

// Recarga automática con cripto (NOWPayments). Acredita en saldo_promocion.
export default function RecargaCripto() {
  const { lang } = useI18n();
  const c = getRecargas(lang);
  const { token, user, refreshPerfil } = useLatamBucks();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const avisado = useRef(false);

  // Al volver del checkout de NOWPayments se refresca el saldo.
  useEffect(() => {
    if (avisado.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("recarga") !== "ok") return;
    avisado.current = true;
    toast.success(c.cryptoOk, { toastId: "recarga-ok" });
    if (token && user?.id) refreshPerfil(token, user.id);
  }, [token, user?.id, refreshPerfil, c.cryptoOk]);

  const pagar = async (monto) => {
    setErr("");
    setBusy(monto);
    try {
      const data = await callEdgeFunction("crear-pago-publicidad", token, { monto_usd: monto });
      if (!data?.invoice_url) throw new Error(c.cryptoErr);
      window.location.href = data.invoice_url;
    } catch (e) {
      setErr(e.message || c.cryptoErr);
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {PAQUETES_USD.map((usd) => (
          <button
            key={usd}
            type="button"
            onClick={() => pagar(usd)}
            disabled={busy !== null}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-background/60 px-2 py-2.5 transition hover:border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
          >
            {busy === usd ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            ) : (
              <span className="font-display text-sm font-bold text-foreground">${usd} USD</span>
            )}
            <span className="font-mono text-[10px] text-amber-400">
              {c.pts.replace("{n}", (usd * 1000).toLocaleString("es"))}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">{c.cryptoNote}</p>
      {err && <p className="mt-2 text-[11px] text-rose-400">{err}</p>}
    </div>
  );
}
