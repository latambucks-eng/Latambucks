import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Loader2, Lock } from "lucide-react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import {
  apuestaMaximaPermitida,
  fetchWheelStatus,
  obtenerConfigRuleta,
  spinMultiplierWheel,
} from "@/lib/multiplierWheel";
import WheelDisc3D from "@/components/latambucks/WheelDisc3D";
import RuletaComoFunciona from "@/components/latambucks/RuletaComoFunciona";
import { MULTIPLICAR, fill } from "@/lib/i18n/content/multiplicar";

// Porciones de la rueda con su tamaño real: 45% / 30% / 20% / 5%.
// `mid` es el ángulo (desde arriba, sentido horario) donde centra cada premio.
// El tamaño de cada sector mantiene la probabilidad que aplica el servidor.
const SEGMENTS = [
  { mult: 1.1, mid: 81, from: 0, to: 162, label: "x1.1", accent: "#d4af37", glow: "#00ff9f" },
  { mult: 1.0, mid: 216, from: 162, to: 270, label: "x1.0", accent: "#2c3e50", glow: "#ffaa00" },
  { mult: 0.5, mid: 306, from: 270, to: 342, label: "x0.5", accent: "#d4af37", glow: "#9a6534" },
  { mult: 1.5, mid: 351, from: 342, to: 360, label: "x1.5", accent: "#2c3e50", glow: "#00ff9f" },
];

// Chispas del giro y confeti del premio mayor.
const SPARKS = [
  { top: "1%", left: "4%", delay: "0s" },
  { top: "0%", right: "6%", delay: "0.45s" },
  { bottom: "3%", left: "1%", delay: "0.85s" },
  { bottom: "1%", right: "3%", delay: "0.25s" },
];
const CONFETTI = [
  { bx: "-92px", by: "-54px", br: "210deg", color: "#f97316", delay: "0s" },
  { bx: "-58px", by: "-86px", br: "150deg", color: "#a855f7", delay: "0.05s" },
  { bx: "-20px", by: "-96px", br: "90deg", color: "#fde68a", delay: "0.1s" },
  { bx: "22px", by: "-92px", br: "-60deg", color: "#0ea5e9", delay: "0.02s" },
  { bx: "64px", by: "-70px", br: "180deg", color: "#f43f5e", delay: "0.08s" },
  { bx: "94px", by: "-30px", br: "240deg", color: "#f97316", delay: "0.12s" },
  { bx: "88px", by: "28px", br: "300deg", color: "#a855f7", delay: "0.04s" },
  { bx: "54px", by: "74px", br: "120deg", color: "#fde68a", delay: "0.09s" },
  { bx: "8px", by: "92px", br: "60deg", color: "#0ea5e9", delay: "0.14s" },
  { bx: "-40px", by: "80px", br: "-140deg", color: "#f43f5e", delay: "0.06s" },
  { bx: "-84px", by: "40px", br: "200deg", color: "#fde68a", delay: "0.11s" },
  { bx: "-96px", by: "-8px", br: "270deg", color: "#a855f7", delay: "0.03s" },
];

export default function MultiplierWheel() {
  const { token, user, refreshPerfil } = useLatamBucks();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const c = (MULTIPLICAR[lang] || MULTIPLICAR.es).wheel;

  const [status, setStatus] = useState(null);
  const [bet, setBet] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchWheelStatus(token);
      if (!res) return;
      setStatus(res);
      const max = apuestaMaximaPermitida(res);
      setBet((prev) =>
        prev > 0 ? Math.max(0, Math.min(prev, max)) : Math.max(0, Math.min(max, Math.floor(max * 0.25)))
      );
    } catch (e) {
      setError(e.message || c.loadError);
    }
  }, [token, c.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  // Valores del país del usuario (los entrega el servidor; el espejo local solo
  // cubre el primer render antes de que llegue el estado).
  const cfg = obtenerConfigRuleta(status?.pais);
  const minEncuesta = Number(status?.min_encuesta ?? cfg.min_encuesta);
  const apuestaMaxTier = Number(status?.apuesta_max ?? cfg.apuesta_max);
  const topeNeto = Number(status?.tope_neto ?? cfg.tope_neto);
  const saldoEnc = Number(status?.saldo_encuestas || 0);
  const apuestaMaxima = apuestaMaximaPermitida(status);
  const girosDisponibles = Number(status?.giros_disponibles ?? 0);
  const girosUsados = Number(status?.giros_usados ?? 0);
  const neto24h = Number(status?.neto_24h || 0);

  // Estado del botón principal: 4 giros en 24 h, giro pendiente de conversión,
  // saldo insuficiente o giro habilitado.
  const estadoBoton =
    girosUsados >= 4
      ? "limite"
      : girosDisponibles <= 0
        ? "sin_giros"
        : apuestaMaxima < 1
          ? "sin_saldo"
          : "girar";

  const puedeGirar =
    Boolean(status) && estadoBoton === "girar" && !status.motivo && bet >= 1 && bet <= apuestaMaxima && !spinning;

  const bloqueo = status?.motivo
    ? fill(c.blocked[status.motivo] || "", { min: minEncuesta, cap: topeNeto, max: apuestaMaxTier })
    : "";

  const celebrate = Boolean(result?.ok && result.resultado === "jackpot");

  const setQuickBet = (pct) => {
    const value = pct === "min" ? Math.min(1, apuestaMaxima) : Math.floor(apuestaMaxima * pct);
    setBet(Math.max(0, Math.min(value, apuestaMaxima)));
  };

  const spin = async () => {
    if (!puedeGirar) return;
    setSpinning(true);
    setError("");
    setResult(null);
    // Giro largo mientras el servidor decide.
    setRotation((r) => r + 1080 + Math.floor(Math.random() * 360));
    try {
      const res = await spinMultiplierWheel(token, bet);
      if (res?.ok) {
        const seg = SEGMENTS.find((s) => s.mult === Number(res.multiplicador)) || SEGMENTS[0];
        setRotation((r) => r + 1440 + ((360 - seg.mid) - (r % 360) + 360) % 360);
        setResult(res);
        setStatus(res);
        setBet((prev) => Math.max(0, Math.min(prev, apuestaMaximaPermitida(res))));
      } else if (res) {
        setStatus(res);
      }
    } catch (e) {
      setError(e.message || c.genericError);
    } finally {
      setSpinning(false);
      if (token && user?.id) refreshPerfil(token, user.id).catch(() => {});
    }
  };

  // Sin giros disponibles el botón lleva a las encuestas y muros externos.
  const onMainClick = () => {
    if (estadoBoton === "sin_giros") {
      navigate("/encuestas");
      return;
    }
    spin();
  };

  const botonActivo = Boolean(status) && !spinning && (estadoBoton === "sin_giros" || puedeGirar);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-b from-violet-950/40 via-card to-card p-4">
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      {/* Giros disponibles en la ventana móvil de 24 h */}
      <div className="relative">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{fill(c.spinsAvailable, { n: girosDisponibles })}</span>
          <span className="font-mono text-orange-400">{fill(c.spinsUsed, { n: girosUsados })}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < girosDisponibles
                  ? "bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 shadow-[0_0_10px_rgba(249,115,22,0.45)]"
                  : "bg-background/70 ring-1 ring-inset ring-white/5"
              }`}
            />
          ))}
        </div>
        <p
          className={`mt-1.5 text-[11px] font-medium ${
            girosDisponibles > 0 ? "text-emerald-400/90" : "text-amber-300"
          }`}
        >
          {girosDisponibles > 0 ? c.progressDone : fill(c.unlockHint, { min: minEncuesta })}
        </p>
      </div>

      {/* Rueda 3D real (three.js) */}
      <div className="lb-wheel-stage relative mx-auto mt-6 h-64 w-64" data-spinning={spinning ? "true" : "false"}>
        <span className="pointer-events-none absolute -inset-3 rounded-full bg-[radial-gradient(circle_at_50%_42%,#1b1e23_0%,#0c0d10_72%)]" />
        <span className="pointer-events-none absolute inset-8 rounded-full bg-amber-500/15 blur-2xl" />
        <span className="lb-wheel-shadow" />

        <WheelDisc3D
          rotation={rotation}
          spinning={spinning}
          segments={SEGMENTS}
          className="absolute inset-0 z-10 h-full w-full"
        />

        {spinning &&
          SPARKS.map((s) => (
            <span
              key={s.delay}
              className="lb-wheel-spark"
              style={{
                top: s.top,
                bottom: s.bottom,
                left: s.left,
                right: s.right,
                animationDelay: s.delay,
              }}
            >
              ✦
            </span>
          ))}

        {celebrate && (
          <div className="lb-wheel-burst">
            {CONFETTI.map((c2) => (
              <i
                key={c2.bx + c2.by}
                style={{
                  "--bx": c2.bx,
                  "--by": c2.by,
                  "--br": c2.br,
                  background: c2.color,
                  animationDelay: c2.delay,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <RuletaComoFunciona
          copy={c}
          minEncuesta={minEncuesta}
          maxApuesta={apuestaMaxTier}
          topeNeto={topeNeto}
        />
      </div>

      {/* Apuesta */}
      <div className="relative mt-4 rounded-2xl border border-border bg-background/50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.bet}</p>
          <p className="text-[11px] text-muted-foreground">
            {c.balance}:{" "}
            <span className="font-mono font-semibold text-cyan-300">
              {saldoEnc.toLocaleString("es", { maximumFractionDigits: 2 })} pts
            </span>
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={apuestaMaxima}
            value={bet || ""}
            onChange={(e) => setBet(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="lb-input flex-1 text-center font-mono text-base"
            placeholder="0"
          />
          <button
            type="button"
            onClick={() => setQuickBet("min")}
            className="rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            {c.quickMin}
          </button>
          <button
            type="button"
            onClick={() => setQuickBet(0.5)}
            className="rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            {c.quick50}
          </button>
          <button
            type="button"
            onClick={() => setQuickBet(1)}
            className="rounded-xl border border-orange-500/40 bg-orange-500/15 px-2.5 py-2 text-xs font-bold text-orange-300 transition hover:bg-orange-500/25"
          >
            {c.quickMax}
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          {fill(c.maxBet, { max: apuestaMaxima.toLocaleString("es") })} · {fill(c.limits, { cap: topeNeto.toLocaleString("es") })}
        </p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{fill(c.netToday, { neto: neto24h })}</p>
      </div>

      {/* Botón girar: disco dorado redondo, con el mismo metal del aro de la ruleta.
          La etiqueta es fija ("Lucky Wheel") y el motivo de bloqueo se muestra abajo. */}
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onMainClick}
          disabled={!botonActivo}
          aria-label={c.spin}
          className="relative flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full border-[3px] border-[#d4af37] bg-[radial-gradient(circle_at_34%_26%,#fdfd96_0%,#e3c65a_26%,#d4af37_52%,#a6892a_80%,#6f5a18_100%)] font-display text-sm font-black uppercase leading-[1.15] tracking-[0.16em] text-[#16202b] shadow-[inset_0_2px_4px_rgba(255,255,255,0.75),inset_0_-6px_14px_rgba(80,60,10,0.55),0_0_0_5px_rgba(212,175,55,0.22),0_0_0_9px_rgba(26,36,47,0.75),0_18px_32px_-14px_rgba(0,0,0,0.95),0_0_32px_-6px_rgba(212,175,55,0.85)] transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 disabled:saturate-50"
        >
          {spinning ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#16202b]/80" />
          ) : estadoBoton === "girar" ? (
            <Coins className="h-4 w-4 text-[#16202b]/80" />
          ) : (
            <Lock className="h-4 w-4 text-[#16202b]/80" />
          )}
          <span className="mt-0.5">Lucky</span>
          <span>Wheel</span>
        </button>
      </div>

      {result?.ok && result.resultado === "jackpot" && (
        <p className="lb-result-pop mt-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-center font-display text-sm font-bold text-violet-200 shadow-[0_0_26px_-10px_rgba(168,85,247,0.9)]">
          {c.jackpot}
        </p>
      )}
      {result?.ok && (
        <p className="mt-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-300">
          {fill(c.result, {
            bet: Number(result.apuesta).toLocaleString("es"),
            mult: result.multiplicador,
            // Lo que realmente cambia en el saldo: premio − apuesta (puede ser negativo).
            neto: `${Number(result.ganancia_neta) >= 0 ? "+" : "−"}${Math.abs(
              Number(result.ganancia_neta) || 0
            ).toLocaleString("es")}`,
          })}
        </p>
      )}
      {bloqueo && !result?.ok && (
        <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-[11px] text-amber-300">{bloqueo}</p>
      )}
      {error && (
        <p className="mt-2 rounded-xl bg-rose-500/10 px-3 py-2 text-center text-[11px] text-rose-400">{error}</p>
      )}
    </section>
  );
}
