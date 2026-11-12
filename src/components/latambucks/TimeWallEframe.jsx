import React, { useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { buildTimeWallUrl } from "@/lib/timeWallOfferWall";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { tareasText } from "@/lib/i18n/content/tareas";
import { ExternalLink, Loader2, Info } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";

// ============================================================
// TimeWallEframe — muro de ofertas de TimeWall embebido (e-frame)
// ------------------------------------------------------------
// Carga el placement de TimeWall dentro de la app con el uid del
// usuario, así las tareas y los puntos son los reales del muro.
// Si el navegador o el WebView bloquea el iframe, queda el botón para
// abrirlo en una pestaña aparte (mismo enlace, mismos puntos).
// ============================================================

export default function TimeWallEframe() {
  const { user } = useLatamBucks();
  const { lang } = useI18n();
  const txt = tareasText(lang).timewall;
  const [loading, setLoading] = useState(true);
  const url = user?.id ? buildTimeWallUrl(user.id) : null;

  const abrir = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-3">
        <Icon3D name="trending" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-foreground">TimeWall</h3>
          <p className="text-xs text-muted-foreground">{txt.sub}</p>
        </div>
        <button
          type="button"
          onClick={abrir}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
        >
          <ExternalLink className="h-3.5 w-3.5" /> {txt.open}
        </button>
      </div>

      {/* E-frame del muro */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <p className="text-xs text-muted-foreground">{txt.loading}</p>
          </div>
        )}

        {url ? (
          <iframe
            src={url}
            title={txt.frameTitle}
            onLoad={() => setLoading(false)}
            allow="clipboard-write"
            className="h-[70vh] min-h-[560px] w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-40 items-center justify-center px-6 text-center text-xs text-muted-foreground">
            {txt.signin}
          </div>
        )}
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <p>{txt.notice}</p>
      </div>
    </div>
  );
}