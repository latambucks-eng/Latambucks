import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function Normas() {
  return (
    <LegalDocument docId="normas">
      <SeoHead
        title="Normas de la Comunidad"
        description="Normas de la comunidad de LatamBucks: reglas de convivencia, contenido prohibido, prohibición de fraude, VPN, proxies y cuentas múltiples."
        path="/normas"
      />
    </LegalDocument>
  );
}