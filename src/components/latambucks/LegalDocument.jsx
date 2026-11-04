import React from "react";
import LegalLayout, { Section, QA } from "@/components/latambucks/LegalLayout";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { getLegalDoc } from "@/lib/i18n/legal";

// Convierte **texto** en negrita y [texto](url) en enlaces.
function withBold(text, keyPrefix) {
  const parts = String(text).split(/(\*\*.+?\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      return (
        <strong key={key} className="text-foreground">
          {bold[1]}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target={link[2].startsWith("mailto:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="text-orange-400 hover:text-orange-300"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

// Renderiza un documento legal completo en el idioma activo del sitio.
// El contenido vive en src/lib/i18n/legal/<docId>.js (es · en · pt).
// Cuerpo de una sección: párrafos, viñetas y cierre.
function Body({ item }) {
  return (
    <>
      {(item.paragraphs || []).map((text, i) => (
        <p key={`p-${i}`}>{withBold(text, `p-${i}`)}</p>
      ))}
      {(item.bullets || []).map((text, i) => (
        <p key={`b-${i}`}>• {withBold(text, `b-${i}`)}</p>
      ))}
      {(item.closing || []).map((text, i) => (
        <p key={`c-${i}`}>{withBold(text, `c-${i}`)}</p>
      ))}
    </>
  );
}

export default function LegalDocument({ docId, children }) {
  const { lang } = useI18n();
  const doc = getLegalDoc(docId, lang);

  if (!doc) {
    return (
      <LegalLayout title="LatamBucks">
        {children}
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title={doc.title} subtitle={doc.subtitle}>
      {children}
      {doc.sections.map((section, index) =>
        doc.qa ? (
          <QA key={`${docId}-${index}`} q={section.q}>
            <Body item={section} />
          </QA>
        ) : (
          <Section key={`${docId}-${index}`} title={section.title}>
            <Body item={section} />
          </Section>
        )
      )}
      {doc.updated && (
        <p className="pt-2 text-center text-[11px] text-muted-foreground/60">{doc.updated}</p>
      )}
    </LegalLayout>
  );
}