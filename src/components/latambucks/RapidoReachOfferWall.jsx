import React, { useState, useEffect, useCallback } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchRapidoReachUrl, RAPIDOREACH_LOGO_URL } from "@/lib/rapidoReachOfferWall";
import ProviderHeader from "@/components/latambucks/ProviderHeader";
import { Loader2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Placement del muro de ofertas de RapidoReach.
//
// La URL firmada (UID = internalUserId-appId-checksum) se pide al backend
// de Supabase en cada montaje; el appKey nunca llega al cliente. Mientras
// la URL no esté disponible se muestra un estado de carga, y si el backend
// falla se muestra un estado de error con reintentar — el placement nunca
// queda roto en la interfaz.
export default function RapidoReachOfferWall() {
  const { token, user } = useLatamBucks();
  const { t } = useI18n();
  const [offerwallUrl, setOfferwallUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUrl = useCallback(async () => {
    if (!token || !user?.id) {
      setLoading(false);
      setError(t("rapidoreach.err.login"));
      return;
    }
    setLoading(true);
    setError("");
    const { url, error: err } = await fetchRapidoReachUrl(token);
    if (err) {
      setOfferwallUrl("");
      setError(err);
    } else {
      setOfferwallUrl(url);
      setError("");
    }
    setLoading(false);
  }, [token, user?.id]);

  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  // Abre el muro en una pestaña nueva. La URL ya está pedida al montar el
  // componente, así el clic abre la ventana de inmediato (sin bloqueo de popups).
  const openWall = () => {
    if (!offerwallUrl) return;
    window.open(offerwallUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <ProviderHeader
        logo={RAPIDOREACH_LOGO_URL}
        title="RapidoReach"
        subtitle={t("rr.sub")}
        action={
          <button
            onClick={loadUrl}
            disabled={loading}
            aria-label={t("rr.reloadAria")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Estado de carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <p className="mt-3 text-sm text-muted-foreground">{t("rr.loading")}</p>
          </div>
        )}

        {/* Estado de error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <div>
              <p className="font-medium text-foreground">{t("rr.error")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={loadUrl}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              <RefreshCw className="h-4 w-4" />
              {t("comun.retry")}
            </button>
          </div>
        )}

        {/* Acceso al muro — se abre en pestaña nueva, sin marco embebido */}
        {!loading && !error && offerwallUrl && (
          <div className="p-4">
            <button
              onClick={openWall}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-400"
            >
              {t("rr.open")} <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
