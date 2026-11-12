import React from "react";
import { HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MULTIPLICAR, fill } from "@/lib/i18n/content/multiplicar";
import { useI18n } from "@/lib/i18n/LanguageContext";
import LimitesRuletaContenido from "@/components/latambucks/LimitesRuletaContenido";
import EjemploRuleta from "@/components/latambucks/EjemploRuleta";

// Sección "¿Cómo funciona?": explica las reglas con los valores del país del
// usuario e incluye, debajo, la tabla de probabilidades y los límites por tier.
export default function RuletaComoFunciona({ copy, minEncuesta, maxApuesta }) {
  const { lang } = useI18n();
  const limits = (MULTIPLICAR[lang] || MULTIPLICAR.es).limits;
  // Los límites de apuesta y los resultados posibles ya se detallan en la
  // tabla de probabilidades y tiers, así que aquí solo quedan las reglas.
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
