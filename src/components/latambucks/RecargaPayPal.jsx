import React, { useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { insertRecargaPaypalManual } from "@/lib/supabaseClient";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { getRecargas, PAQUETES_USD, PAYPAL_LINKS } from "@/lib/i18n/content/recargas";

// Recarga manual con PayPal Business: el usuario paga en el enlace NCP del
// paquete y declara su correo / ID de transacción. El admin aprueba y el
// saldo se acredita en perfiles.saldo_promocion.
export default function RecargaPayPal() {
  const { lang } = useI18n();
  const c = getRecargas(lang);
  const { token, user } = useLatamBucks();
  const [paquete, setPaquete] = useState(5);
  const [comprobante, setComprobante] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const enviar = async () => {
    setErr("");
    const info = comprobante.trim();
    if (info.length < 4) {
      setErr(c.formErr);
      return;
    }
    if (!token || !user?.id) {
      setErr(c.err);
      return;
    }
    setBusy(true);
    try {
      await insertRecargaPaypalManual(token, {
        user_id: user.id,
        monto_usd: paquete,
        puntos_promocion: paquete * 1000,
        comprobante_info: info.slice(0, 300),
      });
      setSent(true);
      setComprobante("");
    } catch (e) {
      setErr(e.message || c.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {PAQUETES_USD.map((usd) => (
          <button
            key={usd}
            type="button"
            onClick={() => { setPaquete(usd); setSent(false); setErr(""); }}
            className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition ${
              paquete === usd
                ? "border-sky-500/60 bg-sky-500/10"
                : "border-border bg-background/60 hover:border-sky-500/40"
            }`}
          >
            <span className="font-display text-sm font-bold text-foreground">${usd} USD</span>
            <span className="font-mono text-[10px] text-sky-400">
              {c.pts.replace("{n}", (usd * 1000).toLocaleString("es"))}
            </span>
          </button>
        ))}
      </div>

      <a
        href={PAYPAL_LINKS[paquete]}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 py-2.5 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20"
      >
        <ExternalLink className="h-4 w-4" />
        {c.payBtn.replace("{m}", paquete)}
      </a>

      <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-sky-200/90">
        {c.paypalNotice}
      </div>

      <div className="mt-3 space-y-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
            {c.inputLbl}
          </span>
          <input
            type="text"
            value={comprobante}
            onChange={(e) => { setComprobante(e.target.value); setSent(false); }}
            placeholder={c.inputPh}
            className="lb-input"
            maxLength={300}
          />
        </label>
        <button
          type="button"
          onClick={enviar}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {c.send}
        </button>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">{c.paypalIntro}</p>
      {sent && (
        <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
          {c.sent}
        </p>
      )}
      {err && <p className="mt-2 text-[11px] text-rose-400">{err}</p>}
    </div>
  );
}
