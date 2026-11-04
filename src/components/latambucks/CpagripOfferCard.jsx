import React from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { payoutToPoints, withTrackingDomain } from "@/lib/cpagripOfferFeed";
import OfferThumbnail from "@/components/latambucks/OfferThumbnail";

// Tarjeta de oferta de CPAGrip para el listado nativo dentro de LatamBucks.
// Arriba la imagen real de la oferta (con la recompensa superpuesta) y abajo
// el título con su categoría y el botón de acción.
// La oferta destacada se marca con una franja y badge naranjas (paleta del
// sitio). Es puramente visual: no altera links, puntos ni lógica de apertura.
export default function CpagripOfferCard({ offer, featured, onOpen }) {
  const points = payoutToPoints(offer.payout);
  const link = withTrackingDomain(offer.offerlink);

  return (
    <button
      onClick={() => onOpen(link)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition duration-200 ${
        featured
          ? "border-orange-500/45 bg-card shadow-lg shadow-orange-950/20 hover:border-orange-500/70"
          : "border-border bg-card hover:border-orange-500/30"
      }`}
    >
      <div className="relative">
        <OfferThumbnail offer={offer} size="banner" />

        {featured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-950 shadow-md shadow-black/30">
            <TrendingUp className="h-2.5 w-2.5" /> Top
          </span>
        )}

        <span className="absolute bottom-2 right-2 inline-flex items-baseline gap-0.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-orange-300 ring-1 ring-white/20 backdrop-blur-sm">
          +{points.toLocaleString("es")}
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70">pts</span>
        </span>
      </div>

      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
            {offer.title}
          </p>
          {offer.category && (
            <span className="mt-1.5 inline-block max-w-full truncate rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {offer.category}
            </span>
          )}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 transition group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}