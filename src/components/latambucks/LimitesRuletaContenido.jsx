import React from "react";

// Cuerpo compartido del panel de límites: tabla de probabilidades, tabla de
// tiers y nota final. Lo usan el modal de la ruleta y la guía interactiva.
export default function LimitesRuletaContenido({ copy }) {
  return (
    <>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-300">
          {copy.probTitle}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {copy.probs.map((p) => (
            <div
              key={p.mult}
              className="rounded-xl border border-border bg-background/60 py-2 text-center"
            >
              <p className="font-mono text-sm font-bold text-foreground">{p.pct}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.mult}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-300">
          {copy.tiersTitle}
        </p>
        <div className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/40">
          {copy.tiers.map((t) => (
            <div key={t.tier} className="p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-bold text-foreground">{t.tier}</p>
                <p className="text-[10px] text-muted-foreground">{t.countries}</p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{t.min}</span>
                <span className="font-semibold text-foreground/80">{t.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/80">{copy.note}</p>
    </>
  );
}
