import React, { useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import ReferidosPanel from "@/components/latambucks/ReferidosPanel";
import { Copy, Check, Gift, Users } from "lucide-react";

export default function ReferidosTab() {
  const { perfil } = useLatamBucks();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const codigo = perfil?.codigo_referido || "LB-XXXXXX";
  const porReferidos = perfil?.puntos_por_referidos ?? 0;

  const copyCode = () => {
    const refLink = `${window.location.origin}/?ref=${encodeURIComponent(codigo)}`;
    navigator.clipboard?.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5 px-4 pb-4">
      <header className="pt-1">
        <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.referidos.title")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("tabs.referidos.sub")}
        </p>
      </header>

      {/* Referral code */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Gift className="h-4 w-4 text-violet-400" />
          <p className="text-sm font-medium text-foreground">{t("referidos.codigo")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-background/60 px-3 py-2.5 font-mono text-sm tracking-wider text-orange-400">
            {codigo}
          </div>
          <button
            onClick={copyCode}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-orange-950 transition hover:bg-orange-400"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange-500/10 px-3 py-2.5 ring-1 ring-orange-500/20">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
          <p className="text-[11px] leading-relaxed text-foreground">
            <span className="font-semibold text-orange-400">{t("referidos.bono.a")}</span>{t("referidos.bono.b")}
            <span className="font-bold text-orange-400">{t("referidos.bono.c")}</span>{t("referidos.bono.d")}
          </p>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("referidos.copiar.hint")}
        </p>
      </div>

      {/* Puntos por Referidos (comisión 10%) */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("referidos.puntos.title")}</p>
            <p className="font-display text-xl font-bold text-violet-400">
              {porReferidos.toLocaleString("es", { maximumFractionDigits: 2 })} Pts
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("referidos.puntos.desc")}
        </p>
      </div>

      {/* Historial de referidos y guía de ganancias */}
      <ReferidosPanel />
    </div>
  );
}