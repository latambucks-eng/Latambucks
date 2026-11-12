import React from "react";
import { Globe } from "lucide-react";
import { Image } from "@/components/ui/image";
import { getCountryFlag } from "@/components/latambucks/countryFlags";
import { localFlag } from "@/lib/localFlags";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function WinnerCountryFlag({ country }) {
  const { t } = useI18n();
  const characters = Array.from(getCountryFlag(country));
  const isFlag = characters.length === 2 && characters.every((character) => {
    const point = character.codePointAt(0);
    return point >= 0x1f1e6 && point <= 0x1f1ff;
  });
  if (!isFlag) return <Globe className="h-4 w-4 shrink-0" aria-label={t("comun.countryUnknown")} />;
  const code = characters.map((character) => String.fromCharCode(character.codePointAt(0) - 0x1f1e6 + 97)).join("");
  const flagSrc = localFlag(code);
  if (!flagSrc) return <Globe className="h-4 w-4 shrink-0" aria-label={country} />;
  return (
    <div
      title={country}
      className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md ring-1 ring-white/20 shadow-md shadow-black/40"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(0,0,0,0.25))",
      }}
    >
      <Image
        src={flagSrc}
        alt={`Bandera de ${country}`}
        fittingType="fill"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-br from-white/25 via-transparent to-black/25" />
    </div>
  );
}