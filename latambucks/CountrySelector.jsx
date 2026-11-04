import React from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Selector de país visualmente explícito para registro.
// Muestra dos opciones (Latam / Otros países) como tarjetas grandes
// lado a lado, eliminando la ambigüedad del <select> nativo que en
// escritorio puede confundir al usuario.
// PURAMENTE VISUAL — no cambia valores ni lógica de AuthScreen.
export default function CountrySelector({ value, onChange }) {
  const { t } = useI18n();
  const options = [
    {
      value: "Latam",
      label: t("cs.latam"),
      sub: t("cs.latamSub"),
      emoji: "🌎",
      activeCls: "border-violet-400/80 bg-gradient-to-br from-violet-500/30 via-violet-600/15 to-transparent shadow-[0_8px_30px_-8px] shadow-violet-500/50 ring-1 ring-violet-400/30",
      iconActive: "bg-gradient-to-br from-violet-500/50 to-violet-700/30 ring-2 ring-violet-300/50 scale-110",
      glow: "after:bg-violet-500/20",
    },
    {
      value: "Otros",
      label: t("cs.otros"),
      sub: t("cs.otrosSub"),
      emoji: "🌍",
      activeCls: "border-emerald-400/80 bg-gradient-to-br from-emerald-500/30 via-emerald-600/15 to-transparent shadow-[0_8px_30px_-8px] shadow-emerald-500/50 ring-1 ring-emerald-400/30",
      iconActive: "bg-gradient-to-br from-emerald-500/50 to-emerald-700/30 ring-2 ring-emerald-300/50 scale-110",
      glow: "after:bg-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border px-3 py-5 text-center transition-all duration-300 after:absolute after:inset-0 after:opacity-0 after:blur-2xl after:transition-opacity after:duration-300 hover:after:opacity-100 ${
              active
                ? `${opt.activeCls} ${opt.glow}`
                : "border-border bg-gradient-to-br from-card/80 to-background/40 hover:border-border hover:from-card hover:shadow-lg"
            }`}
          >
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-all duration-300 ${active ? opt.iconActive : "bg-background/70 grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-105"}`}>
              <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">{opt.emoji}</span>
            </span>
            <div className="flex flex-col items-center gap-0.5">
              <span className={`text-sm font-bold leading-tight ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                {opt.label}
              </span>
              <span className={`text-[10px] font-medium leading-tight ${active ? "text-foreground/60" : "text-muted-foreground/50"}`}>
                {opt.sub}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}