import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

const STORAGE_KEY = "lb_cookie_consent";

// Banner de consentimiento de cookies simple y discreto. Aparece solo una vez
// (la elección del usuario se guarda en localStorage) y no interrumpe el uso de
// la app: se muestra como una barra delgada al pie, con un botón "Aceptar" y un
// enlace a la Política de Cookies. No usa cookies de terceros más allá de la
// medición de conversiones descrita en la política.
export default function CookieConsentBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      setVisible(true);
    } catch (_e) {
      // Sin acceso a localStorage (modo privado estricto): no molestar.
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch (_e) {
      // Si falla, simplemente ocultamos el banner por esta sesión.
    }
    setVisible(false);
  };

  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-[480px] px-4 md:bottom-24 md:max-w-2xl">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_8px_40px_-8px] shadow-black/60 backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
          <Cookie className="h-5 w-5" />
        </div>
        <p className="flex-1 text-[11px] leading-relaxed text-muted-foreground">
          {t("cookie.body1")}
          <Link to="/cookies" className="mx-1 font-medium text-orange-400 hover:text-orange-300">
            {t("cookie.link")}
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={accept}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-orange-950 transition hover:bg-orange-400"
          >
            {t("cookie.accept")}
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
            aria-label={t("cookie.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}