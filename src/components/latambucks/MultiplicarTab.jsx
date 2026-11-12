import React from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { MULTIPLICAR } from "@/lib/i18n/content/multiplicar";
import Icon3D from "@/components/latambucks/Icon3D";
import WelcomeBanner from "@/components/latambucks/WelcomeBanner";
import MultiplierWheel from "@/components/latambucks/MultiplierWheel";
import PayoutInfo from "@/components/latambucks/PayoutInfo";
import MonetagMultitag from "@/components/latambucks/MonetagMultitag";

// Pestaña "Multiplicar puntos" (antes "Ganar"): ruleta + reglas.
export default function MultiplicarTab() {
  const { lang } = useI18n();
  const copy = MULTIPLICAR[lang] || MULTIPLICAR.es;

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Monetag: sólo en la Ruleta Multiplicadora. */}
      <MonetagMultitag />

      <header className="pt-1">
        <h2 className="font-display text-2xl font-bold text-foreground">{copy.tabs.title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{copy.tabs.sub}</p>
      </header>

      <WelcomeBanner />

      <MultiplierWheel />

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-2.5">
          <Icon3D name="sparkle" className="h-9 w-9 rounded-xl" />
          <p className="pt-0.5 font-display text-sm font-bold leading-snug text-foreground">
            {copy.tabs.rulesTitle}
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {copy.tabs.rules.map((rule) => {
            const [lead, ...rest] = rule.split(": ");
            return (
              <li
                key={rule}
                className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"
              >
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                <span>
                  <strong className="font-semibold text-foreground">{lead}:</strong>{" "}
                  {rest.join(": ")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <PayoutInfo />
    </div>
  );
}