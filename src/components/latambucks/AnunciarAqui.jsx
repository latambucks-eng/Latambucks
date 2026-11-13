import React, { useState } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { activarCampanaConSaldo } from "@/lib/supabaseClient";
import { Megaphone, Loader2, ShieldCheck, Wallet } from "lucide-react";
import Icon3D from "@/components/latambucks/Icon3D";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Creación de campañas pagando con el saldo interno (saldo_promocion +
// saldo_disponible). El anunciante recarga ese saldo arriba con cripto o
// PayPal; la comisión del 30%, el descuento por tarea y el reintegro de
// cupos los sigue resolviendo la RPC activar_campana_con_saldo.
export default function AnunciarAqui() {
  const { t } = useI18n();
  const { token, user, perfil, refreshPerfil } = useLatamBucks();
  // Saldo interno reintegrado de campañas anteriores (ya libre de comisión).
  const saldoPromo = Number(perfil?.saldo_promocion ?? 0);
  // Saldo disponible: ganancias + bono de bienvenida. La RPC consume
  // primero saldo_promocion y luego saldo_disponible, así que el total
  // disponible para campañas es la suma de ambos (un solo pool).
  const saldoDisp = Number(perfil?.saldo_disponible ?? 0);
  const saldoTotal = saldoPromo + saldoDisp;
  const saldoTotalUSD = saldoTotal / 1000;

  const [form, setForm] = useState({
    email: user?.email || "",
    titulo: "",
    url: "",
    instrucciones: "",
    monto: "",
    puntos: "30",
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const monto = Number(form.monto) || 0;
  const puntos = Number(form.puntos) || 30;
  // Todo en USD para todos los usuarios. 1000 pts = 1 USD.
  const visitas = Math.floor(monto / (puntos / 1000));

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
    setBusy(true);
    try {
      // La RPC valida saldos, descuenta cupos + comisión del 30% y activa
      // la campaña de forma atómica (sin comprobante ni revisión humana).
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
      setOk(true);
      setForm({ email: user?.email || "", titulo: "", url: "", instrucciones: "", monto: "", puntos: "30" });
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

      <div className="space-y-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-violet-400" />
            {t("pub.saldoDisp")}
          </span>
          <span className="font-display text-lg font-bold text-violet-400">
            ${saldoTotalUSD.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>
        {saldoDisp > 0 && (
          <p className="text-[10px] leading-relaxed text-muted-foreground">{t("pub.saldoNota")}</p>
        )}
      </div>

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
          <p className="mt-1 text-[10px] text-muted-foreground">{t("pub.instrHelp")}</p>
        </Field>
        <Field label={t("pub.montoSaldo")}>
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

        <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("pub.saldoNota2a")}
          <span className="font-semibold text-violet-400">{t("pub.saldoInmediato")}</span>
          {t("pub.saldoNota2b")}
        </p>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">{t("pub.cupos")}</span>
          <span className="font-display text-lg font-bold text-orange-400">
            {visitas.toLocaleString("es")}
          </span>
        </div>

        {monto > 0 && (
          <div className="space-y-1.5 rounded-xl border border-border bg-background/50 px-3 py-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("pub.inv")}</span>
              <span className="font-medium text-foreground">
                ${monto.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-1.5">
              <span className="font-semibold text-foreground">{t("pub.totalSaldo")}</span>
              <span className="font-display text-base font-bold text-orange-400">
                ${monto.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>
        )}

        {ok && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">{t("pub.ok.saldoTitle")} </strong>
              {t("pub.ok.saldoBody")}
            </span>
          </div>
        )}
        {err && (
          <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 py-3 text-sm font-semibold text-violet-400 transition hover:bg-violet-500/20 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          {t("pub.btnSaldo")}
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
