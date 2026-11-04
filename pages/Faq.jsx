import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function Faq() {
  return (
    <LegalDocument docId="faq">
      <SeoHead
        title="Preguntas Frecuentes"
        description="Resolvé tus dudas sobre LatamBucks: cómo ganar puntos, métodos de retiro, referidos, disputas de tareas, campañas de anunciantes y proveedores externos."
        path="/faq"
      />
    </LegalDocument>
  );
}