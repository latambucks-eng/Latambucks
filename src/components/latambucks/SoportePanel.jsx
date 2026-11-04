import React, { useState } from "react";
import {
  LifeBuoy,
  ChevronDown,
  Mail,
  Clock,
  AlertTriangle,
  HelpCircle,
  UserX,
  RotateCcw,
  Coins,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { SOPORTE } from "@/lib/i18n/content/soporte";

// Icono y color de cada sección de FAQ. El texto vive en
// src/lib/i18n/content/soporte.js (ES/EN/PT) y se empareja por id.
const SECCION_META = {
  "como-funciona": { icon: HelpCircle, color: "orange" },
  "puntos-proveedores": { icon: Coins, color: "violet" },
  cuenta: { icon: UserX, color: "rose" },
  "retiros-reembolsos": { icon: RotateCcw, color: "emerald" },
};

const TOKEN_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

// Texto con **negrita** y [enlaces](url) simples.
function Rich({ text }) {
  const parts = [];
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={m.index} className="text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const link = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      parts.push(
        <a
          key={m.index}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 hover:text-orange-300"
        >
          {link[1]}
        </a>
      );
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function SoportePanel() {
  const { lang } = useI18n();
  const content = SOPORTE[lang] || SOPORTE.es;
  const ui = content.ui;
  const [mainOpen, setMainOpen] = useState(false);
  const [openSeccion, setOpenSeccion] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  const toggleSeccion = (id) => {
    setOpenSeccion(openSeccion === id ? null : id);
    setOpenItem(null);
  };

  const toggleItem = (idx) => {
    setOpenItem(openItem === idx ? null : idx);
  };

  const colorMap = {
    orange: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", ring: "ring-orange-500/20" },
    violet: { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", ring: "ring-violet-500/20" },
    rose: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", ring: "ring-rose-500/20" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", ring: "ring-emerald-500/20" },
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <button
        onClick={() => setMainOpen((v) => !v)}
        className="flex w-full items-center gap-3"
      >
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-600/5 text-orange-400 ring-1 ring-orange-500/25 shadow-lg shadow-black/30">
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-orange-500/20 opacity-40 blur-md" />
          <LifeBuoy className="relative h-6 w-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">{ui.title}</p>
          <p className="text-[11px] text-muted-foreground">{ui.sub}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${mainOpen ? "rotate-180" : ""}`}
        />
      </button>

      {mainOpen && (
        <div className="mt-4 space-y-4">
          {/* Intro */}
          <div className="rounded-xl bg-background/50 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
            <p>{ui.intro}</p>
          </div>

          {/* Secciones de FAQ */}
          {content.secciones.map((seccion) => {
            const meta = SECCION_META[seccion.id] || SECCION_META["como-funciona"];
            const c = colorMap[meta.color];
            const isSeccionOpen = openSeccion === seccion.id;
            const Icon = meta.icon;
            return (
              <div key={seccion.id} className={`rounded-xl border ${c.border} overflow-hidden`}>
                <button
                  onClick={() => toggleSeccion(seccion.id)}
                  className="flex w-full items-center gap-2.5 bg-background/40 px-3.5 py-3 text-left"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{seccion.titulo}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isSeccionOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isSeccionOpen && (
                  <div className="space-y-1.5 px-3.5 pb-3 pt-1">
                    {seccion.items.map((item, i) => {
                      const globalIdx = `${seccion.id}-${i}`;
                      const isOpen = openItem === globalIdx;
                      return (
                        <div key={i} className="rounded-lg border border-border/60 bg-card/60 overflow-hidden">
                          <button
                            onClick={() => toggleItem(globalIdx)}
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
                          >
                            <span className="mt-0.5 flex-1 text-xs font-medium text-foreground">{item.q}</span>
                            <ChevronDown
                              className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="space-y-2 px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
                              {item.a.map((parrafo, j) => (
                                <p key={j}>
                                  <Rich text={parrafo} />
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Aviso importante */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              <Rich text={ui.aviso} />
            </p>
          </div>

          {/* Contacto directo */}
          <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-orange-400" />
              <p className="text-sm font-semibold text-foreground">{ui.contactoTitulo}</p>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              {ui.contactoDesc}
            </p>
            <a
              href="mailto:latambucks@gmail.com"
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400"
            >
              <Mail className="h-4 w-4" /> latambucks@gmail.com
            </a>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{ui.respTitle}</span>
            </div>
            <div className="mt-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-200/80">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>
                  <strong className="text-foreground">{ui.unCorreo}</strong>
                  <Rich text={ui.unCorreoSub} />
                </span>
              </p>
              <div className="ml-5 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">{ui.datosTitle}</p>
                <p>{ui.datos1}</p>
                <p>{ui.datos2}</p>
                <p>{ui.datos3}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}