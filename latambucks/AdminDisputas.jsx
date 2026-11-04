import React, { useState, useEffect, useCallback } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import {
  fetchPendingDisputas,
  aprobarPrueba,
  rechazarPrueba,
} from "@/lib/supabaseClient";
import { Gavel, Loader2, Check, X, Inbox, RefreshCw } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function AdminDisputas() {
  const { token } = useLatamBucks();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingDisputas(token);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Error al cargar disputas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const favorUsuario = async (prueba) => {
    setErr("");
    setBusy(prueba.id);
    try {
      // aprobarPrueba hace todo server-side: marca aprobado, recalcula visitas,
      // inserta historial, acredita saldo y comisión del 10% al patrocinador.
      await aprobarPrueba(token, prueba);
      setRows((r) => r.filter((x) => x.id !== prueba.id));
    } catch (e) {
      setErr(e.message || "Error al aprobar");
    } finally {
      setBusy(null);
    }
  };

  const mantenerRechazo = async (pruebaId) => {
    setErr("");
    setBusy(pruebaId);
    try {
      await rechazarPrueba(token, pruebaId);
      setRows((r) => r.filter((x) => x.id !== pruebaId));
    } catch (e) {
      setErr(e.message || "Error al rechazar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-violet-400" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            Disputas Pendientes
          </h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {err && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-8 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No hay disputas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const camp = p.campanas_locales || {};
            const perfil = p.perfiles || {};
            const puntos = Number(camp.puntos_recompensa ?? 0);
            return (
              <div key={p.id} className="rounded-2xl border border-violet-500/30 bg-card p-4">
                {/* Título + puntos */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {camp.titulo || "Tarea"}
                  </p>
                  <span className="shrink-0 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400">
                    +{puntos} Pts
                  </span>
                </div>

                {/* Datos */}
                <div className="mb-3 space-y-1.5 text-xs">
                  <Detail label="Usuario" value={perfil.email || p.usuario_id || "—"} />
                  <Detail label="Anunciante" value={camp.anunciante_email || "—"} />
                </div>

                {camp.instrucciones && (
                  <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
                    <p className="mb-1 text-xs font-semibold text-violet-400">📋 Instrucciones de la tarea</p>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                      {camp.instrucciones}
                    </p>
                  </div>
                )}

                {/* Captura */}
                {p.url_captura && (
                  <a
                    href={p.url_captura}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 block overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={p.url_captura}
                      alt="Captura de prueba"
                      className="max-h-56 w-full"
                      fittingType="fit"
                    />
                  </a>
                )}

                {/* Texto de prueba original */}
                {p.texto_prueba && (
                  <div className="mb-3 rounded-xl border border-border bg-background/40 p-3">
                    <p className="mb-1 text-[11px] text-muted-foreground">Texto de prueba</p>
                    <p className="text-sm text-foreground">{p.texto_prueba}</p>
                  </div>
                )}

                {/* Motivo de disputa */}
                <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                  <p className="mb-1 flex items-center gap-1 text-[11px] text-violet-400">
                    <Gavel className="h-3 w-3" /> Motivo de disputa
                  </p>
                  <p className="text-sm text-foreground">{p.disputa_motivo || "—"}</p>
                </div>

                {/* Botones de resolución */}
                <div className="flex gap-2">
                  <button
                    onClick={() => favorUsuario(p)}
                    disabled={busy === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-60"
                  >
                    {busy === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Dar razón al Usuario
                  </button>
                  <button
                    onClick={() => mantenerRechazo(p.id)}
                    disabled={busy === p.id}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Mantener Rechazo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}