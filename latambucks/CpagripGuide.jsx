import React, { useState } from "react";
import { Gift, Check, MousePointerClick, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Guía colapsable del flujo de CPAGrip (locker) para la tarjeta
// "Descarga de apps" de la Zona de Dinero Inmediato. Ayuda al usuario a
// entender qué pasa tras abrir el locker y cómo se le acreditan los puntos.
export default function CpagripGuide() {
  const { t } = useI18n();
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60">
      <button
        onClick={() => setAbierta((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-emerald-500/5"
      >
        <Gift className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("cpagrip.guia.title")}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            abierta ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          abierta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ol className="space-y-2.5 px-4 pb-4 pt-1">
            {[
              { icon: MousePointerClick, text: t("cpagrip.guia.paso1") },
              { icon: Check, text: t("cpagrip.guia.paso2") },
              { icon: Gift, text: t("cpagrip.guia.paso3") },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="flex-1">{step.text}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}