import React, { useState, useEffect, useCallback } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import {
  fetchRetiros,
  updatePerfil,
  fetchAppConfig,
} from "@/lib/supabaseClient";
import { cicloActualMarker, proximoCorteEpoch, formatCountdown } from "@/lib/cicloFacturacion";
import { Switch } from "@/components/ui/switch";
import {
  PaymentMethodSelector,
  getPaymentMethodLabel,
  PAYMENT_METHODS,
} from "@/components/latambucks/PaymentLogos";
import {
  Loader2,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lock,
  Save,
  Hourglass,
  PauseCircle,
  Info,
} from "lucide-react";

export default function WithdrawalsTab() {
  const { t } = useI18n();
  const { token, user, perfil, refreshPerfil, exchangeRate } = useLatamBucks();
  const minPoints = 5000;

  const [form, setForm] = useState({ destino: "", titular: "" });
  const [metodo, setMetodo] = useState(perfil?.metodo_pago_preferido || "payoneer");
  const [paypalFeeInfo, setPaypalFeeInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [holdBusy, setHoldBusy] = useState(false);
  const [retiros, setRetiros] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [now, setNow] = useState(Date.now());

  const disponible = perfil?.saldo_disponible ?? 0;
  const enProceso = perfil?.saldo_pendiente ?? 0;
  const retener = !!perfil?.retener_pagos;
  const cicloProcesado = perfil?.ultimo_ciclo_procesado === cicloActualMarker();

  const esArgentina = perfil?.pais === "Argentina";
  const equivalenteUSD = disponible / 1000;
  const equivalenteARS = esArgentina ? equivalenteUSD * exchangeRate : 0;

  // Cargar info de comisión de PayPal desde app_config
  useEffect(() => {
    if (!token) return;
    fetchAppConfig(token, "paypal_fee_info")
      .then((info) => { if (info) setPaypalFeeInfo(String(info)); })
      .catch(() => {});
  }, [token]);

  const loadRetiros = useCallback(async () => {
    if (!token || !user) return;
    setLoadingList(true);
    try {
      const rows = await fetchRetiros(token, user.id);
      setRetiros(Array.isArray(rows) ? rows : []);
    } catch {
      setRetiros([]);
    } finally {
      setLoadingList(false);
    }
  }, [token, user]);

  // Precarga datos de cobro guardados
  useEffect(() => {
    setForm({
      destino: perfil?.destino_pago || "",
      titular: perfil?.titular_pago || "",
    });
    if (perfil?.metodo_pago_preferido) setMetodo(perfil.metodo_pago_preferido);
  }, [perfil?.destino_pago, perfil?.titular_pago, perfil?.metodo_pago_preferido]);

  useEffect(() => {
    loadRetiros();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [loadRetiros]);

  const guardarDatos = async (e) => {
    e.preventDefault();
    setSaveMsg("");
    setSaving(true);
    try {
      await updatePerfil(token, user.id, {
        destino_pago: form.destino.trim(),
        titular_pago: form.titular.trim(),
        metodo_pago_preferido: metodo,
      });
      await refreshPerfil(token, user.id);
      setSaveMsg(t("retiros.ok.guardar"));
    } catch (e2) {
      setSaveMsg(e2.message || t("retiros.err.guardar"));
    } finally {
      setSaving(false);
    }
  };

  const toggleHold = async () => {
    setHoldBusy(true);
    try {
      await updatePerfil(token, user.id, { retener_pagos: !retener });
      await refreshPerfil(token, user.id);
    } catch {
    } finally {
      setHoldBusy(false);
    }
  };

  const restante = proximoCorteEpoch() - now;
  const pasasteMin = disponible >= minPoints;
  const metodoSeleccionado = PAYMENT_METHODS.find((m) => m.id === metodo);

  return (
    <div className="space-y-5 px-4 pb-4">
      <header className="pt-1">
        <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.retiros.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("tabs.retiros.sub")}</p>
      </header>

      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/20 blur-[60px]" />
        <p className="text-xs font-medium uppercase tracking-wider text-orange-400/80">
          {t("retiros.disponible")}
        </p>
        <div className="mt-1 flex items-end gap-2">
          <span className="font-display font-bold leading-none text-foreground [font-size:clamp(2rem,6vw,3.2rem)]">
            {disponible.toLocaleString("es")}
          </span>
          <span className="mb-1 text-sm font-medium text-muted-foreground">Pts</span>
        </div>
        <div className="mt-1 space-y-0.5">
          <p className="text-sm text-muted-foreground">
            {t("retiros.equiv")}{" "}
            <span className="font-semibold text-orange-400">
              ${equivalenteUSD.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </p>
          {esArgentina && exchangeRate > 0 && (
            <p className="text-xs text-muted-foreground">
              ≈ <span className="font-semibold text-orange-400">
                ${Math.round(equivalenteARS).toLocaleString("es")} ARS
              </span>
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("retiros.pendiente")}</p>
            <p className="font-display text-lg font-semibold text-foreground">
              {enProceso.toLocaleString("es")} Pts
            </p>
          </div>
        </div>
      </div>

      {/* Cartel de corte de facturación con countdown */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-500/20 blur-[45px]" />
        <div className="relative flex items-center gap-2">
          <Hourglass className="h-4 w-4 text-orange-400" />
          <p className="font-display text-sm font-semibold text-orange-300">
            {t("retiros.corte.title")}
          </p>
        </div>
        <p className="relative mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
          {formatCountdown(restante)}
        </p>
        <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("retiros.corte.a")} <span className="font-semibold text-foreground">{t("retiros.corte.b")}</span>{t("retiros.corte.c")}{" "}
          <span className="font-semibold text-foreground">{t("retiros.corte.d")}</span>.
        </p>
      </div>

      {/* Control Antifraude */}
      <div className="flex items-start gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
        <p className="text-xs leading-relaxed text-orange-200/90">
          🛡️ <span className="font-semibold">{t("retiros.antifraude.title")}</span>{t("retiros.antifraude.a")}
          <span className="font-semibold">{t("retiros.antifraude.b")}</span>{t("retiros.antifraude.c")}
        </p>
      </div>

      {/* Estado del ciclo */}
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          cicloProcesado
            ? "border-orange-500/30 bg-orange-500/10"
            : pasasteMin
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-border bg-card"
        }`}
      >
        {cicloProcesado ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
        ) : (
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {cicloProcesado ? (
            <>
              {t("retiros.ciclo.ok.a")}{" "}
              <span className="font-semibold text-foreground">{t("retiros.ciclo.ok.b")}</span>{t("retiros.ciclo.ok.c")}
            </>
          ) : pasasteMin ? (
            <>
              {t("retiros.ciclo.min.a")} <span className="font-semibold text-foreground">{t("retiros.ciclo.min.b", { pts: minPoints })}</span>{t("retiros.ciclo.min.c")}{" "}
              <span className="font-semibold text-foreground">{t("retiros.ciclo.min.d")}</span>{t("retiros.ciclo.min.e")}
              {retener && (
                <span className="mt-1 block text-amber-400">
                  {t("retiros.ciclo.hold")}
                </span>
              )}
            </>
          ) : (
            <>
              {t("retiros.ciclo.falta.a")}{" "}
              <span className="font-semibold text-foreground">
                {t("retiros.ciclo.falta.b", { pts: (minPoints - disponible).toLocaleString("es") })}
              </span>{" "}
              {t("retiros.ciclo.falta.c", { min: minPoints })}
            </>
          )}
        </p>
      </div>

      {/* Toggle Retener Pagos */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            {retener ? <PauseCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("retiros.hold.title")}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {t("retiros.hold.desc")}
            </p>
          </div>
        </div>
        <Switch checked={retener} onCheckedChange={toggleHold} disabled={holdBusy} />
      </div>

      {/* Datos de cobro guardados */}
      <form onSubmit={guardarDatos} className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("retiros.metodo")}</p>
          <PaymentMethodSelector value={metodo} onChange={setMetodo} />
        </div>

        {/* Aviso de comisión de PayPal */}
        {metodo === "paypal" && paypalFeeInfo && (
          <div className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-xs leading-relaxed text-sky-200/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            <p>{paypalFeeInfo}</p>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          {t("retiros.minimo.nota", { min: minPoints })}
        </p>

        <Field label={t("retiros.campo.correo", { metodo: getPaymentMethodLabel(metodo) })}>
          <input
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
            placeholder={metodoSeleccionado?.placeholder || "tucorreo@email.com"}
            className="lb-input"
          />
        </Field>
        <Field label={t("retiros.campo.titular")}>
          <input
            value={form.titular}
            onChange={(e) => setForm({ ...form, titular: e.target.value })}
            placeholder={t("retiros.campo.titularPh")}
            className="lb-input"
          />
        </Field>

        {saveMsg && (
          <p className="rounded-lg bg-orange-500/10 px-3 py-2 text-xs text-orange-400">{saveMsg}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("retiros.guardar")}
        </button>
      </form>

      {/* History */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">{t("retiros.historial")}</h3>
        {loadingList ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : retiros.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
            {t("retiros.sinCobros")}
          </p>
        ) : (
          <div className="space-y-2">
            {retiros.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {r.puntos_solicitados?.toLocaleString("es") ?? 0} Pts
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {getPaymentMethodLabel(r.metodo_pago) || r.metodo_pago}
                  </p>
                </div>
                <StatusBadge estado={r.estado} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ estado }) {
  const { t } = useI18n();
  const map = {
    pendiente: { icon: Clock, cls: "text-amber-400 bg-amber-500/10", label: "retiros.status.pendiente" },
    procesado: { icon: CheckCircle2, cls: "text-orange-400 bg-orange-500/10", label: "retiros.status.procesado" },
    rechazado: { icon: XCircle, cls: "text-rose-400 bg-rose-500/10", label: "retiros.status.rechazado" },
  };
  const s = map[estado] || map.pendiente;
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${s.cls}`}>
      <Icon className="h-3 w-3" /> {t(s.label)}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}