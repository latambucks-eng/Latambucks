import React from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import LangFlag from "@/components/latambucks/LangFlag";

// Selector de idioma con banderas: España (español), Inglaterra (inglés) y
// Brasil (portugués). Cambia el idioma del sitio al instante y recuerda la
// elección en el dispositivo. Es accesible por teclado y anuncia el idioma
// activo con aria-pressed.
export default function LanguagePicker({ className = "" }) {
  const { lang, setLang, t, locales } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("nav.idioma")}
      className={`flex items-center gap-1 rounded-xl border border-border bg-card/60 p-1 ${className}`}
    >
      {locales.map((locale) => {
        const active = locale.id === lang;
        return (
          <button
            key={locale.id}
            type="button"
            onClick={() => setLang(locale.id)}
            aria-pressed={active}
            aria-label={locale.label}
            title={locale.label}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/40"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            <LangFlag code={locale.id} className="h-3.5 w-5 rounded-[2px] ring-1 ring-white/25" />
            <span>{locale.short}</span>
          </button>
        );
      })}
    </div>
  );
}