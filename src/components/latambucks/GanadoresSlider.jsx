import React, { useState, useEffect } from "react";
import { rpcGetGanadores } from "@/lib/supabaseClient";
import { useLatamBucks } from "@/lib/latambucksStore";
import { Loader2, Trophy, AlertTriangle } from "lucide-react";
import { Image } from "@/components/ui/image";
import WinnerCountryFlag from "@/components/latambucks/WinnerCountryFlag";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { walletIcon } from "@/lib/localAssets";

const WALLET_ICON_URL = walletIcon;

const PROVEEDOR_COLOR = {
  tarea_local: "text-violet-300",
  monoteg_video: "text-orange-300",
  caja_sorpresa: "text-amber-300",
  cpx_research: "text-sky-300",
  theoremreach: "text-emerald-300",
  timewall: "text-rose-300",
  bono_bienvenida: "text-orange-300",
};

// Tira de ganadores en vivo: una sola línea ancha que se desplaza sola
// (marquee) mostrando todos los ganadores con su información. Consulta la RPC
// get_ganadores_recientes (SECURITY DEFINER, sin créditos de integración) y
// conserva los estados de carga, vacío y error en la misma línea.
export default function GanadoresSlider() {
  const { token, perfil } = useLatamBucks();
  const { t } = useI18n();
  const [ganadores, setGanadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    const cargarGanadores = () => rpcGetGanadores(token)
      .then((res) => {
        if (cancelled) return;
        const g = Array.isArray(res?.ganadores) ? res.ganadores : [];
        setGanadores(g);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    cargarGanadores();
    const refresh = setInterval(cargarGanadores, 30000);
    return () => { cancelled = true; clearInterval(refresh); };
  }, [token, perfil?.pais]);

  // Pocos ganadores = la tira quedaría corta y con huecos en el bucle, así que
  // se repite la lista para que el desplazamiento sea continuo.
  const items = ganadores.length > 0 && ganadores.length < 5
    ? [...ganadores, ...ganadores, ...ganadores]
    : ganadores;

  return (
    <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-orange-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-violet-500/10 py-1.5 pl-1.5 pr-1">
      {/* Etiqueta fija a la izquierda */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 rounded-full bg-background px-2 py-1 ring-1 ring-orange-500/25">
        <Image
          src={WALLET_ICON_URL}
          alt="Ganadores en vivo"
          fittingType="fill"
          className="h-5 w-5 rounded"
        />
        <span className="text-[11px] font-bold tracking-wide text-amber-200">{t("ganadores.live")}</span>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" /> {t("ganadores.loading")}
          </p>
        ) : error ? (
          <p className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-300" />
            {t("ganadores.error")}
          </p>
        ) : ganadores.length === 0 ? (
          <p className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            {t("ganadores.empty")}
            <span className="font-semibold text-amber-200">{t("ganadores.emptyCta")}</span>
          </p>
        ) : (
          // La velocidad se ajusta a la cantidad de ganadores: cada uno
          // tarda ~7s en pasar, así siempre se alcanza a leer la info.
          <div
            className="flex w-max animate-marquee items-center"
            style={{ animationDuration: `${Math.max(45, items.length * 7)}s` }}
          >
            {[0, 1].map((copia) => (
              <div key={copia} className="flex items-center">
                {items.map((g, i) => (
                  <GanadorItem key={`${copia}-${i}`} g={g} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GanadorItem({ g }) {
  const { t } = useI18n();
  const color = PROVEEDOR_COLOR[g.proveedor] || "text-orange-300";
  const puntos = Number(g.puntos || 0).toLocaleString("es");
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap pr-7 text-xs">
      <WinnerCountryFlag country={g.pais} />
      <span className="font-medium text-foreground/90">{t("ganadores.user", { id: g.userId })}</span>
      <span className="font-display font-bold text-amber-300">+{puntos}</span>
      <span className="text-muted-foreground">pts</span>
      <span className={`font-semibold ${color}`}>{g.proveedor}</span>
    </span>
  );
}