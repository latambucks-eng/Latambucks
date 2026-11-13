import React from "react";
import { Loader2 } from "lucide-react";
import SurveyCard from "@/components/latambucks/SurveyCard";
import ProviderHeader from "@/components/latambucks/ProviderHeader";
import { useI18n } from "@/lib/i18n/LanguageContext";

const TIMEWALL_LOGO_URL = "https://images.timebucks.com/TimewallImages/icon.png";

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
      <ProviderHeader
        logo={TIMEWALL_LOGO_URL}
        title={t("timewall.surveys.title")}
        subtitle={t("timewall.surveys.sub")}
      />

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
