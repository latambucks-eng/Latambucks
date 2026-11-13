import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { getRecargas } from "@/lib/i18n/content/recargas";
import { Bitcoin, Loader2, Wallet } from "lucide-react";
import RecargaCripto from "@/components/latambucks/RecargaCripto";
import RecargaPayPal from "@/components/latambucks/RecargaPayPal";

// Recarga de saldo publicitario: cripto (NOWPayments) o PayPal Business.
// Ambos métodos acreditan en perfiles.saldo_promocion.
export default function RecargaSaldo() {
  const { lang } = useI18n();
  const c = getRecargas(lang);
  const [tab, setTab] = useState("crypto");

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-card p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{c.title}</p>
          <p className="text-[11px] text-muted-foreground">{c.sub}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("crypto")}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
            tab === "crypto"
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
              : "border-border bg-card text-muted-foreground hover:border-amber-500/30"
          }`}
        >
          <Bitcoin className="h-3.5 w-3.5" />
          {c.tabs.crypto}
        </button>
        <button
          type="button"
          onClick={() => setTab("paypal")}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
            tab === "paypal"
              ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
              : "border-border bg-card text-muted-foreground hover:border-sky-500/30"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          {c.tabs.paypal}
        </button>
      </div>

      <div className="mt-3">
        {tab === "crypto" ? <RecargaCripto /> : <RecargaPayPal />}
      </div>
    </div>
  );
}
