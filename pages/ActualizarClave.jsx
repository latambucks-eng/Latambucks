import React, { useState, useEffect } from "react";
import { supabaseUpdatePassword } from "@/lib/supabaseClient";
import { KeyRound, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import SeoHead from "@/components/latambucks/SeoHead";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function ActualizarClave() {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenHash, setTokenHash] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const type = params.get("type") || query.get("type");
    if (type === "recovery") {
      const at = params.get("access_token") || query.get("access_token");
      const th = params.get("token_hash") || query.get("token_hash");
      if (at) setToken(at);
      else if (th) setTokenHash(th);
    }
    setReady(true);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (newPass.length < 6) {
      setErr(t("reset.err.short"));
      return;
    }
    if (newPass !== confirmPass) {
      setErr(t("reset.err.match"));
      return;
    }
    setBusy(true);
    try {
      const res = await supabaseUpdatePassword(token, tokenHash, newPass);
      if (res?.success) {
        setOk(true);
        // Limpiar cualquier sesión anterior de Supabase para que se vea el login
        localStorage.removeItem("lb_token");
        setTimeout(() => {
          window.location.href = window.location.origin;
        }, 1000);
      } else {
        setErr(res?.data?.error || t("reset.err.fail"));
      }
    } catch (e) {
      setErr(e.message || t("reset.err.fail"));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!token && !tokenHash) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">
            {t("reset.invalid")}
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm font-medium text-orange-400 hover:text-orange-300"
          >
            {t("reset.home")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center px-6 py-10 overflow-hidden">
      <SeoHead
        title={t("reset.seoTitle")}
        description={t("reset.seoDesc")}
        path="/actualizar-clave"
      />
      <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]" />

      <div className="relative z-10 mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 shadow-[0_0_30px_-5px] shadow-orange-500/40">
          <KeyRound className="h-7 w-7 text-orange-400" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {t("reset.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reset.sub")}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="relative z-10 mx-auto w-full max-w-sm rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-xl space-y-4"
      >
        <Field label={t("reset.new")}>
          <input
            type="password"
            required
            minLength={6}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="••••••••"
            className="lb-input"
          />
        </Field>
        <Field label={t("reset.confirm")}>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="••••••••"
            className="lb-input"
          />
        </Field>

        {ok && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/15 px-3 py-2 text-xs font-medium text-green-400">
            <CheckCircle2 className="h-4 w-4" /> {t("reset.okMsg")}
          </div>
        )}
        {err && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>
        )}

        <button
          type="submit"
          disabled={busy || ok}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t("reset.save")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}