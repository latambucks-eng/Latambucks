import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles, Loader2, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchCajaCooldown, abrirCajaSorpresa } from "@/lib/supabaseClient";
import { sndClick, sndOpen, sndReward, sndBigReward } from "@/lib/cajaSound";
import CajaModal from "./CajaModal";
import CajaPrize from "./CajaPrize";
import CajaSlider from "./CajaSlider";
import { useI18n } from "@/lib/i18n/LanguageContext";
import caja1 from "@/assets/external/caja-1.jpg";
import caja2 from "@/assets/external/caja-2.jpg";
import caja3 from "@/assets/external/caja-3.jpg";

// Monetag ad URL — mismo zone que EarnTab. El anuncio SOLO se carga al
// presionar "Ver Anuncio y Abrir Caja" en el modal. No hay carga automática.
const AD_URL = "https://omg10.com/4/11827535";
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 horas
const AD_WATCH_SECONDS = 15;

const BOX_STYLES = [
  { border: "border-orange-500/50", lid: "from-orange-500/30 to-orange-600/10", body: "from-orange-500/8 via-card to-card", glow: "bg-orange-500/40", icon: "text-orange-400", ribbon: "bg-orange-500/70" },
  { border: "border-violet-500/50", lid: "from-violet-500/30 to-violet-600/10", body: "from-violet-500/8 via-card to-card", glow: "bg-violet-500/40", icon: "text-violet-400", ribbon: "bg-violet-500/70" },
  { border: "border-amber-500/50", lid: "from-amber-500/30 to-amber-600/10", body: "from-amber-500/8 via-card to-card", glow: "bg-amber-500/40", icon: "text-amber-400", ribbon: "bg-amber-500/70" },
];

const BOX_IMAGES = [caja1, caja2, caja3];

export default function CajasSorpresa() {
  const { token, user, perfil, refreshPerfil } = useLatamBucks();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [prize, setPrize] = useState(0);
  const [showPrize, setShowPrize] = useState(false);
  const [err, setErr] = useState("");
  const adWindowRef = useRef(null);
  const completingRef = useRef(false);
  const startTimeRef = useRef(0);

  // Check cooldown on mount — solo consulta la DB, no carga ningún anuncio
  useEffect(() => {
    if (!token || !user?.id) return;
    fetchCajaCooldown(token, user.id)
      .then((r) => { if (r.claimed) setCooldownEnd(r.proximaDisponible); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, user?.id]);

  // Cooldown countdown display
  useEffect(() => {
    if (!cooldownEnd) return;
    const i = setInterval(() => {
      if (new Date(cooldownEnd).getTime() - Date.now() <= 0) {
        setCooldownEnd(null);
        clearInterval(i);
      }
    }, 1000);
    return () => clearInterval(i);
  }, [cooldownEnd]);

  // Temporizador basado en timestamp real (no contador decremental).
  // Evita que el timer se pause cuando la pestaña pasa a segundo plano.
  useEffect(() => {
    if (!watching) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, AD_WATCH_SECONDS - elapsed);
      setCountdown(remaining);

      if (remaining === 0) {
        if (!completingRef.current) {
          completingRef.current = true;
          if (adWindowRef.current && !adWindowRef.current.closed) adWindowRef.current.close();
          adWindowRef.current = null;
          handleAdComplete();
        }
        return;
      }

      // No se valida .closed para ventanas cross-origin: los anuncios redirigen
      // y .closed puede reportar true aunque el anuncio siga abierto, causando
      // falsos positivos de fraude. El timer es la única protección confiable.
    };

    tick();
    const interval = setInterval(tick, 500);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [watching]);

  // Click en una caja — abre modal de consentimiento. NO carga el anuncio.
  const handleBoxClick = () => {
    if (cooldownEnd || watching || revealing) return;
    sndClick();
    setShowModal(true);
    setErr("");
  };

  // Confirmación explícita — SOLO aquí se carga el anuncio de Monetag
  const handleConfirmAd = () => {
    setShowModal(false);
    setErr("");
    completingRef.current = false;
    const w = window.open(AD_URL, "_blank");
    adWindowRef.current = w;
    if (!w) {
      setErr(t("caja.err.popup"));
      return;
    }
    setWatching(true);
    setCountdown(AD_WATCH_SECONDS);
    startTimeRef.current = Date.now();
  };

  // El anuncio terminó — procesar premio internamente y guardar bloqueo
  const handleAdComplete = async () => {
    setWatching(false);
    setRevealing(true);
    sndOpen();
    setTimeout(async () => {
      try {
        const res = await abrirCajaSorpresa(token);
        if (res?.disponible === true) {
          setPrize(res.puntosGanados);
          setShowPrize(true);
          // La RPC ya acreditó el saldo en el servidor. refreshPerfil es la
          // única fuente de verdad: si falla, el saldo no queda optimista en
          // la UI (evita el setPerfil manual que podía desincronizarse).
          await refreshPerfil(token, user.id);
          setCooldownEnd(new Date(Date.now() + COOLDOWN_MS).toISOString());
          if (res.puntosGanados >= 100) { sndBigReward(); fireBigConfetti(); }
          else if (res.puntosGanados >= 10) { sndReward(); fireConfetti(); }
          else { sndReward(); fireSmallConfetti(); }
        } else if (res?.disponible === false && res?.tiempoRestante) {
          // Bloqueado por cooldown de 12h — calcular fin desde tiempoRestante HH:MM:SS
          const [h, m, s] = res.tiempoRestante.split(":").map(Number);
          const remainingMs = (h * 3600 + m * 60 + s) * 1000;
          setCooldownEnd(new Date(Date.now() + remainingMs).toISOString());
          setErr(t("caja.err.cooldown", { tiempo: res.tiempoRestante }));
        } else {
          setErr(res?.error || t("caja.err.generic"));
        }
      } catch (e) {
        setErr(e.message || t("caja.err.generic"));
      } finally {
        setRevealing(false);
      }
    }, 1500);
  };

  const closePrize = () => {
    setShowPrize(false);
    setPrize(0);
  };

  const fireSmallConfetti = () => {
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, colors: ["#f97316", "#fbbf24"] });
  };
  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#f97316", "#fbbf24", "#8b5cf6"] });
  };
  const fireBigConfetti = () => {
    const end = Date.now() + 2000;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#fbbf24", "#fde047", "#f97316"] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#fbbf24", "#fde047", "#f97316"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const fmtCountdown = () => {
    if (!cooldownEnd) return "";
    const r = new Date(cooldownEnd).getTime() - Date.now();
    if (r <= 0) return "00:00:00";
    const h = Math.floor(r / 3600000);
    const m = Math.floor((r % 3600000) / 60000);
    const s = Math.floor((r % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    );
  }

  if (showPrize) {
    return <CajaPrize prize={prize} onClose={closePrize} />;
  }

  if (cooldownEnd) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-foreground">{t("caja.title")}</p>
            <p className="text-[11px] text-muted-foreground">{t("caja.yaHoy")}</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-orange-500/10 px-4 py-3 text-center">
          <p className="text-[11px] text-muted-foreground">{t("caja.proxima")}</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-orange-400">{fmtCountdown()}</p>
        </div>
      </div>
    );
  }

  if (watching) {
    return (
      <div className="rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/15 via-card to-card p-6 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-400" />
        <p className="mt-3 font-display text-lg font-bold text-foreground">{t("caja.watching", { s: countdown })}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("caja.keepOpen")}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-1000 ease-linear"
            style={{ width: `${((AD_WATCH_SECONDS - countdown) / AD_WATCH_SECONDS) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  if (revealing) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/15 via-card to-card p-8 text-center">
        <div className="pointer-events-none absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [20, -40], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="absolute"
              style={{ left: `${15 + i * 14}%`, bottom: "20%" }}
            >
              <Sparkles className="h-4 w-4 text-orange-400/60" />
            </motion.div>
          ))}
        </div>
        <motion.div
          animate={{ rotate: [0, -12, 12, -12, 12, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.6, repeat: 2 }}
          className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 shadow-[0_0_40px_-8px] shadow-orange-500/60"
        >
          <Gift className="h-12 w-12" />
        </motion.div>
        <p className="relative mt-4 font-display text-lg font-bold text-foreground">{t("caja.opening")}</p>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="relative mt-1 text-xs text-muted-foreground"
        >
          {t("caja.revealing")}
        </motion.p>
      </div>
    );
  }

  if (showModal) {
    return <CajaModal onClose={() => setShowModal(false)} onConfirm={handleConfirmAd} />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative mb-4 flex items-center gap-2.5">
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-500/5 text-orange-400 ring-1 ring-orange-500/20"
        >
          <Gift className="h-5 w-5" />
        </motion.div>
        <div>
          <p className="font-display text-sm font-bold text-foreground">Cajas Sorpresa</p>
          <p className="text-[11px] text-muted-foreground">{t("caja.sub")}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 ring-1 ring-orange-500/20">1–3 pts</span>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">10 pts</span>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20">100–500 pts</span>
        </div>
      </div>

      {/* Casino-style slider — continuous spin, ease-out stop on centered box */}
      <CajaSlider onStop={handleBoxClick} />

      {err && (
        <p className="relative mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
      )}
    </div>
  );
}