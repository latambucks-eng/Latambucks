import React from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { Gamepad2, Trophy, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Miniaturas empaquetadas en el build (sin llamadas a Play Store ni a ningún
// CDN externo): el muro de juegos se ve igual en cualquier despliegue.
import gameBlockPop from "@/assets/external/games/block-pop-party.webp";
import gameBubblePop from "@/assets/external/games/bubble-pop-legends.webp";
import gameClumsyArrow from "@/assets/external/games/clumsy-arrow.webp";
import gameCrazyAim from "@/assets/external/games/crazy-aim.webp";
import gameDragonDown from "@/assets/external/games/dragon-down.webp";
import gameFreeMyCat from "@/assets/external/games/free-my-cat.webp";
import gameFrontline from "@/assets/external/games/frontline-platoon.webp";
import gameMochiFall from "@/assets/external/games/mochi-fall.webp";
import gameOneShotPool from "@/assets/external/games/oneshot-pool.webp";
import gameRiskyRoller from "@/assets/external/games/risky-roller.webp";
import gameRocketHit from "@/assets/external/games/rocket-hit.webp";
import gameSwapRush from "@/assets/external/games/swap-rush.webp";

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
    icon: gameBlockPop,
    events: 7,
  },
  {
    title: "Bubble Pop Legends",
    points: 8050,
    icon: gameBubblePop,
    events: 6,
  },
  {
    title: "Clumsy Arrow",
    points: 8850,
    icon: gameClumsyArrow,
    events: 7,
  },
];

// Grilla de juegos (9 tarjetas chicas abajo).
const GRID_GAMES = [
  { title: "Crazy Aim", points: 30715, icon: gameCrazyAim },
  { title: "Dragon Down", points: 9305, icon: gameDragonDown },
  { title: "Free My Cat", points: 26250, icon: gameFreeMyCat },
  { title: "Frontline Platoon", points: 3850, icon: gameFrontline },
  { title: "Mochi Fall", points: 11805, icon: gameMochiFall },
  { title: "OneShot Pool", points: 11585, icon: gameOneShotPool },
  { title: "Risky Roller", points: 2590, icon: gameRiskyRoller },
  { title: "Rocket Hit", points: 27660, icon: gameRocketHit },
  { title: "Swap Rush", points: 8265, icon: gameSwapRush },
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
          <Gamepad2 className="h-5 w-5" />
        </div>
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