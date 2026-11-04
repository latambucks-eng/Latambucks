import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchCheckinHoy, reclamarCheckinDiario } from "@/lib/supabaseClient";
import { Gift, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function CheckinDiario() {
  const { token, user, perfil, refreshPerfil, exchangeRate } = useLatamBucks();
  const { t } = useI18n();
  const esArgentina = perfil?.pais === "Argentina";
  const [yaClaimed, setYaClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [proximaDisponible, setProximaDisponible] = useState(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!token || !user?.id) return;
    fetchCheckinHoy(token, user.id)
      .then((result) => {
        setYaClaimed(result.claimed);
        setProximaDisponible(result.proximaDisponible || null);
      })
      .catch(() => {
        setYaClaimed(false);
        setProximaDisponible(null);
      })
      .finally(() => setLoading(false));
  }, [token, user?.id]);

  // Countdown live hasta que pasen las 24 horas exactas
  useEffect(() => {
    if (!proximaDisponible) {
      setCountdown("");
      return;
    }
    const interval = setInterval(() => {
      const restante = new Date(proximaDisponible).getTime() - Date.now();
      if (restante <= 0) {
        setCountdown("");
        setYaClaimed(false);
        setProximaDisponible(null);
        clearInterval(interval);
        return;
      }
      const h = Math.floor(restante / (1000 * 60 * 60));
      const m = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((restante % (1000 * 60)) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [proximaDisponible]);

  const reclamar = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await reclamarCheckinDiario(token);
      if (res?.success) {
        // La RPC ya acreditó el saldo en el servidor. refreshPerfil es la
        // única fuente de verdad: si falla, el saldo no queda optimista en
        // la UI (evita el setPerfil manual que podía desincronizarse).
        await refreshPerfil(token, user.id);
        setProximaDisponible(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
        setDone(true);
        setYaClaimed(true);
      } else if (res?.already_claimed) {
        setYaClaimed(true);
        setProximaDisponible(res?.proxima_disponible || null);
        setErr(t("checkin.err.reclamado"));
      } else {
        setErr(res?.error || t("checkin.err.generico"));
      }
    } catch (e) {
      setErr(e.message || t("checkin.err.generico"));
    } finally {
      setBusy(false);
    }
  };

  const usdEquiv = (10 / 1000).toFixed(2);
  const arsEquiv = esArgentina && exchangeRate > 0 ? Math.round((10 / 1000) * exchangeRate) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-green-500/40 bg-gradient-to-br from-green-500/15 via-card to-card p-4">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-500/20 blur-[40px]" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/20 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-300">
              {t("checkin.done.title")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t("checkin.done.sub")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (yaClaimed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 opacity-70">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/20 text-muted-foreground">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t("checkin.claimed.title")}</p>
          <p className="text-[11px] text-muted-foreground">
            {countdown ? t("checkin.claimed.timer", { tiempo: countdown }) : t("checkin.claimed.sub")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={reclamar}
      disabled={busy}
      className="group relative w-full overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/15 via-card to-card p-4 text-left transition hover:border-orange-500/60 disabled:opacity-70"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/20 blur-[40px] transition group-hover:scale-110" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-orange-950 shadow-[0_0_20px_-4px] shadow-orange-500/60">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Gift className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-foreground">
            {t("checkin.cta")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t("checkin.equiv")} <span className="font-semibold text-orange-400">${usdEquiv} USD</span>
            {esArgentina && arsEquiv > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-orange-400">${arsEquiv.toLocaleString("es")} ARS</span>
              </>
            )}
          </p>
        </div>
        <Sparkles className="h-5 w-5 shrink-0 text-orange-400/60" />
      </div>
      {err && (
        <p className="relative mt-2 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">{err}</p>
      )}
    </button>
  );
}