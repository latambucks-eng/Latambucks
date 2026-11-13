import React, { useEffect, useMemo, useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { rpcSolicitarRetiroCanje, updatePerfil, fetchAppConfig } from "@/lib/supabaseClient";
import {
  RETIROS,
  fillRetiros,
  minRetiro,
  RETIRO_MONTOS_PAYPAL,
  RETIRO_MONTOS_BINANCE,
} from "@/lib/i18n/content/retiros";
import { PayPalLogo, BinanceLogo } from "@/components/latambucks/PaymentLogos";
import { Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";

// Tarjetas fijas de retiro: PayPal ($5 a $100) y Binance USDT ($3 a $100).
// El mínimo depende del país detectado y el canje lo valida la RPC.
export default function RetiroCanje({ onSaved }) {
  const { lang } = useI18n();
  const c = RETIROS[lang] || RETIROS.es;
  const { token, user, perfil, refreshPerfil } = useLatamBucks();

  const [metodo, setMetodo] = useState("paypal");
  const [puntos, setPuntos] = useState(null);
  const [detalles, setDetalles] = useState("");
  const [titular, setTitular] = useState("");
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [paypalFeeInfo, setPaypalFeeInfo] = useState("");

  const iso = String(perfil?.pais_detectado || "").toUpperCase();
  const disponible = Number(perfil?.saldo_disponible || 0);
  const saldoEncuestas = Number(perfil?.saldo_encuestas || 0);
  const minimo = minRetiro(iso, metodo);

  const montos = useMemo(() => {
    const base = metodo === "paypal" ? RETIRO_MONTOS_PAYPAL : RETIRO_MONTOS_BINANCE;
    return base.filter((p) => p >= minimo);
  }, [metodo, minimo]);

  // Al cambiar de método, el monto elegido puede dejar de existir.
  useEffect(() => {
    if (puntos && !montos.includes(puntos)) setPuntos(null);
  }, [montos, puntos]);

  // Aviso de comisión de PayPal configurado por el admin (app_config).
  useEffect(() => {
    if (!token) return;
    fetchAppConfig(token, "paypal_fee_info")
      .then((info) => { if (info) setPaypalFeeInfo(String(info)); })
      .catch(() => {});
  }, [token]);

  // Precarga los últimos datos guardados (si existen).
  useEffect(() => {
    if (!detalles && perfil?.destino_pago) setDetalles(perfil.destino_pago);
    if (!titular && perfil?.titular_pago) setTitular(perfil.titular_pago);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.destino_pago, perfil?.titular_pago]);

  const alcanzaSaldo = (p) => disponible >= p && saldoEncuestas >= p - 500;
  const usd = (p) => `$${(p / 1000).toLocaleString("es")}`;

  const canjear = async () => {
    setOkMsg("");
    setErrMsg("");

    if (!puntos) {
      setErrMsg(c.sinMonto);
      return;
    }

    setBusy(true);
    try {
      const res = await rpcSolicitarRetiroCanje(token, {
        metodo,
        puntos,
        detalles: detalles.trim(),
        titular: metodo === "paypal" ? titular.trim() : null,
      });

      if (!res?.success) {
        const code = res?.error || "default";
        const falta = Math.max(0, (puntos || 0) - 500 - saldoEncuestas);
        setErrMsg(fillRetiros(c.err[code] || c.err.default, { falta: falta.toLocaleString("es") }));
        // El bloqueo por país deja retener_pagos = true: hay que refrescar.
        if (code === "pais_no_coincide") await refreshPerfil(token, user.id);
        return;
      }

      setOkMsg(fillRetiros(c.ok, { usd: usd(puntos), metodo: c.historial[metodo] }));
      setPuntos(null);
      // Se guardan los datos como predeterminados para el próximo canje.
      updatePerfil(token, user.id, {
        destino_pago: detalles.trim(),
        titular_pago: metodo === "paypal" ? titular.trim() : "",
      }).catch(() => {});
      await refreshPerfil(token, user.id);
      if (onSaved) onSaved();
    } catch (e) {
      setErrMsg(e.message || c.err.default);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">{c.title}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{c.sub}</p>
      </div>

      {/* Método */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{c.metodo}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <BotonMetodo
            activo={metodo === "paypal"}
            onClick={() => setMetodo("paypal")}
            disabled={busy}
            label={c.paypal}
            logo={
              <div className="flex h-9 w-full items-center justify-center rounded-lg bg-white px-2 ring-1 ring-black/5">
                <PayPalLogo className="h-4 w-auto" />
              </div>
            }
          />
          <BotonMetodo
            activo={metodo === "binance"}
            onClick={() => setMetodo("binance")}
            disabled={busy}
            label={c.binance}
            logo={
              <div className="flex h-9 w-full items-center justify-center rounded-lg bg-[#0B0E11] px-2 ring-1 ring-white/10">
                <BinanceLogo className="h-4 w-auto" />
              </div>
            }
          />
        </div>
      </div>

      {/* Montos */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{c.monto}</p>
        <div className="grid grid-cols-2 gap-2">
          {montos.map((p) => {
            const activo = puntos === p;
            const alcanza = alcanzaSaldo(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPuntos(p)}
                disabled={busy}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  activo
                    ? "border-orange-500/60 bg-orange-500/10 ring-1 ring-orange-500/30"
                    : "border-border bg-background/40 hover:border-orange-500/30"
                } ${alcanza ? "" : "opacity-55"}`}
              >
                <span className="block font-display text-base font-bold text-foreground">{usd(p)} USD</span>
                <span className="block text-[11px] text-muted-foreground">
                  {p.toLocaleString("es")} pts
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="text-[11px] text-muted-foreground">
            {fillRetiros(c.minTier, { min: minimo.toLocaleString("es"), usd: usd(minimo) })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {fillRetiros(c.disponibleTxt, { pts: disponible.toLocaleString("es") })}
            {" · "}
            {c.saldoEncuestas}: {saldoEncuestas.toLocaleString("es")} pts
          </p>
        </div>
        {puntos && !alcanzaSaldo(puntos) && (
          <p className="mt-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
            {disponible < puntos
              ? fillRetiros(c.falta, { pts: (puntos - disponible).toLocaleString("es") })
              : c.bonoNota}
          </p>
        )}
      </div>

      {/* Datos de cobro */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {metodo === "paypal" ? c.paypalCampo : c.binanceCampo}
        </span>
        <input
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          placeholder={metodo === "paypal" ? c.paypalPh : c.binancePh}
          className="lb-input"
          autoComplete="off"
        />
      </label>

      {metodo === "paypal" && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{c.titular}</span>
          <input
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
            placeholder={c.titularPh}
            className="lb-input"
            autoComplete="off"
          />
        </label>
      )}

      {metodo === "paypal" && paypalFeeInfo && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-sky-200/90">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
          <p>{paypalFeeInfo}</p>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-muted-foreground/80">{c.bonoNota}</p>

      {errMsg && (
        <p className="flex items-start gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errMsg}</span>
        </p>
      )}
      {okMsg && (
        <p className="flex items-start gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] leading-relaxed text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{okMsg}</span>
        </p>
      )}

      <button
        type="button"
        onClick={canjear}
        disabled={busy || !puntos}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy
          ? c.procesando
          : puntos
          ? fillRetiros(c.canjear, { usd: usd(puntos) })
          : c.sinMonto}
      </button>
    </div>
  );
}

function BotonMetodo({ activo, onClick, disabled, label, logo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition disabled:opacity-50 ${
        activo
          ? "border-orange-500/60 bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30"
          : "border-border bg-card text-muted-foreground hover:border-orange-500/30"
      }`}
    >
      {logo}
      <span>{label}</span>
    </button>
  );
}
