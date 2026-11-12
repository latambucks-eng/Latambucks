import React from "react";
import { HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fill } from "@/lib/i18n/content/multiplicar";

// Sección "¿Cómo funciona?": explica las reglas con los valores del país del
// usuario (nunca menciona tiers ni otros países).
export default function RuletaComoFunciona({ copy, minEncuesta, maxApuesta, topeNeto }) {
  const items = [
    { title: copy.howSpinsTitle, text: fill(copy.howSpins, { min: minEncuesta }) },
    { title: copy.howBalanceTitle, text: copy.howBalance },
    { title: copy.howLimitsTitle, text: fill(copy.howLimits, { max: maxApuesta, cap: topeNeto }) },
    { title: copy.howResultsTitle, text: copy.howResults },
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
      </DialogContent>
    </Dialog>
  );
}
