import React from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { Trophy, ExternalLink } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Placement de TimeWall — muro completo de ofertas/juegos.
const TIMEWALL_GAMES_OID = "23136e7e5bb49f18";

function buildTimeWallUrl(userId) {
  return `https://timewall.io/users/login?oid=${TIMEWALL_GAMES_OID}&userID=${encodeURIComponent(userId)}`;
}

// Juegos destacados (3 tarjetas grandes arriba).
const FEATURED_GAMES = [
  {
    title: "Block Pop Party",
    points: 7735,
    icon: "https://play-lh.googleusercontent.com/OK7aZ4JzgaGUG6d55Kiq1dL2GoheZqswweUA0c0MehCemR4j8uQkh99C2GMM4GMClD6dGW9TChLD_5_SP2hosA=s256-rw",
    events: 7,
  },
  {
    title: "Bubble Pop Legends",
    points: 8050,
    icon: "https://play-lh.googleusercontent.com/1lfbU63sPlumNscTYFletrkF2ghhACNr4BtUZ4emGZrwD0lMUi3E6HCIsUUKMlBtGWstkU9JFiCk-okUaZM0rw=s256-rw",
    events: 6,
  },
  {
    title: "Clumsy Arrow",
    points: 8850,
    icon: "https://play-lh.googleusercontent.com/aWc5KC8yxf_MbWGxbTmq-NWc3iwLR0demqr3VnkpSgZjNckY1uGjmTqhJBN5QOBzeoS-Avg_uCaV9v-TIwn3jd4=s256-rw",
    events: 7,
  },
];

// Grilla de juegos (9 tarjetas chicas abajo).
const GRID_GAMES = [
  { title: "Crazy Aim", points: 30715, icon: "https://play-lh.googleusercontent.com/oo6ZewpoMFQ1WjIr6YwMPwLCMHJ6tVooTA2PilPh2X_222Xhgwy9x_d1w6VXjdeV2sYHSjKW51rV1KmG3iJULg=s256-rw" },
  { title: "Dragon Down", points: 9305, icon: "https://play-lh.googleusercontent.com/4k3awXPyQfFPZF1DS3xB7Bv_ZmkqGYc_utRWB3fNsesWrP24-qsUiSyU8s_Ya3L1yK5OLgEcvOt_7ohQHllYjA=s256-rw" },
  { title: "Free My Cat", points: 26250, icon: "https://play-lh.googleusercontent.com/bZiroAvqInw8o73II9vEIjNsbbaACaDp0Q9f0Tl54ejkxExT0yqdcZhjkyTeqW4FJlDyc485ZiczQxk2Urh1Gw=s256-rw" },
  { title: "Frontline Platoon", points: 3850, icon: "https://play-lh.googleusercontent.com/es_kjfcppKSUE2TJTkVZ02o0lpE51YQ7I1mhHJTEd3U8TCKVXW4qVrD_ZTek8tnuoLbTfwVWyytueX1hLFwbjA=s256-rw" },
  { title: "Mochi Fall", points: 11805, icon: "https://play-lh.googleusercontent.com/vnyNs5uF_f3lKPu2Iy1x1T9mbiPFQr2icmPAVWWTJoOTQ2XUmpwhDFuaxhf4g7T_WOV1FOwknIuhQ0BD_uq1VQ=s256-rw" },
  { title: "OneShot Pool", points: 11585, icon: "https://play-lh.googleusercontent.com/s08Rn6DLfG-jWDnZ-RtXsETKPBvbU1BxxKnIVm5TAgvuRwXErnerpX7Ok0xJCHo7wD3_60iqmJzbSV87xpupQA=s256-rw" },
  { title: "Risky Roller", points: 2590, icon: "https://play-lh.googleusercontent.com/ZvWzfJvS72o4PpkcYK6TZMX_6iyu5mrAUHyL4JiY3XX1Ahet_VLFKq-28D5dCffuVVQXblfjFCMcogIA70EUtA=s256-rw" },
  { title: "Rocket Hit", points: 27660, icon: "https://play-lh.googleusercontent.com/n5gJklRfyXYZJrMJtDTU6kJXRkqkECFO18OHNbHQmOd91zKh8pWtE2Yj_dqrLO4zb8pwnS3dQ9pFB2qxdT4asw=s256-rw" },
  { title: "Swap Rush", points: 8265, icon: "https://play-lh.googleusercontent.com/D50zhScyWyt7AQqfT6NhXv0_rF_RckIVPvRYL_F5h0BRhmnXbSPRb5On4wdNxc4_qMFjm34NvPXZtMlNxwDqD_E=s256-rw" },
];

function formatPoints(n) {
  return n.toLocaleString("es");
}

export default function TimeWallGamesSection() {
  const { user } = useLatamBucks();
  const { t } = useI18n();
  const userId = user?.id || "";

  const openGame = () => {
    if (!userId) return;
    window.open(buildTimeWallUrl(userId), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Icon3D name="trophy" className="h-9 w-9 rounded-xl" />
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{t("juegos.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("juegos.sub")}
          </p>
        </div>
      </div>

      {/* Destacados — 3 tarjetas grandes horizontales */}
      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURED_GAMES.map((game) => (
          <button
            key={game.title}
            onClick={openGame}
            className="group flex box-border min-w-0 w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 text-left transition hover:border-orange-500/40 hover:shadow-lg hover:shadow-black/30"
          >
            <img
              src={game.icon}
              alt={game.title}
              loading="lazy"
              className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{game.title}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-400">
                <Trophy className="h-3 w-3" />
                {t("juegos.events", { n: game.events })}
              </div>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2 py-1 text-xs font-bold text-orange-950 transition group-hover:bg-orange-400">
                {formatPoints(game.points)} pts
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Grilla — 9 tarjetas chicas verticales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GRID_GAMES.map((game) => (
          <button
            key={game.title}
            onClick={openGame}
            className="group flex box-border min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 text-center transition hover:border-orange-500/40 hover:shadow-lg hover:shadow-black/30"
          >
            <div className="relative mx-auto mb-2">
              <img
                src={game.icon}
                alt={game.title}
                loading="lazy"
                className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10"
              />
            </div>
            <p className="mb-2 line-clamp-1 text-xs font-semibold text-foreground">{game.title}</p>
            <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-orange-500 px-2 py-1.5 text-xs font-bold text-orange-950 transition group-hover:bg-orange-400">
              {formatPoints(game.points)} pts
              <ExternalLink className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}