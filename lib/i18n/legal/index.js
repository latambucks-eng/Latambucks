// Acceso a los documentos legales en el idioma activo.
// Cada documento se define en src/lib/i18n/legal/<id>.js con las tres
// versiones (es, en, pt). Si falta el idioma pedido, se usa el español.
import acercaDe from "./acercaDe";
import cookies from "./cookies";
import derechosAutor from "./derechosAutor";
import faq from "./faq";
import normas from "./normas";
import privacidad from "./privacidad";
import reembolsos from "./reembolsos";
import terminos from "./terminos";

export const LEGAL_DOCS = {
  acercaDe,
  cookies,
  derechosAutor,
  faq,
  normas,
  privacidad,
  reembolsos,
  terminos,
};

export function getLegalDoc(docId, lang) {
  const doc = LEGAL_DOCS[docId];
  if (!doc) return null;
  return doc[lang] || doc.es;
}