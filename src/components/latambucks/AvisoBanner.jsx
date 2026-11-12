import React, { useState, useEffect } from "react";
import { rpcGetAvisoActivo } from "@/lib/supabaseClient";
import { useLatamBucks } from "@/lib/latambucksStore";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";
// Elige la versión del aviso según el idioma del usuario; si falta la
// traducción, se muestra el texto original en español.
const CAMPOS_IDIOMA = {
  en: { titulo: "titulo_en", mensaje: "mensaje_en" },
  pt: { titulo: "titulo_pt", mensaje: "mensaje_pt" },
};

const resolverAviso = (aviso, lang) => {
  if (!aviso) return { titulo: "", mensaje: "" };
  const campo = CAMPOS_IDIOMA[lang];
  return {
    titulo: (campo && aviso[campo.titulo]) || aviso.titulo || "",
    mensaje: (campo && aviso[campo.mensaje]) || aviso.mensaje || "",
  };
};

const TIPOS = {
  info: {
    icon: Info,
    border: "border-sky-500/40",
    bg: "bg-sky-500/10",
    text: "text-sky-300",
    iconColor: "text-sky-400",
  },
  success: {
    icon: CheckCircle,
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    iconColor: "text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-200",
    iconColor: "text-amber-400",
  },
  error: {
    icon: XCircle,
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    iconColor: "text-rose-400",
  },
};

export default function AvisoBanner() {
  const { token } = useLatamBucks();
  const { t, lang } = useI18n();
  const [aviso, setAviso] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) return;
      try {
        const res = await rpcGetAvisoActivo(token);
        if (!active) return;
        const data = res?.aviso;
        if (data) {
          const key = `aviso-dismissed-${data.id}`;
          if (!sessionStorage.getItem(key)) {
            setAviso(data);
            setDismissed(false);
          }
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  const dismiss = () => {
    if (aviso) sessionStorage.setItem(`aviso-dismissed-${aviso.id}`, "1");
    setDismissed(true);
  };

  if (!aviso || dismissed) return null;

  const config = TIPOS[aviso.tipo] || TIPOS.info;
  const Icon = config.icon;
  const { titulo, mensaje } = resolverAviso(aviso, lang);

  return (
    <div className={`mx-3 mt-2 rounded-xl border ${config.border} ${config.bg} p-3`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold ${config.text}`}>{titulo}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
            {mensaje}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-0.5 text-muted-foreground transition hover:text-foreground"
          aria-label={t("shell.cerrarAviso")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
