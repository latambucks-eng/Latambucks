import React, { useState, useEffect, useCallback } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { fetchPendingRetiros, patchRetiro, fetchPendingCampanas, patchCampana, rpcAutoAprobarVencidas, rpcRechazarRetiro } from "@/lib/supabaseClient";
import AdminDisputas from "@/components/latambucks/AdminDisputas";
import AdminRecargasPaypal from "@/components/latambucks/AdminRecargasPaypal";
import AdminAvisos from "@/components/latambucks/AdminAvisos";
import AdminAvisosUsuario from "@/components/latambucks/AdminAvisosUsuario";
import AdminTimewall from "@/components/latambucks/AdminTimewall";
import { Shield, Loader2, Check, X, Inbox, Megaphone, FileCheck2 } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";

export default function AdminTab() {
  const { t } = useI18n();
  const { token } = useLatamBucks();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [comment, setComment] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const [camp, setCamp] = useState([]);
  const [campLoading, setCampLoading] = useState(true);
  const [campBusy, setCampBusy] = useState(null);
  const [campErr, setCampErr] = useState("");

  // Auto-aprobación de pruebas vencidas (>48h). Ya no se dispara solo al
  // abrir el panel (evita escrituras masivas implícitas en cada montaje);
  // ahora es una acción explícita del admin con confirmación y feedback.
  // El guard anti-doble de la RPC (UPDATE ... WHERE estado='pendiente' +
  // IF NOT FOUND) garantiza que aunque se ejecute varias veces, nunca
  // acredite saldo dos veces a la misma prueba.
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [autoErr, setAutoErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingRetiros(token);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadCamp = useCallback(async () => {
    setCampLoading(true);
    try {
      const data = await fetchPendingCampanas(token);
      setCamp(Array.isArray(data) ? data : []);
    } catch {
      setCamp([]);
    } finally {
      setCampLoading(false);
    }
  }, [token]);

useEffect(() => {
    load();
    loadCamp();
  }, [load, loadCamp, token]);

  // Ejecuta el barrido de tareas vencidas de forma explícita. El cron
  // (pg_cron 'auto-aprobar-tareas-vencidas', cada hora) ya lo corre de
  // forma programada; este botón es para forzarlo a demanda, con feedback
  // visible de cuántas pruebas aprobó y campañas reintegró.
  const runAutoAprobar = async () => {
    setErr("");
    setAutoErr("");
    setAutoBusy(true);
    setAutoResult(null);
    try {
      const res = await rpcAutoAprobarVencidas(token);
      setAutoResult(res || { aprobadas: 0, reintegradas: 0 });
      // Refrescar la lista de retiros/campañas por si cambió saldo/estado
      load();
      loadCamp();
    } catch (e) {
      setAutoErr(e.message || t("adm.auto.err"));
    } finally {
      setAutoBusy(false);
    }
  };

  const markPaid = async (id) => {
    setErr("");
    setBusyId(id);
    try {
      await patchRetiro(token, id, { estado: "procesado" });
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e.message || t("adm.err.procesar"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async (id) => {
    setErr("");
    setBusyId(id);
    try {
      await rpcRechazarRetiro(token, id, comment.trim() || t("adm.rejectDefault"));
      setRows((r) => r.filter((x) => x.id !== id));
      setRejectId(null);
      setComment("");
    } catch (e) {
      setErr(e.message || t("adm.err.rechazar"));
    } finally {
      setBusyId(null);
    }
  };

  const aprobarCamp = async (id) => {
    setCampErr("");
    setCampBusy(id);
    try {
      await patchCampana(token, id, { estado_pago: "aprobado", activa: true });
      setCamp((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      setCampErr(e.message || t("adm.err.aprobarCamp"));
    } finally {
      setCampBusy(null);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-4">
      <header className="flex items-center gap-2 pt-1">
        <Icon3D name="shield" className="h-9 w-9" />
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.admin.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("tabs.admin.sub")}</p>
        </div>
      </header>

      {/* Auto-aprobación de vencidas — acción explícita (no automática) */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Icon3D name="surveys" className="mt-0.5 h-7 w-7" />
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              {t("adm.auto.title")}
            </h3>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t("adm.auto.desc")}
              <span className="text-emerald-400/80">{t("adm.auto.note")}</span>
            </p>
          </div>
        </div>

        {autoResult && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            {t("adm.auto.done", {
              a: Number(autoResult.aprobadas || 0),
              r: Number(autoResult.reintegradas || 0),
            })}
          </div>
        )}
        {autoErr && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{autoErr}</p>
        )}

        <button
          onClick={runAutoAprobar}
          disabled={autoBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
        >
          {autoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
          {autoBusy ? t("adm.auto.running") : t("adm.auto.run")}
        </button>
      </section>

      {/* Campañas pendientes de aprobación */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon3D name="megaphone" className="h-7 w-7" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            {t("adm.camp.title")}
          </h3>
        </div>

        {campErr && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{campErr}</p>
        )}

        {campLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : camp.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-8 text-center">
            <Inbox className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t("adm.camp.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {camp.map((c) => {
              const email = c.anunciante_email ?? "—";
              const monto = c.monto_invertido_ars ?? 0;
              const link = c.enlace_url ?? "—";
              const titulo = c.titulo ?? t("adm.camp.default");
              const puntos = c.puntos_recompensa ?? 0;
              const visitas = c.visitas_compradas ?? 0;
              const esInternacional = c.moneda === "USD";
              const ganancia = Number(c.ganancia_plataforma ?? 0);
              return (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{email}</p>
                      {esInternacional && (
                        <p className="truncate text-[11px] text-sky-400">{t("adm.camp.intl")}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                        esInternacional
                          ? "bg-sky-500/10 text-sky-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      ${monto.toLocaleString("es")} {esInternacional ? "USD" : "ARS"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <Detail label={t("adm.camp.link")} value={link} mono />
                    {esInternacional ? (
                      <Detail label={t("adm.camp.usd")} value={`$${monto.toLocaleString("es")} USD`} />
                    ) : (
                      <>
                        <Detail label={t("adm.camp.titulo")} value={titulo} />
                        <Detail label={t("adm.camp.puntos")} value={`+${puntos}`} />
                        <Detail label={t("adm.camp.visitas")} value={visitas.toLocaleString("es")} />
                      </>
                    )}
                    <Detail
                      label={t("adm.camp.ganancia")}
                      value={
                        esInternacional
                          ? `${ganancia.toLocaleString("es")} USD`
                          : `$${ganancia.toLocaleString("es")}`
                      }
                    />
                    {c.instrucciones && (
                      <div className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/10 p-2">
                        <p className="mb-0.5 text-[10px] font-semibold text-violet-400">{t("adm.camp.instr")}</p>
                        <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground">
                          {c.instrucciones}
                        </p>
                      </div>
                    )}
                    {c.comprobante_pago_url && (
                      <a
                        href={c.comprobante_pago_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        {t("adm.camp.comprobante")}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => aprobarCamp(c.id)}
                    disabled={campBusy === c.id}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
                  >
                    {campBusy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {t("adm.camp.aprobar")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Avisos del sistema */}
      <AdminAvisos />

      {/* Avisos individuales a usuarios */}
      <AdminAvisosUsuario />

      {/* Toggle TimeWall (modo Próximamente) */}
      <AdminTimewall />

      {/* Disputas pendientes */}
      <AdminRecargasPaypal />

      <AdminDisputas />

      {/* Solicitudes de retiro pendientes */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          {t("adm.ret.title")}
        </h3>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("adm.ret.desc")}
        </p>

        {err && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("adm.ret.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const perfilEmail = r.perfiles?.email || "—";
              const perfilPais = r.perfiles?.pais || "—";
              const metodoLabel =
                r.metodo_pago === "payoneer" ? "Payoneer"
                : r.metodo_pago === "airtm" ? "Airtm"
                : r.metodo_pago === "paypal" ? "PayPal"
                : (r.metodo_pago || "—");
              const labelDestino = t("adm.ret.correo", { m: metodoLabel });
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{perfilEmail}</p>
                      <p className="text-[11px] text-muted-foreground">{perfilPais}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-orange-500/10 px-2.5 py-1 text-sm font-bold text-orange-400">
                      {r.puntos_solicitados?.toLocaleString("es") ?? 0} Pts
                    </span>
                  </div>

                  <div className="mt-2 rounded-lg bg-background/50 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">{t("adm.ret.equiv")}</span>
                    <span className="font-semibold text-orange-400">
                      ${((r.puntos_solicitados ?? 0) / 1000).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <Detail
                      label={t("adm.ret.metodo")}
                      value={metodoLabel}
                    />
                    <Detail
                      label={labelDestino}
                      value={r.detalles_pago || "—"}
                      mono
                    />
                    <Detail label={t("adm.ret.titular")} value={r.titular_nombre || "—"} />
                  </div>

                  {rejectId === r.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t("adm.ret.commentPh")}
                        rows={2}
                        className="lb-input resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmReject(r.id)}
                          disabled={busyId === r.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2.5 text-sm font-medium text-white transition hover:bg-rose-400 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          {t("adm.ret.confirmReject")}
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setComment("");
                          }}
                          className="rounded-xl border border-border px-3 text-sm text-muted-foreground"
                        >
                          {t("adm.ret.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => markPaid(r.id)}
                        disabled={busyId === r.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
                      >
                        {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {t("adm.ret.markPaid")}
                      </button>
                      <button
                        onClick={() => setRejectId(r.id)}
                        disabled={busyId === r.id}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-60"
                      >
                        <X className="h-4 w-4" /> {t("adm.ret.reject")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`truncate text-right font-medium text-foreground ${mono ? "font-mono text-[11px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
