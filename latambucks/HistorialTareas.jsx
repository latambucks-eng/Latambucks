import React, { useState, useEffect, useRef } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchHistorialPruebas, iniciarDisputa, getServerTimeOffset } from "@/lib/supabaseClient";
import {
  History,
  Loader2,
  Inbox,
  Send,
  X,
  Gavel,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

const STATUS_CONFIG = {
  pendiente: { label: "historial.status.pendiente", cls: "bg-amber-500/10 text-amber-400", icon: Clock },
  aprobado: { label: "historial.status.aprobado", cls: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  rechazado: { label: "historial.status.rechazado", cls: "bg-rose-500/10 text-rose-400", icon: XCircle },
  en_disputa: { label: "historial.status.disputa", cls: "bg-violet-500/10 text-violet-400", icon: AlertCircle },
};

export default function HistorialTareas() {
  const { token, user } = useLatamBucks();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [appealId, setAppealId] = useState(null);
  const [appealText, setAppealText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Offset cliente→servidor (ms). El RPC iniciar_disputa ya valida el límite
  // de 24hs server-side; esto solo alinea el botón "Apelar" con la hora del
  // servidor para que no se muestre/oculte según el reloj del cliente.
  const [timeOffset, setTimeOffset] = useState(0);
  const loadedOffset = useRef(false);
  useEffect(() => {
    if (loadedOffset.current) return;
    loadedOffset.current = true;
    getServerTimeOffset().then((off) => {
      if (typeof off === "number") setTimeOffset(off);
    });
  }, []);
  // Hora actual del servidor (ms) — fuente de verdad para el límite de apelación.
  const serverNow = Date.now() + timeOffset;

  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const rows = await fetchHistorialPruebas(token, user.id);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setErr(e.message || t("historial.err.load"));
    } finally {
      setLoading(false);
    }
  };

  // Carga automática al montar — sin desplegable.
  useEffect(() => {
    if (token && user?.id) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const sendAppeal = async (pruebaId) => {
    setErr("");
    if (!appealText.trim()) {
      setErr(t("historial.err.motivo"));
      return;
    }
    setSubmitting(true);
    try {
      await iniciarDisputa(token, pruebaId, appealText.trim());
      setItems((prev) =>
        prev.map((p) =>
          p.id === pruebaId
            ? { ...p, estado: "en_disputa", disputa_motivo: appealText.trim() }
            : p
        )
      );
      setAppealId(null);
      setAppealText("");
    } catch (e) {
      setErr(e.message || t("historial.err.send"));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppeal = () => {
    setAppealId(null);
    setAppealText("");
    setErr("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-600/5 text-violet-400 ring-1 ring-violet-500/25">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{t("historial.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("historial.sub")}</p>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-10">
          <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
          <p className="mt-3 text-sm text-muted-foreground">{t("historial.loading")}</p>
        </div>
      )}

      {!loading && err && !appealId && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
          <p className="text-sm text-rose-400">{err}</p>
          <button
            onClick={cargar}
            className="mt-2 text-xs font-semibold text-rose-400 underline"
          >
            {t("historial.retry")}
          </button>
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Inbox className="h-7 w-7 text-violet-400/70" />
          </div>
          <p className="text-sm font-medium text-foreground">{t("historial.empty.title")}</p>
          <p className="text-xs text-muted-foreground">{t("historial.empty.sub")}</p>
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="space-y-3">
          {items.map((p) => {
            const camp = p.campanas_locales || {};
            const puntos = Number(camp.puntos_recompensa ?? 0);
            const status = STATUS_CONFIG[p.estado] || STATUS_CONFIG.pendiente;
            const StatusIcon = status.icon;
            const yaDisputado = !!p.disputa_motivo;
            const canAppeal = p.estado === "rechazado" && !yaDisputado && appealId !== p.id;
            const horasTranscurridas = p.creado_el
              ? (serverNow - new Date(p.creado_el).getTime()) / 3_600_000
              : 0;
            const puedeApelar = horasTranscurridas < 24;

            return (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-violet-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {camp.titulo || t("historial.fallbackTask")}
                    </p>
                    {puntos > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("historial.points", { puntos })}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${status.cls}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {t(status.label)}
                  </span>
                </div>

                {/* Motivo del rechazo del anunciante */}
                {p.estado === "rechazado" && p.rechazo_motivo && (
                  <div className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                    <p className="font-semibold">{t("historial.rejectReason")}</p>
                    <p className="mt-0.5 text-rose-400/80">{p.rechazo_motivo}</p>
                  </div>
                )}

                {/* Botón apelar — solo si está rechazada, dentro de 24hs y sin formulario abierto */}
                {canAppeal && puedeApelar && (
                  <button
                    onClick={() => {
                      setAppealId(p.id);
                      setAppealText("");
                      setErr("");
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/10 py-2 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/20"
                  >
                    <Gavel className="h-3.5 w-3.5" /> {t("historial.appeal")}
                  </button>
                )}

                {/* Disputa rechazada por el admin — no puede volver a apelar */}
                {p.estado === "rechazado" && yaDisputado && (
                  <div className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                    <p className="font-semibold">{t("historial.appealRejected")}</p>
                    <p className="mt-0.5 text-rose-400/70">{t("historial.appealRejectedSub")}</p>
                  </div>
                )}

                {/* Tiempo de apelación expirado */}
                {p.estado === "rechazado" && !yaDisputado && !puedeApelar && (
                  <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
                    {t("historial.expired")}
                  </p>
                )}

                {/* Formulario de disputa */}
                {appealId === p.id && (
                  <div className="mt-3 space-y-2 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                    <textarea
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      placeholder={t("historial.placeholder")}
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
                        onClick={() => sendAppeal(p.id)}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-500 py-2 text-xs font-medium text-white transition hover:bg-violet-400 disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {t("historial.send")}
                      </button>
                      <button
                        onClick={cancelAppeal}
                        className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 text-xs text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensaje de disputa enviada */}
                {p.estado === "en_disputa" && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-violet-500/10 px-3 py-2 text-xs text-violet-400">
                    <Gavel className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {t("historial.disputeSent")}
                      {p.disputa_motivo && (
                        <span className="mt-1 block text-violet-400/70">"{p.disputa_motivo}"</span>
                      )}
                    </span>
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