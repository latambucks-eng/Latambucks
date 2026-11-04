import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function Reembolsos() {
  return (
    <LegalDocument docId="reembolsos">
      <SeoHead
        title="Política de Reembolsos"
        description="Política de reembolsos de LatamBucks para anunciantes: comisión del 30% no reembolsable, reintegro de cupos sobrantes como saldo interno y prohibición de reembolsos externos."
        path="/reembolsos"
      />
    </LegalDocument>
  );
}