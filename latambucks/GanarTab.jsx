import React from "react";
import HomeTab from "@/components/latambucks/HomeTab";
import EarnTab from "@/components/latambucks/EarnTab";
import WelcomeBanner from "@/components/latambucks/WelcomeBanner";

// Ganar = banner de bienvenida + flujo de Inicio (dashboard) + Zona de
// Dinero Inmediato. El flujo de Inicio se mudó acá para que el menú Ganar
// sea el panel principal de acumulación, manteniendo intactos los flujos.
export default function GanarTab() {
  return (
    <div className="space-y-6">
      <div className="px-4 pt-1">
        <WelcomeBanner />
      </div>
      <HomeTab />
      <EarnTab />
    </div>
  );
}