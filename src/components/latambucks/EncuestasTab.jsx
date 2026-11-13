import React, { useState, useEffect, useCallback } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { openCpxOfferWall, CPX_LOGO_URL } from "@/lib/cpxOfferWall";
import { openTheoremReachOfferWall } from "@/lib/theoremReachOfferWall";
import { openRapidoReachOfferWall, RAPIDOREACH_LOGO_URL } from "@/lib/rapidoReachOfferWall";
import { fetchTimeWallSurveys } from "@/lib/timeWallOfferWall";
import TimeWallSurveysSection from "@/components/latambucks/TimeWallSurveysSection";
import RapidoReachOfferWall from "@/components/latambucks/RapidoReachOfferWall";
import SurveyCard from "@/components/latambucks/SurveyCard";
import SurveyFilterBar from "@/components/latambucks/SurveyFilterBar";
import ProviderHeader from "@/components/latambucks/ProviderHeader";
import { Image } from "@/components/ui/image";
import { callEdgeFunction } from "@/lib/supabaseClient";
import { ChevronDown, Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";

// Logo de TheoremReach recortado a su contenido real (el original era un PNG
// cuadrado con mucho margen en blanco, por eso se veía más chico y borroso).
import THEOREMREACH_LOGO_URL from "@/assets/theoremreach-logo.png";


const TIMEWALL_LOGO_URL = "https://images.timebucks.com/TimewallImages/icon.png";

// RapidoReach no expone una API de encuestas individuales: es un muro embebido
// (iframe). En la pestaña Encuestas se muestra como sección dedicada con su
// iframe, igual que TimeWall tiene su sección propia.

// ===== TimeWall: dos placements independientes que coexisten =====
// OID del muro tradicional de ofertas completo (iFrame/Tareas) — el histórico.
const TIMEWALL_OFFERWALL_OID = "23136e7e5bb49f18";
// OID del placement "Survey API / Routers" — encuestas flash (Routers).
const TIMEWALL_ROUTERS_OID = "75b45410b3dc9d2b";

// Muro tradicional: usa el parámetro userID para que coexistir con el backend
// timewall-postback sin pisar el router (mismo idioma de variables).
function buildTimeWallOfferwallUrl(userId) {
  return `https://timewall.io/users/login?oid=${TIMEWALL_OFFERWALL_OID}&userID=${encodeURIComponent(userId)}`;
}

// Router (encuestas flash): inyecta el UUID en userID para que el postback lo
// devuelva intacto como {userID}, el parámetro estricto de timewall-postback.
function buildTimeWallRoutersUrl(userId) {
  return `https://timewall.io/users/login?oid=${TIMEWALL_ROUTERS_OID}&userID=${encodeURIComponent(userId)}`;
}

function openTimeWallOfferwall(user) {
  if (!user?.id) return;
  window.open(buildTimeWallOfferwallUrl(user.id), "_blank", "noopener,noreferrer");
}

export default function EncuestasTab() {
  const { t } = useI18n();
  const { user, token } = useLatamBucks();
  const [showStats, setShowStats] = useState(true);
  const [providerFilter, setProviderFilter] = useState("all");
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerStatus, setProviderStatus] = useState({ cpx: false, tr: false });
  const [twSurveys, setTwSurveys] = useState([]);
  const [twLoading, setTwLoading] = useState(false);
  const [twError, setTwError] = useState(null);

  const fetchSurveys = useCallback(async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await callEdgeFunction("get-encuestas-disponibles", token);
      if (Array.isArray(data?.surveys)) {
        setSurveys(data.surveys);
        setProviderStatus({
          cpx: data.cpxAvailable || false,
          tr: data.trAvailable || false,
        });
        // No mostrar errores de proveedores individuales como cartel rojo.
        // Si no hay encuestas, se muestra el estado vacío amigable.
      } else {
        // 401 (token expirado) u otros errores: mostrar estado vacío amigable
        // en lugar del cartel rojo de error, per preferencia del usuario.
        setSurveys([]);
        setProviderStatus({ cpx: false, tr: false });
        setError("");
      }
    } catch (e) {
      // Token expirado (401 Unauthorized) u otro error de red: mostrar estado
      // vacío amigable en lugar del cartel rojo de error.
      setSurveys([]);
      setProviderStatus({ cpx: false, tr: false });
      setError("");
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Encuestas de TimeWall (Survey API oficial) — cargadas en paralelo y
  // mostradas en una sección dedicada, con sus puntos sumados al total en vivo.
  useEffect(() => {
    if (!token || !user?.id) return;
    setTwLoading(true);
    fetchTimeWallSurveys(user, token)
      .then((res) => {
        setTwSurveys(res?.surveys || []);
        setTwError(res?.error || null);
      })
      .catch(() => { setTwSurveys([]); setTwError(t("encuestas.err.conn")); })
      .finally(() => setTwLoading(false));
  }, [token, user?.id]);

  // Router global de TimeWall (Survey API / Routers) — siempre visible en el
  // feed, inyectado fijo junto a las encuestas individuales de la API.
  const timeWallRouterCard = {
    id: "timewall-router-featured",
    provider: "timewall",
    rewardPoints: 500, // Puntos estimados configurados en la tasa
    estimatedTime: 5,  // Minutos estimados base
    title: t("ec.twExpress"),
    href: buildTimeWallRoutersUrl(user?.id), // Usa la URL del Router programada
  };

  const filtered =
    providerFilter === "all"
      ? surveys.concat(timeWallRouterCard)
      : providerFilter === "timewall"
        ? surveys.filter((s) => s.provider === providerFilter).concat(timeWallRouterCard)
        : surveys.filter((s) => s.provider === providerFilter);

  const twTotal = twSurveys.reduce((sum, s) => sum + (Number(s.currency_amount) || 0), 0);
  const totalPotential = surveys.reduce((sum, s) => sum + (s.rewardPoints || 0), 0) + twTotal;
  const availableCount = surveys.length + twSurveys.length;

  const openSurvey = (survey) => {
    // Si la encuesta tiene un href directo (de la API), abrirlo
    if (survey.href) {
      window.open(survey.href, "_blank");
      return;
    }
    // Fallback: abrir el offer wall del proveedor
    if (survey.provider === "cpx_research") openCpxOfferWall(user, token);
    else openTheoremReachOfferWall(user, token);
  };

  const openProviderWall = (providerKey) => {
    if (providerKey === "cpx") openCpxOfferWall(user, token);
    else if (providerKey === "timewall") openTimeWallOfferwall(user);
    else if (providerKey === "rapidoreach") openRapidoReachOfferWall(token);
    else openTheoremReachOfferWall(user, token);
  };

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Header */}
      <header className="pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon3D name="surveys" className="h-10 w-10" />
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{t("tabs.encuestas.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("tabs.encuestas.sub")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSurveys}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t("comun.update")}
            </button>
            <button
              onClick={() => setShowStats((s) => !s)}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${showStats ? "" : "rotate-180"}`}
              />
              {showStats ? t("ec.stats.hide") : t("ec.stats.show")}
            </button>
          </div>
        </div>

        {showStats && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="font-display text-3xl font-bold text-emerald-400">
                {loading ? "…" : availableCount}
              </p>
              <p className="text-xs text-muted-foreground">{t("ec.available")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="font-display text-3xl font-bold text-emerald-400">
                {loading ? "…" : `+${totalPotential.toLocaleString("es")}`}
              </p>
              <p className="text-xs text-muted-foreground">{t("ec.potential")}</p>
            </div>
          </div>
        )}
      </header>

      {/* Filtro por proveedor: debajo del encabezado, a todo el ancho */}
      <SurveyFilterBar value={providerFilter} onChange={setProviderFilter} />

      {/* Dos columnas: muros de ofertas (izquierda) y encuestas (derecha) */}
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        {/* ===== Columna izquierda: muros de ofertas ===== */}
        <div className="space-y-4">
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("nav.ofertas")}
            </h3>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <ProviderButton
                label="CPX Research"
                sublabel={t("ec.openWall")}
                logo={CPX_LOGO_URL}
                available={providerStatus.cpx}
                onClick={() => openProviderWall("cpx")}
              />
              <ProviderButton
                label="TheoremReach"
                sublabel={t("ec.openWall")}
                logo={THEOREMREACH_LOGO_URL}
                available={providerStatus.tr}
                onClick={() => openProviderWall("theoremreach")}
              />
              <ProviderButton
                label="TimeWall"
                sublabel={t("ec.openFullWall")}
                logo={TIMEWALL_LOGO_URL}
                available
                onClick={() => openProviderWall("timewall")}
              />
              <ProviderButton
                label="RapidoReach"
                sublabel={t("ec.openWall")}
                logo={RAPIDOREACH_LOGO_URL}
                available
                onClick={() => openProviderWall("rapidoreach")}
              />
            </div>
          </section>

        </div>

        {/* ===== Columna derecha: encuestas individuales ===== */}
        <div className="space-y-3">
          {/* RapidoReach no tiene API de encuestas individuales: cuando el filtro
              es RapidoReach se ofrece el acceso al muro acá, en la columna de
              resultados. En la vista general no se repite la tarjeta porque el
              botón del logo ya lo abre arriba. */}
          {providerFilter === "rapidoreach" && <RapidoReachOfferWall />}

          {/* Encabezado del proveedor elegido en el filtro, mismo formato que
              la sección de TimeWall. */}
          {providerFilter === "cpx_research" && (
            <ProviderHeader
              logo={CPX_LOGO_URL}
              title={t("cpx.surveys.title")}
              subtitle={t("cpx.surveys.sub")}
            />
          )}
          {providerFilter === "theoremreach" && (
            <ProviderHeader
              logo={THEOREMREACH_LOGO_URL}
              title={t("tr.surveys.title")}
              subtitle={t("tr.surveys.sub")}
            />
          )}

          {/* Encuestas TimeWall — se muestran en la columna lateral, apiladas
              con el resto de encuestas. Se respeta el filtro de proveedor. */}
          {(providerFilter === "all" || providerFilter === "timewall") && (
            <TimeWallSurveysSection surveys={twSurveys} loading={twLoading} error={twError} />
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <p className="mt-3 px-4 text-center text-sm text-muted-foreground">
                {t("ec.searching")}
              </p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-medium text-rose-400">{t("ec.loadError")}</p>
                <p className="mt-0.5 text-xs text-rose-300/70">{error}</p>
                <button
                  onClick={fetchSurveys}
                  className="mt-2 text-xs font-semibold text-rose-400 underline"
                >
                  {t("comun.retry")}
                </button>
              </div>
            </div>
          )}

          {/* Empty state — global (no filter) */}
          {!loading && !error && surveys.length === 0 && providerFilter === "all" && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
                <RefreshCw className="h-7 w-7 text-orange-400 animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">{t("ec.refreshing")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("ec.refreshingSub")}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => openProviderWall("cpx")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400"
                >
                  {t("ec.open", { provider: "CPX Research" })} <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => openProviderWall("theoremreach")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400"
                >
                  {t("ec.open", { provider: "TheoremReach" })} <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Empty state — filtered by specific provider with no surveys */}
          {!loading && !error && filtered.length === 0 && providerFilter !== "all" && providerFilter !== "rapidoreach" && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-3 shadow-lg ring-1 ring-white/10">
                <img
                  src={providerFilter === "cpx_research" ? CPX_LOGO_URL : THEOREMREACH_LOGO_URL}
                  alt={providerFilter === "cpx_research" ? "CPX Research" : "TheoremReach"}
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-sm font-medium text-foreground">
                {t("ec.noneOf", { provider: providerFilter === "cpx_research" ? "CPX Research" : "TheoremReach" })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("ec.noneOfSub")}
              </p>
              <button
                onClick={() =>
                  openProviderWall(providerFilter === "cpx_research" ? "cpx" : "theoremreach")
                }
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                  providerFilter === "cpx_research"
                    ? "bg-orange-500 text-orange-950 hover:bg-orange-400"
                    : "bg-violet-500 text-white hover:bg-violet-400"
                }`}
              >
                {t("ec.open", { provider: providerFilter === "cpx_research" ? "CPX Research" : "TheoremReach" })}
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Survey cards — pila vertical */}
          {!loading && !error && filtered.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {filtered.map((survey, idx) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  featured={idx === 0}
                  onOpen={() => openSurvey(survey)}
                />
              ))}
            </div>
          )}

          <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("ec.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}

// Tarjeta blanca del muro de ofertas — logo centrado, igual para los 4 proveedores.
function ProviderButton({ label, sublabel, logo, available, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-2.5 text-center shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="flex h-9 w-full items-center justify-center overflow-hidden">
        <Image src={logo} alt={label} fittingType="fit" className="h-full w-full object-contain" />
      </div>
      <div className="flex items-center gap-1">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${available ? "bg-emerald-500" : "bg-slate-300"}`}
        />
        <span className="truncate text-[11px] font-semibold text-slate-800">{label}</span>
      </div>
      <span className="flex items-center gap-1 text-[9px] font-medium text-orange-600">
        {sublabel} <ExternalLink className="h-2.5 w-2.5" />
      </span>
    </button>
  );
}
