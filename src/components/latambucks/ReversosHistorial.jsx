import React, { useEffect, useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchAvisosReversos } from "@/lib/supabaseClient";
import { REVERSO_PROVIDER_LABELS } from "@/lib/reversosInfo";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { RotateCcw } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Aviso dentro del historial: si el proveedor revirtió tareas, se muestran
// acá con monto y fecha. Si no hubo reversos, no se renderiza nada.
export default function ReversosHistorial() {
  const { token, user } = useLatamBucks();
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!token || !user?.id) return;
    fetchAvisosReversos(token, user.id)
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch(() => setItems([]));
  }, [token, user?.id]);

  if (items.length === 0) return null;

  const total = items.reduce(
    (sum, p) => sum + Math.abs(Number(p.puntos_ganados ?? 0)),
    0
  );

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4 shrink-0 text-amber-400" />
        <p className="font-display text-sm font-bold text-foreground">
          {t("historial.reversos.title")}
        </p>
        <span className="ml-auto shrink-0 text-xs font-bold text-rose-400">
          −{total} pts
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t("historial.reversos.sub")}
      </p>
      <div className="mt-3 space-y-1.5">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-background/40 px-3 py-2"
          >
            <span className="truncate text-xs font-semibold text-foreground">
              {REVERSO_PROVIDER_LABELS[p.proveedor] || p.proveedor || t("avisos.proveedor")}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatDate(p.creado_el)}
            </span>
            <span className="shrink-0 text-xs font-bold text-rose-400">
              −{Math.abs(Number(p.puntos_ganados ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}