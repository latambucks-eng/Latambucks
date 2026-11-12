import React from "react";
import { Sparkles } from "lucide-react";

// Ejemplo por tier: cuánto se lleva cada país de referencia si apuesta su
// máximo y sale x1.5. Se resalta el tier del usuario para que sea tentador.
export default function EjemploRuleta({ copy, apuesta, tiers }) {
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
