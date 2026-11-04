import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function AcercaDe() {
  return (
    <LegalDocument docId="acercaDe">
      <SeoHead
        title="Acerca de LatamBucks"
        description="Conocé LatamBucks: plataforma de microtareas para Latinoamérica donde ganás recompensas viendo anuncios, completando encuestas y tareas locales. Operada desde Argentina."
        path="/acerca-de"
      />
    </LegalDocument>
  );
}