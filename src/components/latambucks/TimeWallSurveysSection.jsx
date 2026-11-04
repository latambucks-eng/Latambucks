import React from "react";
import { Loader2 } from "lucide-react";
import SurveyCard from "@/components/latambucks/SurveyCard";
import { useI18n } from "@/lib/i18n/LanguageContext";

import TIMEWALL_LOGO_URL from "@/assets/external/timewall-icon.png";

// Sección dedicada de encuestas de TimeWall (Survey API oficial).
// Renderiza las encuestas en el mismo grid de tarjetas que CPX/TheoremReach,
// con el logo de TimeWall en cada tarjeta y el badge "TOP" en la primera.
// Es puramente presentacional: recibe las encuestas ya fetchadas por el
// padre (EncuestasTab) para que sus puntos se sumen al total en vivo.
export default function TimeWallSurveysSection({ surveys, loading, error }) {
  const { t } = useI18n();
  const list = Array.isArray(surveys) ? surveys : [];

  // Mapea las encuestas de TimeWall al formato que usa SurveyCard
  const cards = list.map((s) => ({
    id: s.id,
    provider: "timewall",
    rewardPoints: Number(s.currency_amount) || 0,
    estimatedTime: Number(s.loi) || 0,
    href: s.link,
  }));

  const openSurvey = (survey) => {
    if (survey.href) window.open(survey.href, "_blank");
  };

  return (
    <section className="space-y-3">
      {/* Header con logo de TimeWall */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95 p-1.5 ring-1 ring-white/20 shadow-lg shadow-black/30">
          <img
            src={TIMEWALL_LOGO_URL}
            alt="TimeWall"
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">
            {t("timewall.surveys.title")}
          </h3>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t("timewall.surveys.sub")}
          </p>
        </div>
      </div>

      {/* Grid de tarjetas — mismo diseño que las de CPX/TheoremReach */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12">
          <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error
              ? t("timewall.surveys.err")
              : t("timewall.surveys.empty")}
          </p>
          {error && (
            <p className="mt-1 text-[11px] text-rose-400/80 break-words">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cards.map((survey, idx) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              featured={idx === 0}
              onOpen={() => openSurvey(survey)}
            />
          ))}
        </div>
      )}
    </section>
  );
}