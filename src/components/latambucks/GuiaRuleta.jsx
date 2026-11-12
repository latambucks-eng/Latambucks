import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { MULTIPLICAR } from "@/lib/i18n/content/multiplicar";
import LimitesRuletaModal from "@/components/latambucks/LimitesRuletaModal";

// Icono 3D del bloque de guía.
const SPARKLE_3D =
  "https://media.base44.com/images/public/6aac56144f542d29eaac794b/0b087ee69_generated_image.png";

// Tarjeta "guía" de la ruleta: texto global (sin cifras por país) + enlace
// discreto que abre los límites y probabilidades.
export default function GuiaRuleta() {
  const { lang } = useI18n();
  const copy = MULTIPLICAR[lang] || MULTIPLICAR.es;
  // Si un idioma quedara sin bloque de guía, cae a español y, como último
  // recurso, no renderiza nada: nunca debe tumbar la pestaña entera.
  const g = copy.guide || MULTIPLICAR.es.guide;
  if (!g) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <Image src={SPARKLE_3D} alt="" className="h-9 w-9 shrink-0 rounded-xl" />
        <div>
          <p className="font-display text-sm font-bold leading-snug text-foreground">{g.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{g.sub}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-2.5">
        {g.checks.map((rule) => {
          const [lead, ...rest] = rule.split(": ");
          return (
            <li
              key={rule}
              className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"
            >
              <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span>
                <strong className="font-semibold text-foreground">{lead}:</strong>{" "}
                {rest.join(": ")}
              </span>
            </li>
          );
        })}
      </ul>

      <LimitesRuletaModal copy={copy.limits} label={g.limitsLink} />
    </section>
  );
}
