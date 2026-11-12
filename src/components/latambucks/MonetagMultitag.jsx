import { useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════
// MULTITAG DE MONETAG — pegar acá los datos cuando verifiques el dominio:
//   1) MULTITAG_SCRIPT_URL  → la URL del script (lo que va en src="...")
//   2) MULTITAG_DATA_ZONE   → el data-zone (número de zona)
// Mientras estén vacíos, este componente no hace absolutamente nada.
// ══════════════════════════════════════════════════════════════════════
const MULTITAG_SCRIPT_URL = "https://quge5.com/88/tag.min.js";
const MULTITAG_DATA_ZONE = "308998";
// ══════════════════════════════════════════════════════════════════════

// Misma clave que usa CookieConsentBanner: el tag de publicidad sólo arranca
// si el visitante aceptó, y se retira al salir de la página (o si retira el
// consentimiento) para que nunca se quede cargado en otras pestañas.
const CONSENT_KEY = "lb_cookie_consent";
const CONSENT_EVENT = "lb-cookie-consent";

export default function MonetagMultitag() {
  useEffect(() => {
    if (!MULTITAG_SCRIPT_URL || !MULTITAG_DATA_ZONE) return;

    let injected = null;

    const remove = () => {
      if (injected) {
        injected.remove();
        injected = null;
      }
    };

    const inject = () => {
      if (injected) return;
      const script = document.createElement("script");
      script.src = MULTITAG_SCRIPT_URL;
      script.async = true;
      script.dataset.zone = MULTITAG_DATA_ZONE;
      script.setAttribute("data-cfasync", "false");
      script.setAttribute("data-lb-monetag", "true");
      document.head.appendChild(script);
      injected = script;
    };

    const granted = () => {
      try {
        return localStorage.getItem(CONSENT_KEY) === "accepted";
      } catch (_e) {
        return false;
      }
    };

    const sync = () => (granted() ? inject() : remove());

    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
      remove();
    };
  }, []);

  return null;
}
