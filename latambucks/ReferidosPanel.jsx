import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { rpcGetMisReferidos } from "@/lib/supabaseClient";
import { Users, Loader2, Gift, TrendingUp, Award, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function ReferidosPanel() {
  const { token, user } = useLatamBucks();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user?.id) return;
    rpcGetMisReferidos(token)
      .then((res) => {
        if (res?.success) setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
        <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
      </div>
    );
  }

  const totalReferidos = data?.total_referidos ?? 0;
  const totalGanado = data?.total_ganado ?? 0;
  const totalPendiente = data?.total_pendiente ?? 0;
  const referidos = data?.referidos ?? [];

  return (
    <div className="space-y-4">
      {/* Guía de ganancias — persuasiva */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-violet-400" />
          <p className="font-display text-sm font-bold text-foreground">{t("refpanel.title")}</p>
        </div>
        <div className="space-y-2.5">
          <GuideRow
            icon={<TrendingUp className="h-4 w-4 text-orange-400" />}
            text={t("refpanel.encuestas.text")}
            detail={t("refpanel.encuestas.detail")}
            example={t("refpanel.encuestas.example")}
          />
          <GuideRow
            icon={<Target className="h-4 w-4 text-sky-400" />}
            text={t("refpanel.tareas.text")}
            detail={t("refpanel.tareas.detail")}
            example={t("refpanel.tareas.example")}
          />
          <GuideRow
            icon={<Gift className="h-4 w-4 text-amber-400" />}
            text={t("refpanel.cajas.text")}
            detail={t("refpanel.cajas.detail")}
            example={t("refpanel.cajas.example")}
          />
        </div>
        <div className="mt-3 rounded-xl bg-background/50 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{t("refpanel.ejemplo.a")}</span>{t("refpanel.ejemplo.b")}
            <span className="font-bold text-violet-400">{t("refpanel.ejemplo.c")}</span>{t("refpanel.ejemplo.d")}
          </p>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {t("refpanel.nota")}
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label={t("refpanel.stat.referidos")} value={totalReferidos} />
        <StatBox label={t("refpanel.stat.ganado")} value={totalGanado} suffix="pts" accent="text-violet-400" />
        <StatBox label={t("refpanel.stat.pendiente")} value={totalPendiente} suffix="pts" accent="text-amber-400" />
      </div>

      {/* Historial de referidos */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 font-display text-sm font-bold text-foreground">{t("refpanel.historial")}</p>
        {referidos.length === 0 ? (
          <div className="py-6 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("refpanel.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referidos.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-foreground">{r.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("refpanel.ganado")} <span className="font-semibold text-violet-400">{r.comision_acreditada} pts</span>
                      {r.comision_pendiente > 0 && (
                        <span className="text-amber-400"> · {t("refpanel.pendiente")} {r.comision_pendiente} pts</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-400">
                  +{r.comision_acreditada}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideRow({ icon, text, detail, example }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-background/40 px-3 py-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground">{text}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-orange-400">{example}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value, suffix, accent = "text-foreground" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold ${accent}`}>
        {typeof value === "number" ? value.toLocaleString("es") : value}
        {suffix && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}