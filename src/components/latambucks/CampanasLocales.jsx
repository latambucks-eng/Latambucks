import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import {
  fetchCampanasLocales,
  fetchPruebasByUsuario,
  uploadCapturaToStorage,
  insertPruebaTarea,
} from "@/lib/supabaseClient";
import { compressImage } from "@/lib/imageCompress";
import {
  ChevronDown,
  Loader2,
  ExternalLink,
  Inbox,
  Upload,
  CheckCircle2,
  Send,
  X,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function CampanasLocales() {
  const { token, user, perfil, exchangeRate } = useLatamBucks();
  const { t } = useI18n();
  const esArgentina = perfil?.pais === "Argentina";
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [texto, setTexto] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [doneIds, setDoneIds] = useState(new Set());
  const [descOpenIds, setDescOpenIds] = useState(new Set());

  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const [rows, pruebas] = await Promise.all([
        fetchCampanasLocales(token),
        fetchPruebasByUsuario(token, user.id),
      ]);
      const enviadas = new Set(
        (Array.isArray(pruebas) ? pruebas : []).map((p) => p.campana_id)
      );
      const disponibles = (Array.isArray(rows) ? rows : []).filter(
        (c) =>
          !enviadas.has(c.id) &&
          (c.visitas_actuales ?? 0) < (c.visitas_compradas ?? 0) &&
          c.anunciante_email !== user.email
      );
      setItems(disponibles);
    } catch (e) {
      setErr(e.message || t("campanas.err.load"));
    } finally {
      setLoading(false);
    }
  };

  // Carga automática al montar — sin desplegable, la lista se ve directo.
  useEffect(() => {
    if (token && user?.id) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const comenzar = (item) => {
    window.open(item.enlace_url, "_blank", "noopener,noreferrer");
    setExpandedId(item.id);
    setTexto("");
    setFile(null);
    setErr("");
  };

  const cancelar = () => {
    setExpandedId(null);
    setTexto("");
    setFile(null);
    setErr("");
  };

  const enviar = async (item) => {
    setErr("");
    if (!texto.trim()) {
      setErr(t("campanas.err.text"));
      return;
    }
    if (!file) {
      setErr(t("campanas.err.file"));
      return;
    }
    setSubmitting(true);
    try {
      const compressed = await compressImage(file);
      const capturaUrl = await uploadCapturaToStorage(token, compressed, user.id);
      await insertPruebaTarea(token, {
        campana_id: item.id,
        usuario_id: user.id,
        texto_prueba: texto.trim(),
        url_captura: capturaUrl,
        estado: "pendiente",
      });
      setItems((prev) => prev.filter((c) => c.id !== item.id));
      setDoneIds((prev) => new Set(prev).add(item.id));
      setExpandedId(null);
      setTexto("");
      setFile(null);
    } catch (e) {
      setErr(e.message || t("campanas.err.send"));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPuntos = items.reduce((sum, it) => sum + Number(it.puntos_recompensa ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-violet-600/5 p-3.5">
          <div className="flex items-center gap-1.5 text-violet-400">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium text-violet-300/80">{t("campanas.available")}</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {loading ? "…" : items.length}
          </p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/15 to-orange-600/5 p-3.5">
          <div className="flex items-center gap-1.5 text-orange-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium text-orange-300/80">{t("campanas.totalPts")}</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {loading ? "…" : totalPuntos.toLocaleString("es")}
          </p>
        </div>
      </div>

      {/* Estados de carga / error / vacío */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-10">
          <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
          <p className="mt-3 text-sm text-muted-foreground">{t("campanas.loading")}</p>
        </div>
      )}

      {!loading && err && !expandedId && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
          <p className="text-sm text-rose-400">{err}</p>
          <button
            onClick={cargar}
            className="mt-2 text-xs font-semibold text-rose-400 underline"
          >
            {t("campanas.retry")}
          </button>
        </div>
      )}

      {!loading && !err && items.length === 0 && doneIds.size === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Inbox className="h-7 w-7 text-violet-400/70" />
          </div>
          <p className="text-sm font-medium text-foreground">{t("campanas.empty.title")}</p>
          <p className="max-w-[16rem] text-xs text-muted-foreground">
            {t("campanas.empty.sub")}
          </p>
        </div>
      )}

      {/* Lista de tarjetas de tareas */}
      {!loading && !err && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const puntos = Number(item.puntos_recompensa ?? 0);
            const usd = (puntos / 1000).toFixed(2);

            if (expandedId === item.id) {
              return (
                <div
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-background/40 p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.titulo}</p>
                      <a
                        href={item.enlace_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                      >
                        <ExternalLink className="h-3 w-3" /> {t("campanas.openTask")}
                      </a>
                    </div>
                    <button
                      onClick={cancelar}
                      className="rounded-lg p-1 text-muted-foreground transition hover:bg-background/60"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {item.instrucciones && (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-violet-400">
                        {t("campanas.instructions")}
                      </p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                        {item.instrucciones}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("campanas.proofLabel")}
                    </label>
                    <textarea
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      placeholder={t("campanas.proofPlaceholder")}
                      rows={2}
                      className="lb-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("campanas.screenshot")}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground transition hover:border-orange-500/40">
                      <Upload className="h-4 w-4 text-orange-400" />
                      <span className="truncate">
                        {file ? file.name : t("campanas.upload")}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  {err && (
                    <p className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">
                      {err}
                    </p>
                  )}

                  <button
                    onClick={() => enviar(item)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("campanas.send")}
                  </button>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-violet-500/40 hover:shadow-lg hover:shadow-black/30"
              >
                {/* Brillo decorativo superior */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-500/20" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <p className="truncate text-sm font-semibold text-foreground">{item.titulo}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-400">
                        {t("campanas.earn", { usd })}
                      </span>
                      {esArgentina && exchangeRate > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          ${Math.round(Number(usd) * exchangeRate)} ARS
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => comenzar(item)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3.5 py-2 text-xs font-bold text-orange-950 shadow-md shadow-orange-500/20 transition hover:from-orange-400 hover:to-orange-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {t("campanas.start")}
                  </button>
                </div>

                {item.instrucciones && (
                  <div className="relative mt-3">
                    <p
                      className={`whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground ${
                        descOpenIds.has(item.id) ? "" : "line-clamp-2"
                      }`}
                    >
                      {item.instrucciones}
                    </p>
                    {item.instrucciones.length > 100 && (
                      <button
                        onClick={() =>
                          setDescOpenIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          })
                        }
                        className="mt-1 flex items-center gap-0.5 text-xs font-medium text-violet-400 hover:text-violet-300"
                      >
                        <ChevronDown
                          className={`h-3 w-3 transition ${descOpenIds.has(item.id) ? "rotate-180" : ""}`}
                        />
                        {descOpenIds.has(item.id) ? t("campanas.readLess") : t("campanas.readMore")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tareas completadas */}
      {doneIds.size > 0 && (
        <div className="space-y-2">
          {Array.from(doneIds).map((id) => (
            <div
              key={id}
              className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-xs font-medium text-emerald-300">{t("campanas.sent")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}