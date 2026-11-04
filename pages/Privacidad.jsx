import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function Privacidad() {
  return (
    <LegalDocument docId="privacidad">
      <SeoHead
        title="Política de Privacidad"
        description="Política de privacidad de LatamBucks: datos recopilados, uso de la información, proveedores externos, cookies, derechos del usuario y medidas de seguridad."
        path="/privacidad"
      />
    </LegalDocument>
  );
}