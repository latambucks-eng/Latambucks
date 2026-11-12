import React from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { MULTIPLICAR } from "@/lib/i18n/content/multiplicar";
import GuiaRuleta from "@/components/latambucks/GuiaRuleta";
import WelcomeBanner from "@/components/latambucks/WelcomeBanner";
import MultiplierWheel from "@/components/latambucks/MultiplierWheel";
import PayoutInfo from "@/components/latambucks/PayoutInfo";

// Pestaña "Multiplicar puntos" (antes "Ganar"): ruleta + reglas.
export default function MultiplicarTab() {
  const { lang } = useI18n();
  const copy = MULTIPLICAR[lang] || MULTIPLICAR.es;

  return (
    <div className="space-y-4 px-4 pb-4">
      <header className="pt-1">
        <h2 className="font-display text-2xl font-bold text-foreground">{copy.tabs.title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{copy.tabs.sub}</p>
      </header>

      <WelcomeBanner />

      <MultiplierWheel />

      <GuiaRuleta />

      <PayoutInfo />
    </div>
  );
}
      
        
  
