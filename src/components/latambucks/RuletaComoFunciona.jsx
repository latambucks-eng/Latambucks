import React from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MULTIPLICAR, fill } from "@/lib/i18n/content/multiplicar";
import { useI18n } from "@/lib/i18n/LanguageContext";
import LimitesRuletaContenido from "@/components/latambucks/LimitesRuletaContenido";

// Ejemplo por tier: cuánto se lleva cada país de referencia si apuesta su
// máximo y sale x1.5. Vive en este mismo archivo para que la copia portable
// no dependa de un archivo extra al compilar.
function EjemploRuleta({ copy, apuesta, tiers }) {
  if (!copy || !tiers?.length) return null;

  const fmt = (n) => n.toLocaleString("es", { maximumFractionDigits: 0 });
  const maxApuesta = Math.round(apuesta || 0);
  const rows = tiers.map((t) => {
    const bet = Number(t.bet) || 0;
    return { ...t, bet, win: bet * 1.5, profit: bet * 0.5, mine: bet > 0 && bet === maxApuesta };
  });

  return (
    <section className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/15 via-orange-500/10 to-transparent p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">
        <Sparkles className="h-3.5 w-3.5" />
        {copy.title}
      </p>
      <p className="mt-2 text-[12px] font-semibold leading-relaxed text-foreground">{copy.lead}</p>

      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.tier}
            className={`rounded-xl border bg-background/70 px-2.5 py-2 ${
              r.mine ? "border-violet-500/60" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  {r.tier}
                  {r.mine && (
                    <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-violet-300">
                      {copy.you}
                    </span>
                  )}
                </p>
                <p className="truncate text-[9.5px] text-muted-foreground">
                  {r.countries} · {copy.betLabel} {fmt(r.bet)} pts
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[12px] font-bold text-foreground">{fmt(r.win)} pts</p>
                <p className="font-mono text-[9.5px] font-semibold text-emerald-400">
                  +{fmt(r.profit)} pts
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">{copy.foot}</p>
      <p className="mt-2 text-[11.5px] font-semibold leading-relaxed text-foreground">{copy.cta}</p>
    </section>
  );
}

// Sección "¿Cómo funciona?": explica las reglas con los valores del país del
// usuario e incluye el ejemplo por tier, las probabilidades y los límites.
export default function RuletaComoFunciona({ copy, minEncuesta, maxApuesta }) {
  const { lang } = useI18n();
  const limits = (MULTIPLICAR[lang] || MULTIPLICAR.es).limits;
  const items = [
    { title: copy.howSpinsTitle, text: fill(copy.howSpins, { min: minEncuesta }) },
    { title: copy.howBalanceTitle, text: copy.howBalance },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mx-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {copy.howTitle}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{copy.howTitle}</DialogTitle>
        </DialogHeader>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.title} className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">{item.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <EjemploRuleta copy={copy.example} apuesta={maxApuesta} tiers={limits?.tiers} />
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <LimitesRuletaContenido copy={limits} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
