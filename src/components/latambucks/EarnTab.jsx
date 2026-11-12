import React from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { openCpxOfferWall } from "@/lib/cpxOfferWall";
import { openCpagripLocker } from "@/lib/cpagripOfferWall";
import Icon3D from "@/components/latambucks/Icon3D";
import CpagripGuide from "@/components/latambucks/CpagripGuide";
import RapidoReachOfferWall from "@/components/latambucks/RapidoReachOfferWall";

export default function EarnTab() {
  const { t } = useI18n();
  const { token, user } = useLatamBucks();

  return (
    <div className="relative space-y-5 px-4 pb-4">
      <header className="pt-1">
        <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.ganar.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("tabs.ganar.sub")}</p>
      </header>

      {/* More tasks (coming soon) */}
      <div className="grid gap-3">
        <TaskCard
          icon="surveys"
          accent="sky"
          title={t("earn.surveys.title")}
          desc={t("earn.surveys.desc")}
          hint={t("earn.surveys.hint")}
          reward={t("earn.surveys.reward")}
          rewardSub="+500 Pts"
          onClick={() => openCpxOfferWall(user, token)}
        />
        <TaskCard
          icon="apps"
          accent="violet"
          title={t("earn.apps.title")}
          desc={t("earn.apps.desc")}
          hint={t("earn.apps.hint")}
          reward="+1000 Pts"
          onClick={() => openCpagripLocker(user)}
        />
        {/* Guía del flujo de CPAGrip (locker) justo debajo de Descarga de apps */}
        <CpagripGuide />
      </div>

      {/* Muro de ofertas y encuestas de RapidoReach — iframe embebido */}
      <RapidoReachOfferWall />

      <p className="px-1 text-center text-xs text-muted-foreground">
        {t("earn.footer")}
      </p>
    </div>
  );
}

function TaskCard({ icon, title, desc, reward, rewardSub, disabled, onClick, accent = "violet", hint }) {
  const Wrapper = onClick && !disabled ? "button" : "div";
  const accents = {
    violet: { bg: "from-violet-500/25 to-violet-600/5", text: "text-violet-400", ring: "ring-violet-500/25", glow: "bg-violet-500/20" },
    sky: { bg: "from-sky-500/25 to-sky-600/5", text: "text-sky-400", ring: "ring-sky-500/25", glow: "bg-sky-500/20" },
  };
  const a = accents[accent] || accents.violet;
  return (
    <Wrapper
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition ${
        disabled ? "opacity-60" : onClick ? "hover:border-orange-500/40" : ""
      }`}
    >
      <div className={`pointer-events-none absolute -left-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full ${a.glow} opacity-50 blur-2xl transition group-hover:opacity-80`} />
      <Icon3D name={icon} className="relative h-12 w-12 rounded-xl shadow-lg shadow-black/30" />
      <div className="relative flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
        {hint && (
          <p className="mt-1 text-[11px] font-semibold text-orange-400">{hint}</p>
        )}
      </div>
      <span className="relative flex flex-col items-end gap-1 text-right">
        <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
          {reward}
        </span>
        {rewardSub && (
          <span className="text-[11px] font-bold text-emerald-400">{rewardSub}</span>
        )}
      </span>
    </Wrapper>
  );
}