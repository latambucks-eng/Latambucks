import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { rpcGetMisReferidos } from "@/lib/supabaseClient";
import { Users, Loader2 } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";
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
                  <Icon3D name="referrals" className="h-8 w-8" />
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