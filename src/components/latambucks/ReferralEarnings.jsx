import React from "react";
import { TrendingUp, UserPlus } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { MULTIPLICAR } from "@/lib/i18n/content/multiplicar";

// Aclara el modelo de referidos: el amigo recibe los 500 pts, el invitador
// gana el 10% de por vida sobre las encuestas del referido.
export default function ReferralEarnings() {
  const { lang } = useI18n();
  const c = (MULTIPLICAR[lang] || MULTIPLICAR.es).refs;

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-4">
      <div className="flex items-center gap-2">
        <Icon3D name="referrals" className="h-8 w-8" />
        <p className="font-display text-sm font-bold text-foreground">{c.title}</p>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-start gap-2 rounded-xl bg-background/50 px-3 py-2">
          <UserPlus className="mt-[3px] h-3.5 w-3.5 shrink-0 text-sky-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">{c.friend}</p>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-orange-500/10 px-3 py-2 ring-1 ring-orange-500/20">
          <TrendingUp className="mt-[3px] h-3.5 w-3.5 shrink-0 text-orange-400" />
          <p className="text-[11px] leading-relaxed text-foreground">{c.you}</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {c.examplesTitle}
      </p>
      <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
        {c.examples.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 bg-background/40 px-3 py-2">
            <span className="text-[11px] leading-snug text-muted-foreground">{row.label}</span>
            <span className="shrink-0 text-[11px] font-bold text-emerald-400">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{c.note}</p>
    </div>
  );
}