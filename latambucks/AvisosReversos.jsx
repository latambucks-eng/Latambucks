import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchAvisosReversos, fetchAvisosUsuario } from "@/lib/supabaseClient";
import { Bell, Loader2, Inbox, RotateCcw, Megaphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Nombres legibles por proveedor.
const PROVIDER_LABELS = {
  cpx_research: "CPX Research",
  theoremreach: "TheoremReach",
  timewall: "TimeWall",
  cpagrip: "CPAGrip",
  cpalead: "CPALead",
  monetag_video: "Monetag (Videos)",
  monetag_smartlink: "Monetag (SmartLink)",
};

// Explicación genérica del reverso según el proveedor.
const PROVIDER_REASONS = {
  cpx_research: "avisos.motivo.cpx",
  theoremreach: "avisos.motivo.theoremreach",
  timewall: "avisos.motivo.timewall",
  default: "avisos.motivo.default",
};

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AvisosReversos() {
  const { token, user } = useLatamBucks();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [avisosAdmin, setAvisosAdmin] = useState([]);
  const [err, setErr] = useState("");

  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const [reversos, avisos] = await Promise.all([
        fetchAvisosReversos(token, user.id),
        fetchAvisosUsuario(token, user.id),
      ]);
      setItems(Array.isArray(reversos) ? reversos : []);
      setAvisosAdmin(Array.isArray(avisos) ? avisos : []);
    } catch (e) {
      setErr(e.message || t("avisos.err.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.id) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/5 text-amber-400 ring-1 ring-amber-500/25">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            {t("avisos.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("avisos.sub")}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-10">
          <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
          <p className="mt-3 text-sm text-muted-foreground">{t("avisos.loading")}</p>
        </div>
      )}

      {!loading && err && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
          <p className="text-sm text-rose-400">{err}</p>
          <button
            onClick={cargar}
            className="mt-2 text-xs font-semibold text-rose-400 underline"
          >
            {t("avisos.retry")}
          </button>
        </div>
      )}

      {!loading && !err && items.length === 0 && avisosAdmin.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Inbox className="h-7 w-7 text-emerald-400/70" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {t("avisos.empty.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("avisos.empty.sub")}
          </p>
        </div>
      )}

      {/* Avisos del administrador */}
      {!loading && !err && avisosAdmin.length > 0 && (
        <div className="space-y-3">
          {avisosAdmin.map((a) => {
            const tipoColor = {
              info: "text-sky-400", success: "text-emerald-400",
              warning: "text-amber-400", error: "text-rose-400",
            }[a.tipo] || "text-sky-400";
            return (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${tipoColor}`}>
                        {t(`avisos.tipo.${a.tipo}`)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">Admin</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {a.titulo}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {a.mensaje}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground/60">
                      {formatDate(a.creado_el)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reversos de proveedores */}
      {!loading && !err && items.length > 0 && (
        <div className="space-y-3">
          {items.map((p) => {
            const proveedorLabel =
              PROVIDER_LABELS[p.proveedor] || p.proveedor || t("avisos.proveedor");
            const motivo =
              t(PROVIDER_REASONS[p.proveedor] || PROVIDER_REASONS.default);
            const puntos = Math.abs(Number(p.puntos_ganados ?? 0));

            return (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {proveedorLabel}
                      </p>
                      <span className="shrink-0 text-sm font-bold text-rose-400">
                        −{puntos} pts
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {motivo}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground/60">
                      {formatDate(p.creado_el)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}