import React from "react";
import { Users, ExternalLink } from "lucide-react";
import { Image } from "@/components/ui/image";
import { brandLogo } from "@/lib/localAssets";

const CANAL_URL = "https://whatsapp.com/channel/0029VbDZv7ADuMRbQPijiw2p";
const LOGO_URL = brandLogo;

// Invitación al canal oficial de WhatsApp de LatamBucks.
export default function WhatsappChannelCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4">
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-emerald-500/30">
          <Image
            src={LOGO_URL}
            alt="LatamBucks"
            className="h-full w-full"
            fittingType="fit"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            Canal oficial de WhatsApp
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
              Nuevo
            </span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Únete y comparte tu feedback y pruebas de pago con toda la comunidad. Ayuda a los
            demás a crecer con LatamBucks.
          </p>
        </div>
      </div>

      <a
        href={CANAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
      >
        <Users className="h-4 w-4" />
        Unirme al canal
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>
    </div>
  );
}