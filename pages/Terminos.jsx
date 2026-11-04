import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function Terminos() {
  return (
    <LegalDocument docId="terminos">
      <SeoHead
        title="Términos y Condiciones"
        description="Términos y Condiciones de LatamBucks: reglas de uso, sistema de puntos y recompensas, retiros, campañas de anunciantes, disputas, proveedores externos y prohibición de VPN."
        path="/terminos"
      />
    </LegalDocument>
  );
}