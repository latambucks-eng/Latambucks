import { COUNTRY_FLAGS } from "@/components/latambucks/countryFlags";

// El país detectado llega de la Edge Function como código ISO-3166 alpha-2
// ("US", "AR"), que es lo que usa la ruleta y el resto de las reglas de
// dinero. En el perfil mostramos el nombre en español, así que traducimos
// el código con la lista de banderas que ya existe: cada bandera emoji es
// el código ISO escrito en indicadores regionales (🇦🇷 = "AR").
function isoDesdeBandera(bandera) {
  const puntos = [...String(bandera || "")].map((c) => c.codePointAt(0));
  if (puntos.length !== 2) return null; // 🌎 / 🌍 (Latam, Otros) no son países
  if (puntos.some((p) => p < 0x1f1e6 || p > 0x1f1ff)) return null;
  return puntos.map((p) => String.fromCharCode(p - 0x1f1e6 + 65)).join("");
}

// Devuelve el nombre del país tal como se usa en todo el perfil
// ("Estados Unidos", "Argentina", ...) o null si no está en la lista.
export function paisDesdeIso(iso) {
  const code = String(iso || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  for (const [nombre, bandera] of Object.entries(COUNTRY_FLAGS)) {
    if (isoDesdeBandera(bandera) === code) return nombre;
  }
  return null;
}