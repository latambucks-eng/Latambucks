import React from "react";
import LegalDocument from "@/components/latambucks/LegalDocument";
import SeoHead from "@/components/latambucks/SeoHead";

export default function Cookies() {
  return (
    <LegalDocument docId="cookies">
      <SeoHead
        title="Política de Cookies"
        description="Política de cookies de LatamBucks: qué cookies y almacenamiento local utiliza la plataforma, para qué sirven y cómo el usuario puede gestionarlas o desactivarlas."
        path="/cookies"
      />
    </LegalDocument>
  );
}