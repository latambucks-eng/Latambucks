import React from "react";
import { Wallet, CalendarDays, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { MULTIPLICAR } from "@/lib/i18n/content/multiplicar";
import Icon3D from "@/components/latambucks/Icon3D";

// Condiciones de cobro, siempre visibles y en una sola línea de lectura:
// mínimo, métodos y calendario de pagos.
export default function PayoutInfo({ compact = false }) {
  const { lang } = useI18n();
  const c = (MULTIPLICAR[lang] || MULTIPLICAR.es).payout;

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4">
      <div className="flex items-center gap-2">
        <Icon3D name="wallet" className="h-9 w-9 rounded-xl" />
        <p className="font-display text-sm font-bold text-foreground">{c.title}</p>
      </div>
      <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed">
        <li className="flex items-start gap-2 text-foreground">
          <CheckCircle2 className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="font-semibold">{c.min}</span>
        </li>
        <li className="flex items-start gap-2 text-muted-foreground">
          <Wallet className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
          <span>{c.methods}</span>
        </li>
        <li className="flex items-start gap-2 text-muted-foreground">
          <CalendarDays className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
          <span>{c.schedule}</span>
        </li>
      </ul>
      {!compact && (
        <p className="mt-2.5 rounded-xl bg-background/50 px-3 py-2 text-[11px] text-muted-foreground">
          {c.note}
        </p>
      )}
    </div>
  );
}