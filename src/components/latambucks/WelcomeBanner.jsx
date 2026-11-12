import React from "react";
import Icon3D from "@/components/latambucks/Icon3D";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Banner de bienvenida que corona la sección Ganar.
// Estilo: borde violeta profundo con degradado sutil sobre fondo oscuro,
// ícono de campana en lavanda y texto en blanco roto (según diseño de ref.).
export default function WelcomeBanner() {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-700/50 bg-gradient-to-r from-violet-900/40 via-violet-800/10 to-violet-900/25 p-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-violet-500/15 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <Icon3D name="bell" className="mt-0.5 h-8 w-8" />
        <p className="text-sm leading-relaxed text-foreground/90">
          {t("home.bienvenida.antes")}{" "}
          <span className="font-semibold text-foreground">LatamBucks</span>
          {t("home.bienvenida.despues")}
        </p>
      </div>
    </div>
  );
}