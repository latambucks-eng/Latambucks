import React, { useState, useEffect, useRef } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import {
  procesarGiroTragamonedas,
  recargarGirosSmartlink,
  consultarRecargasHoy,
  paisToTier,
  MONETAG_SMART_LINK,
} from "@/lib/slotMachineApi";
import useSlotAudio from "@/components/latambucks/useSlotAudio";
import useSlotReloadLimit from "@/components/latambucks/useSlotReloadLimit";
import { useI18n } from "@/lib/i18n/LanguageContext";
import confetti from "canvas-confetti";
import {
  Loader2,
  RefreshCw,
  Info,
  Crown,
  Coins,
  CheckCircle2,
  Gift,
} from "lucide-react";
import slot0 from "@/assets/slot-symbol-0.png";
import slot1 from "@/assets/slot-symbol-1.png";
import slot2 from "@/assets/slot-symbol-2.png";
import slot3 from "@/assets/slot-symbol-3.png";
import slot4 from "@/assets/slot-symbol-4.png";
import slot5 from "@/assets/slot-symbol-5.png";
import slot6 from "@/assets/slot-symbol-6.png";
import slot7 from "@/assets/slot-symbol-7.png";
import slot8 from "@/assets/slot-symbol-8.png";
import slot9 from "@/assets/slot-symbol-9.png";

const WATCH_SECONDS = 15;
const SPIN_DURATION = 1400;
const rand = () => Math.floor(Math.random() * 10);

// Símbolos 3D renderizados (PNG sobre fondo negro puro). El fondo negro
// se funde visualmente con el rodillo negro del visor. Índice 0-9 = valor
// de cada rueda, en el mismo orden que SLOT_SYMBOLS del API client.
const SLOT_IMAGES = [slot0, slot1, slot2, slot3, slot4, slot5, slot6, slot7, slot8, slot9];

export default function SlotMachine() {
  const { token, user, perfil, refreshPerfil } = useLatamBucks();
  const { t } = useI18n();
  const { limpiarAudios, reproducirAudio, prepararAudios } = useSlotAudio();
  const { recargasHoy, consultarLimite, registrarConteo } = useSlotReloadLimit(user?.id);
  const animationRef = useRef({ interval: null, timers: [] });
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(animationRef.current.interval);
      animationRef.current.timers.forEach(clearTimeout);
      limpiarAudios();
    };
  }, [limpiarAudios]);

  const [reels, setReels] = useState([7, 7, 7]);
  const [spinning, setSpinning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [jackpot, setJackpot] = useState(false);

  const [girosGratuitos, setGirosGratuitos] = useState(perfil?.giros_gratuitos_restantes ?? 3);
  const [girosExtra, setGirosExtra] = useState(perfil?.giros_extra_disponibles ?? 0);

  const [reloading, setReloading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [reloadError, setReloadError] = useState("");
  const reloadOpeningRef = useRef(false);
  const smartWindowRef = useRef(null);
  const startTimeRef = useRef(0);
  const reloadDoneRef = useRef(false);

  // Sincroniza giros desde el perfil cuando carga/refresca externamente
  useEffect(() => {
    if (perfil) {
      setGirosGratuitos(perfil.giros_gratuitos_restantes ?? 3);
      setGirosExtra(perfil.giros_extra_disponibles ?? 0);
    }
  }, [perfil?.giros_gratuitos_restantes, perfil?.giros_extra_disponibles]);

  // Consulta remota del límite diario (multidispositivo): cuenta las recargas
  // reales de hoy en el servidor al montar, para bloquear el botón aunque el
  // usuario cambie de dispositivo. No toca la BD ni los RPC: usa el modo
  // `check` de la Edge Function (service_role, solo lectura).
  const [consultandoLimite, setConsultandoLimite] = useState(false);
  useEffect(() => {
    if (!token || !user?.id) return;
    let cancelled = false;
    setConsultandoLimite(true);
    consultarRecargasHoy(token)
      .then((res) => {
        if (cancelled) return;
        if (res && typeof res.recargas_hoy === "number") registrarConteo(res.recargas_hoy);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setConsultandoLimite(false); });
    return () => { cancelled = true; };
  }, [token, user?.id, registrarConteo]);

  const totalGiros = girosGratuitos + girosExtra;
  const recargasRestantes = Math.max(0, 4 - recargasHoy);
  const sinGiros = totalGiros <= 0;

  const spin = async () => {
    if (spinning || busy || sinGiros || reloading) return;
    limpiarAudios();
    animationRef.current.timers.forEach(clearTimeout);
    animationRef.current.timers = [];
    setError("");
    setResult(null);
    setJackpot(false);
    setBusy(true);
    setSpinning(true);
    reproducirAudio("spin");
    prepararAudios("spin");

    const interval = setInterval(() => {
      setReels([rand(), rand(), rand()]);
    }, 80);
    animationRef.current.interval = interval;

    try {
      // Usa el país detectado por IP (persistido por la Edge Function al
      // recargar giros). Si todavía no se detectó (sin recargas), cae al
      // campo estático del registro → Tier 3 (presupuesto seguro).
      const tier = paisToTier(perfil?.pais_detectado || perfil?.pais);
      const [res] = await Promise.all([
        procesarGiroTragamonedas(token, tier),
        new Promise((r) => setTimeout(r, SPIN_DURATION)),
      ]);
      clearInterval(interval);
      if (!mountedRef.current) return;
      // La última parada y spinning=false comparten el mismo instante.
      setReels([res.rueda1, rand(), rand()]);
      animationRef.current.timers.push(setTimeout(() => setReels([res.rueda1, res.rueda2, rand()]), 250));
      animationRef.current.timers.push(setTimeout(() => {
        setReels([res.rueda1, res.rueda2, res.rueda3]);
        limpiarAudios();
        setSpinning(false);
        if (res.es_premio_gordo) {
          setJackpot(true);
          reproducirAudio("jackpot");
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        } else if (Number(res.puntos_ganados) > 0) {
          reproducirAudio("win");
        }
      }, 500));
      setResult(res);
      setGirosGratuitos(res.giros_gratuitos);
      setGirosExtra(res.giros_extra);
      await refreshPerfil(token, user.id);
    } catch (e) {
      clearInterval(interval);
      animationRef.current.timers.forEach(clearTimeout);
      limpiarAudios();
      if (mountedRef.current) {
        setSpinning(false);
        setError(e.message || t("slot.err.spin"));
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const startReload = () => {
    if (reloadOpeningRef.current || reloading || busy || spinning || consultandoLimite) return;
    if (Math.max(recargasHoy, consultarLimite()) >= 4) {
      setReloadError(t("slot.err.limit"));
      return;
    }
    if (!token || !user?.id) {
      setReloadError(t("slot.err.login"));
      return;
    }
    reloadOpeningRef.current = true;
    limpiarAudios();
    prepararAudios();
    setReloadError("");
    setCountdownDone(false);
    reloadDoneRef.current = false;
    const w = window.open(MONETAG_SMART_LINK, "_blank");
    smartWindowRef.current = w;
    if (!w) {
      reloadOpeningRef.current = false;
      setReloadError(t("slot.err.popup"));
      return;
    }
    setReloading(true);
    startTimeRef.current = Date.now();
    setCountdown(WATCH_SECONDS);
  };

  // Countdown del anuncio del Smart Link — tras 15s se valida la recarga
  useEffect(() => {
    if (!reloading) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, WATCH_SECONDS - elapsed);
      setCountdown(remaining);
      if (remaining === 0 && !reloadDoneRef.current) {
        reloadDoneRef.current = true;
        setCountdownDone(true);
        reproducirAudio("notif");
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [reloading, reproducirAudio]);

  const completeReload = async () => {
    if (!countdownDone || claiming) return;
    setClaiming(true);
    try {
      const res = await recargarGirosSmartlink(token);
      if (res.success) {
        setGirosExtra(res.giros_extra);
        registrarConteo(res.recargas_hoy);
        if (smartWindowRef.current && !smartWindowRef.current.closed) {
          smartWindowRef.current.close();
        }
      } else {
        setReloadError(res.error || t("slot.err.reload"));
        if (typeof res.recargas_hoy === "number") registrarConteo(res.recargas_hoy);
      }
    } catch (e) {
      if (/l[ií]mite.*recargas/i.test(e.message || "")) registrarConteo(4);
      setReloadError(e.message || t("slot.err.conn"));
    } finally {
      setClaiming(false);
      setReloading(false);
      reloadOpeningRef.current = false;
      smartWindowRef.current = null;
    }
  };

  const won = result && Number(result.puntos_ganados) > 0;

  // ── Estilos visuales reutilizables (capa estética, sin lógica) ──
  const chassisStyle = {
    background: "linear-gradient(160deg, #1c1f2b 0%, #0c0e14 45%, #161922 100%)",
    boxShadow:
      "0 0 0 1px rgba(255,215,0,0.22), 0 24px 60px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -2px 8px rgba(0,0,0,0.5)",
  };
  const goldFrameStyle = {
    background:
      "linear-gradient(145deg, #8b6914 0%, #ffd700 18%, #fff8dc 32%, #ffd700 50%, #b8860b 68%, #ffd700 82%, #8b6914 100%)",
    boxShadow:
      "0 0 32px -8px rgba(255,215,0,0.5), 0 4px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.45)",
  };
  const ledScreenBase = {
    fontFamily: "var(--font-mono)",
    boxShadow: "inset 0 2px 7px rgba(0,0,0,0.92), inset 0 0 0 1px rgba(255,255,255,0.06)",
  };
  const spinBtnStyle = {
    boxShadow:
      "0 0 30px -4px rgba(255,215,0,0.65), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,215,0,0.5)",
    textShadow: "0 1px 0 rgba(255,255,255,0.35)",
  };
  const reloadBtnStyle = {
    boxShadow:
      "0 0 26px -4px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.35)",
    border: "1px solid rgba(139,92,246,0.5)",
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] p-5" style={chassisStyle}>
      {/* Brillos ambientales de fondo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/20 blur-[70px]" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-violet-500/20 blur-[60px]" />

      {/* ── Marquesina superior estilo casino ── */}
      <div className="relative flex items-center justify-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "#000",
            boxShadow: "0 0 24px -4px rgba(255,215,0,0.6), inset 0 0 0 1px rgba(255,215,0,0.45)",
          }}
        >
          <img src={SLOT_IMAGES[7]} alt="" className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h3
            className="font-display text-xl font-extrabold tracking-[0.15em] text-foreground"
            style={{ textShadow: "0 0 18px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.7)" }}
          >
            SLOT BUKS
          </h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/70">
            {t("slot.sub")}
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "#000",
            boxShadow: "0 0 24px -4px rgba(255,215,0,0.6), inset 0 0 0 1px rgba(255,215,0,0.45)",
          }}
        >
          <img src={SLOT_IMAGES[9]} alt="" className="h-8 w-8" />
        </div>
      </div>

      {/* ── Marco dorado metálico + visor de las ruedas ── */}
      <div className="relative mt-4 rounded-2xl p-[3px]" style={goldFrameStyle}>
        <div
          className={`relative rounded-[14px] p-3 ${spinning ? "animate-pulse" : ""}`}
          style={{
            background: "#000",
            boxShadow: jackpot
              ? "inset 0 0 26px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(251,191,36,0.5), 0 0 44px -8px rgba(251,191,36,0.55)"
              : "inset 0 0 26px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(255,215,0,0.12)",
          }}
        >
          <div className="flex justify-center gap-2.5">
            {reels.map((r, i) => (
              <div
                key={i}
                className="relative flex h-28 w-[4.5rem] items-center justify-center overflow-hidden rounded-xl"
                style={{ background: "#000" }}
              >
                {/* Símbolo 3D renderizado — <img> con motion blur al girar */}
                <img
                  src={SLOT_IMAGES[r] ?? SLOT_IMAGES[0]}
                  alt=""
                  className={`h-20 w-20 ${spinning ? "animate-reel-blur" : ""}`}
                  style={{ filter: spinning ? "blur(5px)" : "none" }}
                />
                {/* Sombras del cilindro (profundidad del rodillo) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/85 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 to-transparent" />
                {/* Brillo superior del rodillo (shine del cilindro) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/[0.07] to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pantallas LED de contadores (neón) ── */}
      <div className="relative mt-4 flex items-stretch justify-center gap-2.5">
        <div
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2"
          style={{ ...ledScreenBase, background: "#08080a" }}
        >
          <span className="text-sm">🎁</span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest opacity-80"
            style={{ color: "#ff2d55", textShadow: "0 0 8px #ff2d55" }}
          >
            {t("slot.free")}
          </span>
          <span
            className="font-mono text-lg font-bold tabular-nums"
            style={{ color: "#ff2d55", textShadow: "0 0 12px #ff2d55, 0 0 4px #ff2d55" }}
          >
            {girosGratuitos}
          </span>
        </div>
        <div
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2"
          style={{ ...ledScreenBase, background: "#08080a" }}
        >
          <span className="text-sm">⚡</span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest opacity-80"
            style={{ color: "#ff9f0a", textShadow: "0 0 8px #ff9f0a" }}
          >
            {t("slot.bonus")}
          </span>
          <span
            className="font-mono text-lg font-bold tabular-nums"
            style={{ color: "#ff9f0a", textShadow: "0 0 12px #ff9f0a, 0 0 4px #ff9f0a" }}
          >
            {girosExtra}
          </span>
        </div>
      </div>

      {/* ── Resultado del giro ── */}
      {result && !spinning && (
        <div
          className={`relative mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
            jackpot
              ? "bg-amber-500/15 text-amber-300"
              : won
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-background/50 text-muted-foreground"
          }`}
          style={
            jackpot
              ? { boxShadow: "0 0 26px -6px rgba(251,191,36,0.5), inset 0 0 0 1px rgba(251,191,36,0.3)" }
              : {}
          }
        >
          {jackpot ? (
            <>
              <Crown className="h-5 w-5 shrink-0" />
              <span className="font-display font-bold">{t("slot.jackpot", { puntos: Number(result.puntos_ganados).toLocaleString("es") })}</span>
            </>
          ) : won ? (
            <>
              <Coins className="h-4 w-4 shrink-0" />
              <span>{t("slot.won", { puntos: Number(result.puntos_ganados).toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 4 }) })}</span>
            </>
          ) : (
            <span>{t("slot.noMatch")}</span>
          )}
        </div>
      )}

      {error && (
        <div className="relative mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* ── Botón GIRAR (gradiente dorado + presión) ── */}
      <button
        onClick={spin}
        disabled={busy || spinning || sinGiros || reloading}
        style={spinBtnStyle}
        className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 via-orange-500 to-orange-600 py-3.5 font-display text-base font-extrabold tracking-wider text-orange-950 transition-all duration-150 hover:from-amber-200 hover:via-orange-400 hover:to-orange-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      >
        {busy || spinning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> {t("slot.spinning")}
          </>
        ) : sinGiros ? (
          t("slot.noSpins")
        ) : (
          <>
            <Coins className="h-5 w-5" /> {t("slot.spin", { n: totalGiros })}
          </>
        )}
      </button>

      {/* ── Sección de recarga — Smart Link de Monetag ── */}
      {sinGiros && !reloading && (
        <div
          className="relative mt-4 rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4"
          style={{ boxShadow: "0 0 24px -10px rgba(139,92,246,0.4)" }}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-violet-400" />
            <p className="font-display text-sm font-semibold text-violet-300">
              {t("slot.reload.title")}
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t("slot.reload.desc.a")}{" "}
            <span className="font-semibold text-foreground">{t("slot.reload.desc.b")}</span> {t("slot.reload.desc.c")}
          </p>
          <button
            onClick={startReload}
            disabled={consultandoLimite || recargasRestantes <= 0 || busy || spinning}
            style={reloadBtnStyle}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-400 to-violet-600 py-3 font-semibold text-white transition-all duration-150 hover:from-violet-300 hover:to-violet-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <RefreshCw className="h-4 w-4" />
            {consultandoLimite ? t("slot.reload.checking") : recargasRestantes > 0 ? t("slot.reload.left", { n: recargasRestantes }) : t("slot.reload.limit")}
          </button>
          {reloadError && (
            <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">
              {reloadError}
            </p>
          )}
        </div>
      )}

      {/* ── Countdown del anuncio + confirmación manual ── */}
      {reloading && (
        <div
          className="relative mt-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4"
          style={{ boxShadow: "0 0 24px -10px rgba(249,115,22,0.4)" }}
        >
          {countdownDone ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="font-display text-sm font-semibold text-emerald-300">
                  {t("slot.reload.ready")}
                </p>
              </div>
              <button
                onClick={completeReload}
                disabled={claiming}
                style={{
                  boxShadow:
                    "0 0 26px -4px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.35)",
                  border: "1px solid rgba(16,185,129,0.5)",
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 py-3 font-display font-bold text-white transition-all duration-150 hover:from-emerald-300 hover:to-emerald-500 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
              >
                {claiming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("slot.reload.claiming")}
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4" /> {t("slot.reload.claim")}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                <p className="font-display text-sm font-semibold text-orange-300">
                  {t("slot.reload.watching", { s: countdown })}
                </p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 ease-linear"
                  style={{
                    width: `${((WATCH_SECONDS - countdown) / WATCH_SECONDS) * 100}%`,
                    boxShadow: "0 0 12px rgba(249,115,22,0.6)",
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("slot.reload.wait")}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Nota informativa ── */}
      {!reloading && !result && (
        <div className="relative mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
          <p>
            {t("slot.tip")}
          </p>
        </div>
      )}
    </div>
  );
}