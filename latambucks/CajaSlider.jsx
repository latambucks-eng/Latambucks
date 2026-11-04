import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import cajaRoja from "@/assets/caja-roja.png";
import cajaNaranja from "@/assets/caja-naranja.png";
import cajaTeal from "@/assets/caja-teal.png";

// ============================================================
// CajaSlider — Slider horizontal tipo ruleta de casino.
// 1. Las cajas se desplazan de forma continua e infinita al cargar.
// 2. Botón "¡Probar Suerte!" (o clic sobre el slider) detiene el giro.
// 3. Desaceleración suave (ease-out cúbico) durante ~3.5s.
// 4. Al detenerse, dispara onStop(boxIndex) con la caja seleccionada.
// ============================================================

const BOX_STYLES = [
  { border: "border-red-500/50", ring: "ring-red-500", icon: "text-red-400", shadow: "shadow-red-500/40" },
  { border: "border-orange-500/50", ring: "ring-orange-500", icon: "text-orange-400", shadow: "shadow-orange-500/40" },
  { border: "border-teal-500/50", ring: "ring-teal-500", icon: "text-teal-400", shadow: "shadow-teal-500/40" },
];

const BOX_IMAGES = [cajaRoja, cajaNaranja, cajaTeal];

// Dimensiones: caja 96px (w-24) + gap 12px (gap-3) = paso 108px
const BOX_W = 108;
const CYCLE_COUNT = 12; // 4 ciclos de 3 estilos
const REPEATS = 3; // 3 ciclos renderizados para scroll continuo
const TOTAL_BOXES = CYCLE_COUNT * REPEATS;
const CYCLE_WIDTH = CYCLE_COUNT * BOX_W;
const SPIN_SPEED = 1200; // px/s — giro rápido tipo casino
const DECEL_MS = 3500; // duración del frenado

export default function CajaSlider({ onStop }) {
  const { t } = useI18n();
  const [offset, setOffset] = useState(0);
  const [phase, setPhase] = useState("spinning"); // spinning | decelerating | stopped
  const [highlightIdx, setHighlightIdx] = useState(null);
  const [containerW, setContainerW] = useState(320);

  const offsetRef = useRef(0);
  const phaseRef = useRef("spinning");
  const rafRef = useRef(0);
  const decelStartRef = useRef(0);
  const decelFromRef = useRef(0);
  const decelToRef = useRef(0);
  const containerRef = useRef(null);

  // Medir ancho del contenedor para centrar la caja seleccionada
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerW(el.offsetWidth || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Loop de animación con requestAnimationFrame
  useEffect(() => {
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (phaseRef.current === "spinning") {
        offsetRef.current -= SPIN_SPEED * dt;
        if (offsetRef.current <= -CYCLE_WIDTH) offsetRef.current += CYCLE_WIDTH;
        setOffset(offsetRef.current);
      } else if (phaseRef.current === "decelerating") {
        const t = Math.min(1, (now - decelStartRef.current) / DECEL_MS);
        const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
        offsetRef.current = decelFromRef.current + (decelToRef.current - decelFromRef.current) * eased;
        setOffset(offsetRef.current);
        if (t >= 1) {
          phaseRef.current = "stopped";
          setPhase("stopped");
          const idx = Math.round((containerW / 2 - decelToRef.current - 48) / BOX_W);
          setHighlightIdx(idx);
          onStop?.(idx % CYCLE_COUNT);
          return; // detiene el loop
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onStop, containerW]);

  // Iniciar el frenado — elige una caja aleatoria y calcula el offset final
  const handleTry = useCallback(() => {
    if (phaseRef.current !== "spinning") return;
    const target = Math.floor(Math.random() * CYCLE_COUNT);
    // Offset que centra la caja target: containerW/2 - target*BOX_W - 48
    let to = containerW / 2 - target * BOX_W - 48;
    // Asegurar al menos 1 ciclo de recorrido (más negativo = más adelante)
    while (to >= offsetRef.current - CYCLE_WIDTH) to -= CYCLE_WIDTH;
    decelFromRef.current = offsetRef.current;
    decelToRef.current = to;
    decelStartRef.current = performance.now();
    phaseRef.current = "decelerating";
    setPhase("decelerating");
  }, [containerW]);

  const boxes = Array.from({ length: TOTAL_BOXES }, (_, i) => ({
    idx: i,
    styleIdx: i % 3,
  }));

  return (
    <div className="space-y-4">
      {/* Contenedor del slider */}
      <div
        ref={containerRef}
        onClick={handleTry}
        className={`relative overflow-hidden rounded-2xl border border-border bg-background/40 py-4 ${
          phase === "spinning" ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Marcador central — línea + flecha que indica la caja seleccionada */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-0.5 -translate-x-1/2 bg-orange-500/70" />
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-full">
          <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-orange-500" />
        </div>

        {/* Degradados laterales para efecto de profundidad */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card to-transparent" />

        {/* Track de cajas */}
        <div
          className="flex gap-3 will-change-transform"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {boxes.map((b) => {
            const s = BOX_STYLES[b.styleIdx];
            const isHi = highlightIdx === b.idx;
            return (
              <div
                key={b.idx}
                className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border ${s.border} transition-all duration-300 ${
                  isHi ? `ring-2 ${s.ring} shadow-lg ${s.shadow} scale-105` : "shadow-md shadow-black/30"
                }`}
              >
                <img
                  src={BOX_IMAGES[b.styleIdx]}
                  alt={t("caja.slider.alt")}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute right-1.5 top-1.5">
                  <Sparkles className={`h-3.5 w-3.5 ${s.icon}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón grande — ¡Probar Suerte! */}
      <button
        onClick={handleTry}
        disabled={phase !== "spinning"}
        className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 py-4 font-display text-base font-bold text-orange-950 shadow-lg shadow-orange-500/30 transition hover:shadow-orange-500/50 disabled:opacity-60 disabled:shadow-none"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20 transition group-hover:translate-x-full" />
        {phase === "decelerating" ? (
          <>
            <Loader2 className="relative h-5 w-5 animate-spin" /> {t("caja.slider.stopping")}
          </>
        ) : phase === "stopped" ? (
          <>
            <Sparkles className="relative h-5 w-5" /> {t("caja.slider.selected")}
          </>
        ) : (
          <>
            <Sparkles className="relative h-5 w-5" /> {t("caja.slider.try")}
          </>
        )}
      </button>
    </div>
  );
}