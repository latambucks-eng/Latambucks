import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import {
  fetchPendingPruebasForAnunciante,
  fetchMisCampanas,
  aprobarPrueba,
  rechazarPrueba,
  administrarEstadoCampana,
} from "@/lib/supabaseClient";
import { Megaphone, Loader2, Check, X, Inbox, BarChart3, Link2, Wallet, Info, Pause } from "lucide-react";
import { Image } from "@/components/ui/image";
import { PaymentLogoBadge } from "@/components/latambucks/PaymentLogos";
import AnunciarAqui from "@/components/latambucks/AnunciarAqui";
import toast from "react-hot-toast";

export default function AnunciantePanel() {
  const { t } = useI18n();
  const { token, user, perfil, refreshPerfil } = useLatamBucks();
  const [rows, setRows] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [rejectText, setRejectText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, camps] = await Promise.all([
        fetchPendingPruebasForAnunciante(token, user.email),
        fetchMisCampanas(token, user.email),
      ]);
      setRows(Array.isArray(data) ? data : []);
      setCampanas(Array.isArray(camps) ? camps : []);
    } catch (e) {
      setErr(e.message || t("an.err.load"));
      setRows([]);
      setCampanas([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load, token]);

  const handleAprobar = async (prueba) => {
    setErr("");
    setBusy(prueba.id);
    try {
      // aprobarPrueba ahora hace todo server-side: marca aprobado, recalcula
      // visitas, inserta historial (trigger de saldo) y acredita comisión al patrocinador.
      await aprobarPrueba(token, prueba);
      setRows((r) => r.filter((x) => x.id !== prueba.id));
      // Refrescar el contador de visitas en "Mis Campañas"
      const camps = await fetchMisCampanas(token, user.email);
      setCampanas(Array.isArray(camps) ? camps : []);
    } catch (e) {
      setErr(e.message || t("an.err.aprobar"));
    } finally {
      setBusy(null);
    }
  };

  const handleRechazar = async (prueba) => {
    setErr("");
    if (!rejectText.trim()) {
      setErr(t("an.err.motivo"));
      return;
    }
    setBusy(prueba.id);
    try {
      await rechazarPrueba(token, prueba.id, rejectText.trim());
      setRows((r) => r.filter((x) => x.id !== prueba.id));
      setRejectId(null);
      setRejectText("");
    } catch (e) {
      setErr(e.message || t("an.err.rechazar"));
    } finally {
      setBusy(null);
    }
  };

  const cancelReject = () => {
    setRejectId(null);
    setRejectText("");
    setErr("");
  };

  const handlePausar = async (campania) => {
    setErr("");
    setBusy(`pausa-${campania.id}`);
    try {
      // administrarEstadoCampana valida autorización server-side (admin o
      // anunciante propietario), desactiva la campaña y reintegra el saldo
      // sobrante al saldo_promocion del anunciante en la misma transacción.
      const res = await administrarEstadoCampana(token, campania.id, false);
      // Refrescar campañas + perfil para reflejar el saldo reintegrado
      const [camps] = await Promise.all([
        fetchMisCampanas(token, user.email),
        refreshPerfil(token, user.id),
      ]);
      setCampanas(Array.isArray(camps) ? camps : []);
      const reintegro = Number(res?.reintegro ?? 0);
      toast.success(
        reintegro > 0
          ? t("an.toast.reintegro", { m: reintegro.toLocaleString("es") })
          : t("an.toast.pausada"),
        { toastId: `pausa-${campania.id}` }
      );
    } catch (e) {
      setErr(e.message || t("an.err.pausar"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 px-4 pb-4">
      <header className="flex items-center gap-2 pt-1">
        <Megaphone className="h-5 w-5 text-orange-400" />
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.anunciante.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("tabs.anunciante.sub")}</p>
        </div>
      </header>

      {err && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
      )}

      {/* Formulario para crear/anunciar una nueva campaña */}
      <AnunciarAqui />

      {/* Saldo Promoción + Guía */}
      <SaldoPromocionCard perfil={perfil} />

      {/* Mis Campañas */}
      {!loading && campanas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-1">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            <h3 className="font-display text-sm font-semibold text-foreground">
              {t("an.mis")}
            </h3>
          </div>
          {campanas.map((c) => {
            const visitas = Number(c.visitas_actuales ?? 0);
            const compradas = Number(c.visitas_compradas ?? 0);
            const pct = compradas > 0 ? Math.min(100, (visitas / compradas) * 100) : 0;
            const activa = c.activa && c.estado_pago === "aprobado";
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {c.titulo}
                  </p>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                      activa
                        ? "bg-green-500/10 text-green-400"
                        : c.estado_pago === "pendiente"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {activa ? t("an.activa") : c.estado_pago === "pendiente" ? t("an.revision") : t("an.pausada")}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("an.visitas")}</span>
                    <span className="font-medium text-foreground">
                      {visitas} / {compradas}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Desglose monetario */}
                <CampanaMoneyBar
                  monto={Number(c.monto_invertido_ars ?? 0)}
                  moneda={c.moneda || "ARS"}
                  compradas={compradas}
                  visitas={visitas}
                />
                {activa && (
                  <button
                    onClick={() => handlePausar(c)}
                    disabled={busy === `pausa-${c.id}`}
                    className="mb-2 mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    {busy === `pausa-${c.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pause className="h-3.5 w-3.5" />
                    )}
                    {t("an.pausar")}
                  </button>
                )}
                {c.enlace_url && (
                  <a
                    href={c.enlace_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-orange-400"
                  >
                    <Link2 className="h-3 w-3" /> {t("an.verEnlace")}
                  </a>
                )}
                {c.instrucciones && (
                  <div className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/10 p-2">
                    <p className="mb-0.5 text-[10px] font-semibold text-violet-400">{t("an.instr")}</p>
                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground">
                      {c.instrucciones}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pruebas pendientes */}
      <div className="flex items-center gap-2 pt-2">
        <Inbox className="h-4 w-4 text-orange-400" />
        <h3 className="font-display text-sm font-semibold text-foreground">
          {t("an.pruebas")}
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("an.pruebasEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const camp = p.campanas_locales || {};
            const puntos = Number(camp.puntos_recompensa ?? 0);
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{camp.titulo}</p>
                  <span className="shrink-0 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400">
                    +{puntos} Pts
                  </span>
                </div>

                <CountdownBar creadoEl={p.creado_el} />

                {p.url_captura && (
                  <a
                    href={p.url_captura}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 block overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={p.url_captura}
                      alt={t("an.captura")}
                      className="max-h-64 w-full"
                      fittingType="fit"
                    />
                  </a>
                )}

                {camp.instrucciones && (
                  <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
                    <p className="mb-1 text-xs font-semibold text-violet-400">{t("an.instrTarea")}</p>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                      {camp.instrucciones}
                    </p>
                  </div>
                )}

                <div className="mb-3 rounded-xl border border-border bg-background/40 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">{t("an.textoPrueba")}</p>
                  <p className="text-sm text-foreground">{p.texto_prueba || "—"}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAprobar(p)}
                    disabled={busy === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
                  >
                    {busy === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {t("an.aprobar")}
                  </button>
                  {rejectId !== p.id && (
                    <button
                      onClick={() => {
                        setRejectId(p.id);
                        setRejectText("");
                        setErr("");
                      }}
                      disabled={busy === p.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> {t("an.rechazar")}
                    </button>
                  )}
                </div>

                {/* Formulario de rechazo con motivo */}
                {rejectId === p.id && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={rejectText}
                      onChange={(e) => setRejectText(e.target.value)}
                      placeholder={t("an.rejectPh")}
                      rows={3}
                      className="lb-input resize-none"
                    />
                    {err && (
                      <p className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">
                        {err}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRechazar(p)}
                        disabled={busy === p.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2.5 text-sm font-medium text-white transition hover:bg-rose-400 disabled:opacity-60"
                      >
                        {busy === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        {t("an.confirmRechazo")}
                      </button>
                      <button
                        onClick={cancelReject}
                        disabled={busy === p.id}
                        className="flex items-center justify-center gap-1 rounded-xl border border-border px-3 text-sm text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CountdownBar({ creadoEl }) {
  const { t } = useI18n();
  if (!creadoEl) return null;
  const horas = 48 - (Date.now() - new Date(creadoEl).getTime()) / 3_600_000;
  if (horas <= 0) {
    return (
      <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-400">
        {t("an.time.out")}
      </p>
    );
  }
  const display =
    horas < 1
      ? t("an.time.min", { n: Math.ceil(horas * 60) })
      : t("an.time.hrs", { n: Math.floor(horas) });
  return (
    <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-400">
      {t("an.time.left", { d: display })}
    </p>
  );
}

/* ---------- Saldo Promoción + Guía ---------- */
function SaldoPromocionCard({ perfil }) {
  const { t } = useI18n();
  const saldoPromo = Number(perfil?.saldo_promocion ?? 0);
  const saldoDisp = Number(perfil?.saldo_disponible ?? 0);
  const saldoTotal = saldoPromo + saldoDisp;
  const saldoTotalUSD = saldoTotal / 1000;
  return (
    <div className="space-y-3">
      {/* Saldo disponible */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/15 blur-[50px]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">{t("promo.title")}</p>
            <p className="font-display text-2xl font-bold text-violet-400">
              ${saldoTotalUSD.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>
          </div>
        </div>
        <p className="relative mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("promo.desc")}
        </p>
        {saldoTotalUSD > 0 && (
          <Link
            to="/anunciante"
            className="relative mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-violet-500 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            <Megaphone className="h-4 w-4" />
            {t("promo.crear")}
          </Link>
        )}
        <div
          role="img"
          aria-label={t("promo.aria")}
          className="relative mt-3 flex box-border w-full items-center justify-center gap-2.5 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-card to-violet-500/10 px-3 py-2.5 text-center"
        >
          <PaymentLogoBadge metodo="payoneer" className="h-11 w-16 shrink-0" />
          <PaymentLogoBadge metodo="airtm" className="h-11 w-16 shrink-0" />
          <PaymentLogoBadge metodo="paypal" className="h-11 w-16 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              Payoneer · Airtm · PayPal
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {t("promo.metodos")}
            </p>
          </div>
        </div>
      </div>

      {/* Guía breve */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-orange-400" />
          <p className="text-sm font-semibold text-foreground">{t("promo.guia")}</p>
        </div>
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <li>
            <span className="text-foreground">•</span> {t("promo.g1")}
          </li>
          <li>
            <span className="text-foreground">•</span> {t("promo.g2a")}<span className="font-semibold text-foreground">{t("promo.g2b")}</span>{t("promo.g2c")}
          </li>
          <li>
            <span className="text-foreground">•</span> {t("promo.g3a")}<span className="font-semibold text-foreground">{t("promo.g3b")}</span>{t("promo.g3c")}
          </li>
          <li>
            <span className="text-foreground">•</span> {t("promo.g4a")}<span className="font-semibold text-violet-400">{t("promo.g4b")}</span>{t("promo.g4c")}
          </li>
          <li>
            <span className="text-foreground">•</span> {t("promo.g5")}
          </li>
        </ul>
        <Link
          to="/reembolsos"
          className="mt-2.5 inline-block text-[11px] font-semibold text-orange-400 underline"
        >
          {t("promo.politica")}
        </Link>
      </div>
    </div>
  );
}

/* ---------- Desglose monetario por campaña ----------
   Lógica de negocio: de lo que el anunciante paga (bruto), el 30% es
   comisión de la plataforma (no reembolsable) y el 70% restante es el
   presupuesto realmente consumible en tareas. Consumido/Restante se
   calculan solo sobre ese 70% neto. */
function CampanaMoneyBar({ monto, moneda, compradas, visitas }) {
  const { t } = useI18n();
  if (!monto || monto <= 0) return null;
  const simbolo = moneda === "USD" ? "USD" : "ARS";
  const fmt = (v) =>
    `${simbolo} ${v.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const montoNeto = monto * 0.70;
  const comision = monto - montoNeto;

  // El costo por visita sale del precio neto por cupo (la comisión del 30%
  // ya está excluida), de modo que solo gastan en tareas el 70% que corresponde.
  const costoPorVisita = compradas > 0 ? montoNeto / compradas : 0;
  const consumido = visitas * costoPorVisita;
  const restante = Math.max(0, montoNeto - consumido);
  const pctConsumido = montoNeto > 0 ? Math.min(100, (consumido / montoNeto) * 100) : 0;

  return (
    <div className="mb-2 rounded-xl border border-border bg-background/40 p-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{t("money.pagado")}</span>
        <span className="font-medium text-foreground">{fmt(monto)}</span>
      </div>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-violet-400/90">
          <Info className="h-3 w-3" /> {t("money.comision")}
        </span>
        <span className="text-violet-400">− {fmt(comision)}</span>
      </div>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{t("money.presupuesto")}</span>
        <span className="font-medium text-foreground">{fmt(montoNeto)}</span>
      </div>
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${pctConsumido}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-rose-400/80">{t("money.consumido", { v: fmt(consumido) })}</span>
        <span className="font-semibold text-emerald-400">{t("money.restante", { v: fmt(restante) })}</span>
      </div>
    </div>
  );
}