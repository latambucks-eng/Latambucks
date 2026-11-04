import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Rocket,
  ClipboardList,
  Gamepad2,
  ClipboardCheck,
  Coins,
  Wallet,
  Users,
  ShieldCheck,
  Lightbulb,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { GUIA } from "@/lib/i18n/content/guia";

// ============================================================
// Guía interactiva — recorrido paso a paso por todo LatamBucks
// ------------------------------------------------------------
// Se abre desde el botón del encabezado, desde el menú lateral y
// automáticamente la primera vez que el usuario entra (una sola vez
// por cuenta, recordado en localStorage).
// Cada paso explica una sección, sus reglas de pago reales y ofrece
// un acceso directo a esa sección.
// Los textos viven en src/lib/i18n/content/guia.js (ES/EN/PT).
// ============================================================

const ACCENTS = {
  orange: { icon: "bg-orange-500/15 text-orange-400 ring-orange-500/25", check: "text-orange-400" },
  sky: { icon: "bg-sky-500/15 text-sky-400 ring-sky-500/25", check: "text-sky-400" },
  violet: { icon: "bg-violet-500/15 text-violet-400 ring-violet-500/25", check: "text-violet-400" },
  emerald: { icon: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25", check: "text-emerald-400" },
  amber: { icon: "bg-amber-500/15 text-amber-400 ring-amber-500/25", check: "text-amber-400" },
};

// Orden fijo de los pasos: icono, color y ruta de cada uno. El texto
// traducido se empareja por posición desde GUIA[lang].steps.
const STEP_META = [
  { id: "bienvenida", icon: Rocket, accent: "orange" },
  { id: "encuestas", icon: ClipboardList, accent: "sky", route: "/encuestas" },
  { id: "ofertas", icon: Gamepad2, accent: "violet", route: "/timewall" },
  { id: "tareas", icon: ClipboardCheck, accent: "emerald", route: "/tareas-anunciantes" },
  { id: "ganar", icon: Coins, accent: "orange", route: "/ganar" },
  { id: "retiros", icon: Wallet, accent: "amber", route: "/retiros" },
  { id: "referidos", icon: Users, accent: "violet", route: "/referidos" },
  { id: "cuenta", icon: ShieldCheck, accent: "emerald" },
];

export default function GuiaInteractiva({ open, onClose }) {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [step, setStep] = useState(0);

  // Cada vez que se abre, arranca desde el principio.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content = GUIA[lang] || GUIA.es;
  const ui = content.ui;
  const steps = STEP_META.map((meta, i) => ({
    ...meta,
    ...(content.steps[i] || GUIA.es.steps[i]),
  }));

  const total = steps.length;
  const s = steps[step];
  const Icon = s.icon;
  const accent = ACCENTS[s.accent] || ACCENTS.orange;
  const isLast = step === total - 1;

  const goTo = (route) => {
    onClose?.();
    navigate(route);
  };

  const fmt = (text, vars) =>
    Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), text);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ui.aria}
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl shadow-black/50 sm:rounded-3xl">
        {/* Encabezado: progreso clickeable */}
        <div className="shrink-0 border-b border-border px-4 pb-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {fmt(ui.progreso, { n: step + 1, total })}
            </span>
            <button
              onClick={onClose}
              aria-label={ui.cerrar}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            {steps.map((st, i) => (
              <button
                key={st.id}
                onClick={() => setStep(i)}
                aria-label={fmt(ui.pasoAria, { n: i + 1, titulo: st.title })}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-orange-500"
                    : i < step
                      ? "bg-orange-500/60"
                      : "bg-background/70 hover:bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 lb-menu-scroll">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${accent.icon}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="mt-3 font-display text-xl font-bold leading-tight text-foreground">
            {s.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.subtitle}</p>

          <ul className="mt-4 space-y-2.5">
            {s.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${accent.check}`} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {s.tip && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-background/60 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{ui.tip}</span>
                {s.tip}
              </p>
            </div>
          )}

          {s.route && (
            <button
              onClick={() => goTo(s.route)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
            >
              {s.cta} <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navegación */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((v) => Math.max(0, v - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> {ui.atras}
            </button>
            {isLast ? (
              <button
                onClick={() => goTo("/encuestas")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-orange-950 transition hover:bg-orange-400"
              >
                <Rocket className="h-4 w-4" /> {ui.empezar}
              </button>
            ) : (
              <button
                onClick={() => setStep((v) => Math.min(total - 1, v + 1))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-orange-950 transition hover:bg-orange-400"
              >
                {ui.siguiente} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-2 w-full text-center text-[11px] text-muted-foreground transition hover:text-foreground"
          >
            {ui.cerrarExplorar}
          </button>
        </div>
      </div>
    </div>
  );
}