import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { insertCampanaLocal, activarCampanaConSaldo, fetchAppConfig, uploadComprobanteToStorage } from "@/lib/supabaseClient";
import { compressImage } from "@/lib/imageCompress";
import { Megaphone, Loader2, Upload, ShieldCheck, Wallet, CreditCard, Info } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";
import {
  PaymentMethodSelector,
  getPaymentMethodLabel,
} from "@/components/latambucks/PaymentLogos";
import PaymentInstructions from "@/components/latambucks/PaymentInstructions";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function AnunciarAqui() {
  const { t } = useI18n();
  const { token, user, perfil, refreshPerfil } = useLatamBucks();
  // Saldo interno reintegrado de campañas anteriores (ya libre de comisión).
  const saldoPromo = Number(perfil?.saldo_promocion ?? 0);
  // Saldo disponible: ganancias + bono de bienvenida. La RPC consume
  // primero saldo_promocion y luego saldo_disponible, así que el total
  // disponible para campañas es la suma de ambos (un solo pool, sin duplicar).
  const saldoDisp = Number(perfil?.saldo_disponible ?? 0);
  const saldoTotal = saldoPromo + saldoDisp;
  // Saldo en USD (1000 pts = 1 USD). Los saldos del perfil están en puntos.
  const saldoTotalUSD = saldoTotal / 1000;

  const [form, setForm] = useState({
    email: user?.email || "",
    titulo: "",
    url: "",
    instrucciones: "",
    monto: "",
    puntos: "30",
  });
  // "externo" = pago con Payoneer/Airtm/PayPal + comprobante (como siempre).
  // "saldo" = usa el saldo promocional interno, sin comprobante ni pago externo.
  const [modoPago, setModoPago] = useState("externo");
  const [metodoExterno, setMetodoExterno] = useState("payoneer");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [paypalFeeInfo, setPaypalFeeInfo] = useState("");
  const [paypalFeeRate, setPaypalFeeRate] = useState(0.0449);
  const [paypalFeeFixed, setPaypalFeeFixed] = useState(0.30);
  const [comprobante, setComprobante] = useState(null);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchAppConfig(token, "paypal_fee_info")
      .then((fee) => { if (fee) setPaypalFeeInfo(String(fee)); })
      .catch(() => {});
    fetchAppConfig(token, "paypal_fee_rate")
      .then((v) => { if (v) setPaypalFeeRate(Number(v)); })
      .catch(() => {});
    fetchAppConfig(token, "paypal_fee_fixed")
      .then((v) => { if (v) setPaypalFeeFixed(Number(v)); })
      .catch(() => {});
  }, [token]);

  const monto = Number(form.monto) || 0;
  const puntos = Number(form.puntos) || 30;
  // Todo en USD para todos los usuarios. 1000 pts = 1 USD.
  // El 100% del monto base se reparte en tareas; la comisión del 30%
  // se suma al total que paga el anunciante (no se descuenta del cupo).
  const visitas = Math.floor(monto / (puntos / 1000));

  // Comisión del sitio (30%) — solo para pago externo. Con saldo interno
  // el dinero ya está en la plataforma (libre de comisión).
  const comisionSitio = (modoPago === "externo" && monto > 0)
    ? Math.round(monto * 0.30 * 100) / 100
    : 0;
  const baseConComision = Math.round((monto + comisionSitio) * 100) / 100;

  // Recargo de PayPal: el anunciante absorbe la tarifa de procesamiento.
  // Fórmula: X = (baseConComision + tarifa_fija) / (1 - tasa) → la plataforma
  // recibe `baseConComision` neto tras la comisión de PayPal. El recargo =
  // X - baseConComision se suma al total, pero NO se reembolsa al reintegrar
  // saldo (solo se devuelve el monto base por cupo).
  const esPaypal = modoPago === "externo" && metodoExterno === "paypal";
  const totalPaypal = esPaypal && monto > 0
    ? (baseConComision + paypalFeeFixed) / (1 - paypalFeeRate)
    : baseConComision;
  const recargoPaypal = esPaypal && monto > 0
    ? Math.round((totalPaypal - baseConComision) * 100) / 100
    : 0;
  const totalAPagar = esPaypal ? Math.round(totalPaypal * 100) / 100 : baseConComision;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Maneja la selección del comprobante de pago — comprime la imagen en el
  // cliente (WebP, máx 1200px, ~150 KB) antes de subirla a Supabase Storage.
  const handleComprobanteChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setSubiendoComprobante(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadComprobanteToStorage(token, compressed, user.id);
      setComprobante(compressed);
      setComprobanteUrl(url);
    } catch (e2) {
      setErr(t("pub.err.subir"));
      setComprobante(null);
      setComprobanteUrl("");
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const submit = async () => {
    setErr("");
    setOk(false);
    if (!form.email || !form.titulo || !form.url || !form.monto) {
      setErr(t("pub.err.campos"));
      return;
    }
    if (monto < 5) {
      setErr(t("pub.err.min"));
      return;
    }
    if (Number(form.puntos) < 30) {
      setErr(t("pub.err.puntos"));
      return;
    }
    if (modoPago === "saldo") {
      if (saldoTotalUSD <= 0) {
        setErr(t("pub.err.sinSaldo"));
        return;
      }
      if (monto > saldoTotalUSD) {
        setErr(t("pub.err.saldoInsuf", {
          m: saldoTotalUSD.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        }));
        return;
      }
    } else if (!comprobanteUrl) {
      setErr(t("pub.err.comprobante"));
      return;
    }
    setBusy(true);
    try {
      const gananciaPlataforma = Math.round(monto * 0.30 * 100) / 100;
      // Con saldo interno el dinero ya está dentro de la plataforma: no hace
      // falta comprobante ni revisión humana, la campaña se activa directa.
      const esSaldo = modoPago === "saldo";
      if (esSaldo) {
        await activarCampanaConSaldo(token, {
          titulo: form.titulo,
          enlace_url: form.url,
          instrucciones: form.instrucciones.trim(),
          puntos_recompensa: Number(form.puntos),
          monto: monto,
          anunciante_email: form.email,
          moneda: "USD",
          visitas_compradas: visitas,
        });
        refreshPerfil(token, user.id).catch(() => {});
      } else {
        await insertCampanaLocal(token, {
          titulo: form.titulo,
          enlace_url: form.url,
          instrucciones: form.instrucciones.trim() || null,
          puntos_recompensa: Number(form.puntos),
          monto_invertido_ars: monto,
          anunciante_email: form.email,
          moneda: "USD",
          visitas_compradas: visitas,
          ganancia_plataforma: gananciaPlataforma,
          comprobante_pago_url: comprobanteUrl,
          pago_con_saldo: false,
          estado_pago: "pendiente",
          activa: false,
          paypal_surcharge: esPaypal ? recargoPaypal : 0,
        });
      }
      setOk(true);
      setForm({ email: user?.email || "", titulo: "", url: "", instrucciones: "", monto: "", puntos: "30" });
      setComprobante(null);
      setComprobanteUrl("");
      setModoPago("externo");
    } catch (e) {
      setErr(e.message || t("pub.err.enviar"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/30 bg-card p-4">
      <div className="flex items-center gap-2.5">
        <Icon3D name="megaphone" className="h-11 w-11 rounded-xl shadow-lg shadow-black/30" />
        <div>
          <p className="text-sm font-semibold text-foreground">{t("pub.title")}</p>
          <p className="text-[11px] text-muted-foreground">{t("pub.sub")}</p>
        </div>
      </div>

      {/* Selector del modo de pago */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setModoPago("externo"); setErr(""); }}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
            modoPago === "externo"
              ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          {t("pub.externo")}
        </button>
        <button
          type="button"
          onClick={() => { setModoPago("saldo"); setErr(""); }}
          disabled={saldoTotalUSD <= 0}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition disabled:opacity-40 ${
            modoPago === "saldo"
              ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <Wallet className="h-4 w-4" />
          {t("pub.saldo")}
        </button>
      </div>
      {modoPago === "saldo" && (
        <div className="space-y-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("pub.saldoDisp")}</span>
            <span className="font-display text-lg font-bold text-violet-400">
              ${saldoTotalUSD.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
          {saldoDisp > 0 && (
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {t("pub.saldoNota")}
            </p>
          )}
        </div>
      )}

      {modoPago === "externo" && (
        <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">{t("pub.metodoLbl")}</p>
          <PaymentMethodSelector value={metodoExterno} onChange={(m) => { setMetodoExterno(m); setErr(""); }} />

          {/* Aviso de comisión de PayPal */}
          {metodoExterno === "paypal" && paypalFeeInfo && (
            <div className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-xs leading-relaxed text-sky-200/90">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <p>{paypalFeeInfo}</p>
            </div>
          )}

          {/* Instrucciones de pago según el método elegido */}
          <PaymentInstructions metodo={metodoExterno} />
        </div>
      )}

      <div className="space-y-3">
        <Field label={t("pub.email")}>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="anunciante@email.com"
            className="lb-input"
          />
        </Field>
        <Field label={t("pub.titulo")}>
          <input
            type="text"
            value={form.titulo}
            onChange={set("titulo")}
            placeholder={t("pub.tituloPh")}
            className="lb-input"
          />
        </Field>
        <Field label={t("pub.url")}>
          <input
            type="url"
            value={form.url}
            onChange={set("url")}
            placeholder="https://..."
            className="lb-input"
          />
        </Field>
        <Field label={t("pub.instr")}>
          <textarea
            value={form.instrucciones}
            onChange={set("instrucciones")}
            placeholder={t("pub.instrPh")}
            rows={4}
            className="lb-input resize-none"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {t("pub.instrHelp")}
          </p>
        </Field>
        <Field label={modoPago === "saldo" ? t("pub.montoSaldo") : t("pub.monto")}>
          <input
            type="number"
            min={5}
            value={form.monto}
            onChange={set("monto")}
            placeholder={t("pub.montoPh")}
            className="lb-input"
          />
        </Field>
        <Field label={t("pub.puntos")}>
          <input
            type="number"
            min="30"
            value={form.puntos}
            onChange={set("puntos")}
            className="lb-input"
          />
        </Field>

        {/* Comprobante de pago — solo para pago externo. Con saldo interno no hace falta. */}
        {modoPago === "externo" && (
          <Field label={t("pub.comprobante")}>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground transition hover:border-orange-500/40">
              {subiendoComprobante ? (
                <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
              ) : (
                <Upload className="h-4 w-4 text-orange-400" />
              )}
              <span className="truncate">
                {subiendoComprobante
                  ? t("pub.subiendo")
                  : comprobante
                  ? `✓ ${comprobante.name}`
                  : t("pub.subir")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleComprobanteChange}
                disabled={subiendoComprobante}
              />
            </label>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t("pub.comprHelp")}
            </p>
          </Field>
        )}
        {modoPago === "saldo" && (
          <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {t("pub.saldoNota2a")}<span className="font-semibold text-violet-400">{t("pub.saldoInmediato")}</span>{t("pub.saldoNota2b")}
          </p>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">
            {t("pub.cupos")}
          </span>
          <span className="font-display text-lg font-bold text-orange-400">
            {visitas.toLocaleString("es")}
          </span>
        </div>

        {/* Desglose de cobro — visible siempre que haya monto */}
        {monto > 0 && (
          <div className="space-y-1.5 rounded-xl border border-border bg-background/50 px-3 py-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("pub.inv")}</span>
              <span className="font-medium text-foreground">
                ${monto.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            {comisionSitio > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("pub.comision")}</span>
                <span className="font-medium text-orange-400">
                  +${comisionSitio.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            )}
            {esPaypal && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("pub.recargo", { r: (paypalFeeRate * 100).toFixed(2), f: paypalFeeFixed.toFixed(2) })}</span>
                <span className="font-medium text-sky-300">
                  +${recargoPaypal.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-1.5">
              <span className="font-semibold text-foreground">
                {modoPago === "saldo" ? t("pub.totalSaldo") : esPaypal ? t("pub.totalPaypal") : t("pub.total")}
              </span>
              <span className={`font-display text-base font-bold ${esPaypal ? "text-sky-300" : "text-orange-400"}`}>
                ${totalAPagar.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            {esPaypal && (
              <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                {t("pub.recargoNota")}
              </p>
            )}
          </div>
        )}

        {ok && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {modoPago === "saldo" ? (
                <>
                  <strong className="font-semibold">{t("pub.ok.saldoTitle")} </strong>
                  {t("pub.ok.saldoBody")}
                </>
              ) : (
                <>
                  <strong className="font-semibold">{t("pub.ok.pendTitle")}</strong>{" "}
                  {t("pub.ok.pendBodyA")}{getPaymentMethodLabel(metodoExterno)}{t("pub.ok.pendBodyB")}
                </>
              )}
            </span>
          </div>
        )}
        {err && (
          <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition disabled:opacity-60 ${
            modoPago === "saldo"
              ? "border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
              : "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          {modoPago === "saldo" ? t("pub.btnSaldo") : t("pub.btnEnviar")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}