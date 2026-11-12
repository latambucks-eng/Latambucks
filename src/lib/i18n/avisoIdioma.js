// Elige la versión del aviso del sistema que corresponde al idioma del usuario.
// Si falta la traducción, se muestra el texto original en español.
const CAMPOS = {
  en: { titulo: "titulo_en", mensaje: "mensaje_en" },
  pt: { titulo: "titulo_pt", mensaje: "mensaje_pt" },
};

export function resolverAviso(aviso, lang) {
  if (!aviso) return { titulo: "", mensaje: "" };
  const campo = CAMPOS[lang];
  return {
    titulo: (campo && aviso[campo.titulo]) || aviso.titulo || "",
    mensaje: (campo && aviso[campo.mensaje]) || aviso.mensaje || "",
  };
}
