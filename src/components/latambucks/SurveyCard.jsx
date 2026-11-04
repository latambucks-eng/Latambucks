import React from "react";
import { Clock, ArrowRight, TrendingUp, Star } from "lucide-react";
import { CPX_LOGO_URL } from "@/lib/cpxOfferWall";

// Logo recortado a su contenido real (el original tenía mucho margen blanco).
import THEOREMREACH_LOGO_URL from "@/assets/theoremreach-logo.png";

import TIMEWALL_LOGO_URL from "@/assets/external/timewall-icon.png";

// Tarjeta de encuesta — mismo formato para todos los proveedores:
// puntos + duración + valoración a la izquierda, logo y botón verde a la derecha.
export default function SurveyCard({ survey, featured, onOpen }) {
  const isCpx = survey.provider === "cpx_research";
  const isTimeWall = survey.provider === "timewall";
  const logo = isCpx ? CPX_LOGO_URL : isTimeWall ? TIMEWALL_LOGO_URL : THEOREMREACH_LOGO_URL;
  const providerName = isCpx ? "CPX Research" : isTimeWall ? "TimeWall" : "TheoremReach";
  const minutes = survey.estimatedTime || survey.loiMinutes;

  return (
    <button
      onClick={onOpen}
      className={`group relative flex w-full box-border items-center gap-2.5 overflow-hidden rounded-2xl p-3 text-left transition hover:shadow-lg hover:shadow-black/40 ${
        featured
          ? "bg-gradient-to-br from-indigo-800 to-indigo-950 ring-2 ring-emerald-500/40"
          : "bg-gradient-to-br from-indigo-950 to-blue-950 ring-1 ring-indigo-400/20 hover:ring-orange-500/40"
      }`}
    >
      {featured && (
        <span className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
          <TrendingUp className="h-2.5 w-2.5" /> TOP
        </span>
      )}

      {/* Izquierda: recompensa + duración + valoración */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-display text-2xl font-bold leading-none ${
              featured ? "text-emerald-300" : "text-white"
            }`}
          >
            +{survey.rewardPoints.toLocaleString("es")}
          </span>
          <span className="text-[10px] font-medium text-white/60">pts</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-white/70">
          <Clock className="h-3 w-3" />
          {minutes ? `${minutes} min` : "—"}
        </div>
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3 w-3 fill-white text-white" />
          ))}
        </div>
      </div>

      {/* Derecha: logo del proveedor + abrir */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-md ring-1 ring-white/10">
          <img src={logo} alt={providerName} className="h-full w-full object-contain" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-[0_0_15px_-3px] shadow-emerald-500/50 transition group-hover:bg-emerald-400">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}