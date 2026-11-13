import React from "react";
import { Filter } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Opciones del filtro de proveedor. "all" usa la etiqueta corta "Ver todos"
// para que el chip no ocupe media pantalla en mobile.
const OPCIONES = [
  { value: "all", labelKey: "ec.seeAll" },
  { value: "cpx_research", label: "CPX Research" },
  { value: "theoremreach", label: "TheoremReach" },
  { value: "timewall", label: "TimeWall" },
  { value: "rapidoreach", label: "RapidoReach" },
];

export default function SurveyFilterBar({ value, onChange }) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/15">
          <Filter className="h-3 w-3 text-orange-400" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("ec.filter")}
        </span>
      </div>

      <div className="lb-nav-scroll -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
        {OPCIONES.map((op) => {
          const activo = value === op.value;
          const label = op.labelKey ? t(op.labelKey) : op.label;
          return (
            <button
              key={op.value}
              type="button"
              onClick={() => onChange(op.value)}
              aria-pressed={activo}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activo
                  ? "bg-orange-500 text-orange-950 shadow-sm shadow-orange-500/30"
                  : "border border-border bg-background/60 text-muted-foreground hover:border-orange-500/40 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
