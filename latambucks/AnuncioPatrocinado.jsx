import React, { useState, useEffect, useRef } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { rpcRegistrarVideoConLimite, fetchVideosHoy, iniciarSesionVideo } from "@/lib/supabaseClient";
import { sndOpen } from "@/lib/cajaSound";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { Loader2, CheckCircle2, Flame, AlertTriangle, X, Clapperboard, Info } from "lucide-react";

const AD_URL = "https://omg10.com/4/11827535";
const REWARD = 1;
const LIMIT = 20;
const WATCH_SECONDS = 15;

export default function AnuncioPatrocinado() {
  const { t } = useI18n();
  const { token, user, refreshPerfil } = useLatamBucks();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [limitToast, setLimitToast] = useState(false);
  const [videosHoy, setVideosHoy] = useState(0);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const completingRef = useRef(false);
  const sesionIdRef = useRef(null);
  const anuncioWindowRef = useRef(null);
  const startTimeRef = useRef(0);
  const limitReached = videosHoy >= LIMIT;

  useEffect(() => {
    if (!token || !user?.id) return;
    fetchVideosHoy(token, user.id).then(setVideosHoy).catch(() => {});
  }, [token, user?.id]);

  useEffect(() => {
    if (!watching) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, WATCH_SECONDS - elapsed);
      setCountdown(remaining);

      if (remaining === 0) {
        if (!completingRef.current) {
          completingRef.current = true;
          try { sndOpen(); } catch {}
          if (anuncioWindowRef.current && !anuncioWindowRef.current.closed) {
            anuncioWindowRef.current.close();
          }
          anuncioWindowRef.current = null;
          setTimeout(() => completeVideo(), 2000);
        }
        return;
      }
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

  const watchVideo = async () => {
    setErr("");
    setDone(false);
    completingRef.current = false;
    const anuncioWindow = window.open(AD_URL, "_blank");
    anuncioWindowRef.current = anuncioWindow;
    if (!anuncioWindow) {
      setErr(t("ad.err.popup"));
      return;
    }
    try {
      const res = await iniciarSesionVideo(token);
      const sid = res?.sesion_id;
      if (!sid) {
        anuncioWindow.close();
        anuncioWindowRef.current = null;
        setErr(t("ad.err.start"));
        return;
      }
      sesionIdRef.current = sid;
      // Arrancamos el contador DESPUÉS de que el servidor creó la sesión,
      // así el reloj del servidor y el contador del frontend están
      // sincronizados: cuando el contador llega a 0, el servidor también
      // vio pasar ese mismo tiempo.
      startTimeRef.current = Date.now();
      setWatching(true);
      setCountdown(WATCH_SECONDS);
    } catch (e) {
      anuncioWindow.close();
      anuncioWindowRef.current = null;
      setErr(e.message || t("ad.err.start"));
    }
  };

  const completeVideo = async () => {
    setBusy(true);
    try {
      const result = await rpcRegistrarVideoConLimite(token, user.id, sesionIdRef.current);
      const status = typeof result === "string" ? result : result?.status || result?.result;
      if (status === "video_registrado_exito") {
        await refreshPerfil(token, user.id);
        setDone(true);
        setVideosHoy((v) => v + 1);
      } else if (status === "error_limite_diario_alcanzado") {
        setLimitToast(true);
        setVideosHoy(LIMIT);
      } else {
        setErr(status || t("ad.err.unexpected"));
      }
    } catch (e) {
      setErr(e.message || t("ad.err.reward"));
    } finally {
      setBusy(false);
      setWatching(false);
      sesionIdRef.current = null;
      anuncioWindowRef.current = null;
    }
  };

  return (
    <>
      {limitToast && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-card/95 px-4 py-3 shadow-[0_8px_40px_-8px] shadow-amber-500/30 backdrop-blur-xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">{t("ad.limit.title")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-200/80">
              {t("ad.limit.body")}
            </p>
          </div>
          <button
            onClick={() => setLimitToast(false)}
            className="rounded-lg p-1 text-amber-400/60 transition hover:bg-amber-500/10 hover:text-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        onClick={watchVideo}
        disabled={busy || limitReached || watching}
        className="group relative w-full overflow-hidden rounded-3xl border border-orange-500/40 bg-gradient-to-br from-orange-500/20 via-card to-card p-6 text-left transition disabled:opacity-70"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-500/30 blur-[50px] transition group-hover:scale-110" />
        <div className="relative flex items-center gap-4">
          <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_30px_-6px] shadow-orange-500/70 ${limitReached ? "bg-muted-foreground/30 text-muted-foreground" : "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-950 ring-2 ring-orange-400/40"}`}>
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-orange-500/40 opacity-40 blur-md" />
            {watching || busy ? <Loader2 className="relative h-7 w-7 animate-spin" /> : limitReached ? <Flame className="relative h-7 w-7" /> : <Clapperboard className="relative h-8 w-8 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]" />}
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-foreground">
              {limitReached ? t("ad.limit.title") : watching ? t("ad.watching", { s: countdown }) : t("ad.watch")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-orange-400">
              {limitReached ? t("ad.tomorrow") : t("ad.points", { n: REWARD })}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {limitReached
                ? t("ad.seenToday", { v: videosHoy, l: LIMIT })
                : watching
                ? t("ad.keepOpen", { s: countdown })
                : t("ad.maxPerDay", { l: LIMIT, v: videosHoy })}
            </p>
          </div>
        </div>
        {watching && (
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((WATCH_SECONDS - countdown) / WATCH_SECONDS) * 100}%` }}
            />
          </div>
        )}
        {done && (
          <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-orange-500/15 px-3 py-2 text-sm text-orange-400">
            <CheckCircle2 className="h-4 w-4" /> {t("ad.done")}
          </div>
        )}
        {err && (
          <div className="relative mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            {err}
          </div>
        )}
      </button>

      {!watching && !done && !limitReached && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400/70" />
          <p>
            {t("ad.help1")}
            <span className="font-semibold text-foreground">{t("ad.help2")}</span>{t("ad.help3")}
            <span className="font-semibold text-foreground">{t("ad.help4")}</span>{t("ad.help5")}
          </p>
        </div>
      )}
    </>
  );
}