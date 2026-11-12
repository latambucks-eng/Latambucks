import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { Info, RefreshCw, AlertCircle, Gift } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";
import { fetchCpagripOffers } from "@/lib/cpagripOfferFeed";
import CpagripOfferCard from "@/components/latambucks/CpagripOfferCard";
import { useI18n } from "@/lib/i18n/LanguageContext";
import TimeWallGamesSection from "@/components/latambucks/TimeWallGamesSection";

// ============================================================
// Muro de Ofertas — Feed nativo de CPAGrip dentro de LatamBucks
// ------------------------------------------------------------
// Carga el feed de ofertas de CPAGrip (JSONP, client-side) y las lista como
// tarjetas nativas. El tracking_id (user.id) se envía al feed para que
// CPAGrip lo incruste en cada offerlink y lo devuelva en el postback, que
// acredita los puntos al usuario correcto al completar una oferta.
// ============================================================

// Intervalo de polling para refrescar el saldo (postbacks de CPAGrip).
const POLL_INTERVAL = 5000;

export default function TimeWallTab() {
  const { user, token, perfil, refreshPerfil } = useLatamBucks();
  const { t } = useI18n();
  const intervalRef = useRef(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // trg_actualizar_puntos_perfil: refresca el saldo periódicamente para
  // reflejar los puntos acreditados por postbacks de CPAGrip en tiempo real.
  useEffect(() => {
    if (!token || !user?.id) return;

    refreshPerfil(token, user.id);

    intervalRef.current = setInterval(() => {
      refreshPerfil(token, user.id);
    }, POLL_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden) refreshPerfil(token, user.id);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleFocus = () => refreshPerfil(token, user.id);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token, user?.id, refreshPerfil]);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCpagripOffers(user?.id);
      setOffers(Array.isArray(data?.offers) ? data.offers : []);
    } catch (e) {
      setError(e?.message || t("ofertas.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const saldo = Number(perfil?.saldo_disponible ?? 0);

  const openOffer = (link) => {
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4 px-4 pb-4">
      <header className="pt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.ofertas.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("tabs.ofertas.sub")}
            </p>
          </div>
          <button
            onClick={loadOffers}
            disabled={loading}
            aria-label={t("ofertas.refreshAria")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Balance en vivo — se actualiza solo con los postbacks de CPAGrip */}
      <div className="flex items-center justify-between rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-card p-4">
        <div className="flex items-center gap-3">
          <Icon3D name="coins" className="h-11 w-11 rounded-xl" />
          <div>
            <p className="text-xs text-muted-foreground">{t("ofertas.balance")}</p>
            <p className="font-display text-lg font-bold text-foreground">{saldo.toFixed(2)} pts</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-orange-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
          {t("ofertas.live")}
        </div>
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
        <p>{t("ofertas.note")}</p>
      </div>

      {/* Juegos de TimeWall — grilla visual con puntos reales por juego */}
      <TimeWallGamesSection />

      {/* Encabezado de las ofertas de CPAGrip */}
      <div className="flex items-end justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          <Icon3D name="flame" className="h-9 w-9 rounded-xl" />
          <div>
            <h3 className="font-display text-base font-bold leading-tight text-foreground">
              {t("ofertas.more")}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("ofertas.moreSub")}
            </p>
          </div>
        </div>
        {!loading && !error && offers.length > 0 && (
          <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {t("ofertas.count", { n: offers.length })}
          </span>
        )}
      </div>

      {/* Listado de ofertas */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="aspect-[2.4/1] w-full animate-pulse bg-white/5" />
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/5" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/5" />
                </div>
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <div>
            <p className="font-medium text-foreground">{t("ofertas.loadError")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={loadOffers}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            <RefreshCw className="h-4 w-4" />
            {t("comun.retry")}
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-10 text-center">
          <Gift className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">{t("ofertas.empty")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("ofertas.emptySub")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {offers.map((offer, i) => (
            <CpagripOfferCard
              key={offer.offer_id || i}
              offer={offer}
              featured={i === 0}
              onOpen={openOffer}
            />
          ))}
        </div>
      )}
    </div>
  );
}