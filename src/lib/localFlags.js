// Banderas locales (SVG) empaquetadas en el build.
// Sin llamadas a flagcdn ni a ningún servicio externo.
const FLAG_FILES = import.meta.glob("../assets/flags/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const BASE = "../assets/flags/";

// Devuelve la URL local de la bandera para un código ISO de 2 letras.
// Cadena vacía cuando el código no está en el paquete.
export function localFlag(code) {
  if (!code) return "";
  return FLAG_FILES[`${BASE}${String(code).toLowerCase()}.svg`] || "";
}