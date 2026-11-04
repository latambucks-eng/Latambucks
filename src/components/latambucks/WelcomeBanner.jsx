import React from "react";
import { Bell } from "lucide-react";
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
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30">
          <Bell className="h-4 w-4" />
        </span>
        <p className="text-sm leading-relaxed text-foreground/90">
          {t("home.bienvenida.antes")}{" "}
          <span className="font-semibold text-foreground">LatamBucks</span>
          {t("home.bienvenida.despues")}
        </p>
      </div>
    </div>
  );
}