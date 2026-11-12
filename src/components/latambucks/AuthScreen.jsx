import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLatamBucks } from "@/lib/latambucksStore";
import { supabaseRecoverPassword } from "@/lib/supabaseClient";
import {
  ArrowRight,
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Clock,
} from "lucide-react";
import SiteFooter from "@/components/latambucks/SiteFooter";
import BlogSection from "@/components/latambucks/BlogSection";
import FloatingIcons from "@/components/latambucks/FloatingIcons";
import AuthShowcase from "@/components/latambucks/AuthShowcase";
import AuthPaymentAndAds from "@/components/latambucks/AuthPaymentAndAds";
import CountrySelector from "@/components/latambucks/CountrySelector";
import LanguagePicker from "@/components/latambucks/LanguagePicker";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { Image } from "@/components/ui/image";
import { authHero1, brandLogo } from "@/lib/localAssets";
import CTA_3D_URL from "@/assets/external/icon-earn.png";

const LOGO_URL = brandLogo;

export default function AuthScreen({ initialMode = "login" }) {
  const { t } = useI18n();
  const { login, register, authError } = useLatamBucks();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pais, setPais] = useState("Latam");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState("");
  const [confirmMsg, setConfirmMsg] = useState(false);

  // Recuperación de contraseña
  const [recoverOk, setRecoverOk] = useState(false);

  // Código de referido desde la URL (?ref=CODIGO)
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const ref = query.get("ref");
    if (ref) setRefCode(ref);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLocalErr("");
    setConfirmMsg(false);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const res = await register(email, password, pais, refCode);
        if (res?.needsConfirmation) {
          setConfirmMsg(true);
          return;
        }
      }
      navigate("/", { replace: true });
    } catch (err) {
      setLocalErr(err.message || t("auth.err.generic"));
    } finally {
      setBusy(false);
    }
  };

  const sendRecovery = async (e) => {
    e.preventDefault();
    setLocalErr("");
    setBusy(true);
    try {
      await supabaseRecoverPassword(email);
      setRecoverOk(true);
    } catch (err) {
      setLocalErr(err.message || t("auth.err.mail"));
    } finally {
      setBusy(false);
    }
  };

  const error = localErr || authError;

  // ---- Pantalla: recuperar contraseña ----
  if (mode === "recuperar") {
    return (
      <div className="relative min-h-screen flex flex-col justify-center px-6 py-10 overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <LanguagePicker />
        </div>
        <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]" />

        <div className="relative z-10 mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-500/10 shadow-[0_0_30px_-5px] shadow-violet-500/40">
            <Mail className="h-7 w-7 text-violet-400" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("auth.recover.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.recover.sub")}
          </p>
        </div>

        <form onSubmit={sendRecovery} className="relative z-10 rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-xl space-y-4">
          {recoverOk ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl bg-orange-500/10 px-4 py-3 text-sm text-orange-400">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  {t("auth.recover.sentA")}<strong>{email}</strong>{t("auth.recover.sentB")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setRecoverOk(false);
                  setLocalErr("");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-medium text-orange-950 transition hover:bg-orange-400"
              >
                {t("auth.back")}
              </button>
            </div>
          ) : (
            <>
              <Field label={t("auth.email")}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPh")}
                  className="lb-input"
                />
              </Field>
              {error && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>{t("auth.recover.send")}</>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setLocalErr("");
              setRecoverOk(false);
            }}
            className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.back")}
          </button>
        </form>
      </div>
    );
  }

  // ---- Pantalla: landing page con login/registro al costado ----
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient glows — contenedor fixed con overflow-hidden evita scroll horizontal en móvil */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[120px]" />
      </div>
      <FloatingIcons />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
        <div className="mb-4 flex justify-end">
          <LanguagePicker />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-10">
          {/* ===== Columna izquierda: Landing page persuasiva ===== */}
          <div className="order-2 space-y-6 lg:order-1 lg:space-y-8">
            {/* Hero */}
            <div className="text-center lg:text-left">
              <div className="mb-5 flex items-center justify-center gap-4 lg:justify-start">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl" />
                  <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-orange-500/40 shadow-[0_0_40px_-4px] shadow-orange-500/60">
                    <img
                      src={LOGO_URL}
                      alt="LatamBucks"
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  </div>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  Latam<span className="text-orange-400">Bucks</span>
                </h1>
              </div>
              <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {t("auth.hero.a")}
                <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                  {t("auth.hero.b")}
                </span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:mx-0 md:text-base">
                {t("auth.hero.d1")}
                <span className="font-bold text-orange-400">{t("auth.hero.d2")}</span>{t("auth.hero.d3")}
                <span className="font-semibold text-violet-400">{t("auth.hero.d4")}</span>{t("auth.hero.d5")}
                <span className="font-bold text-orange-400">{t("auth.hero.d6")}</span>{t("auth.hero.d7")}
              </p>

              {/* Bono destacado */}
              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/15 to-amber-500/10 px-5 py-3 shadow-[0_0_30px_-8px] shadow-orange-500/30">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <img
                    src={authHero1}
                    alt={t("auth.alt.gift")}
                    className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(249,115,22,0.4)]"
                    loading="eager"
                  />
                </div>
                <div className="text-left">
                  <p className="font-display text-sm font-bold text-orange-300">
                    {t("auth.bonus.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("auth.bonus.sub")}
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficios rápidos */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Benefit icon={TrendingUp} title={t("auth.ben1.t")} desc={t("auth.ben1.d")} color="orange" />
              <Benefit icon={Clock} title={t("auth.ben2.t")} desc={t("auth.ben2.d")} color="violet" />
              <Benefit icon={ShieldCheck} title={t("auth.ben3.t")} desc={t("auth.ben3.d")} color="emerald" />
              <Benefit icon={Wallet} title={t("auth.ben4.t")} desc={t("auth.ben4.d")} color="sky" />
            </div>

          </div>

          {/* ===== Columna derecha: Formulario de login/registro (compacto) ===== */}
          <div className="order-1 mx-auto w-full max-w-[320px] lg:order-2 lg:mx-0 lg:sticky lg:top-6 lg:self-start lg:max-w-none">
            <div id="auth-form" className="rounded-2xl border border-white/10 bg-card/80 p-4 shadow-[0_8px_40px_-12px] shadow-black/60 backdrop-blur-xl sm:p-5">
              {/* Tabs */}
              <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-background/60 p-0.5">
                {["login", "registro"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-md py-1.5 text-xs font-medium transition ${
                      mode === m
                        ? "bg-orange-500 text-orange-950 shadow-[0_0_16px_-4px] shadow-orange-500/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {m === "login" ? t("auth.tab.login") : t("auth.tab.register")}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-2.5">
                <Field label={t("auth.email")}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPh")}
                    className="lb-input py-2.5 text-sm"
                  />
                </Field>
                <Field label={t("auth.password")}>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="lb-input py-2.5 text-sm"
                  />
                </Field>
                {mode === "login" && (
                  <div className="flex justify-end -mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("recuperar");
                        setLocalErr("");
                      }}
                      className="text-[11px] text-orange-400 transition hover:text-orange-300"
                    >
                      {t("auth.forgot")}
                    </button>
                  </div>
                )}
                {mode === "registro" && (
                  <div>
                    <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                      {t("auth.country")} <span className="text-orange-400">*</span>
                    </span>
                    <CountrySelector value={pais} onChange={setPais} />
                  </div>
                )}

                {confirmMsg && (
                  <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                    {t("auth.msg.confirmEmail")}
                  </p>
                )}

                {error && (
                  <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-orange-950 transition hover:bg-orange-400 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? t("auth.submit.login") : t("auth.submit.register")}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {mode === "registro" && (
                <p className="mt-2.5 text-center text-[10px] text-muted-foreground">
                  {t("auth.reg.bonusA")}<span className="font-bold text-orange-400">{t("auth.reg.bonusB")}</span>{t("auth.reg.bonusC")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Showcases a ancho completo, intercalados */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <AuthShowcase />
        <AuthPaymentAndAds />
      </div>

      {/* CTA final centrado a ancho completo */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-orange-500/40 bg-card/80 p-6 text-center shadow-[0_8px_40px_-12px] shadow-orange-500/20 backdrop-blur-xl">
          <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-orange-500/40 shadow-[0_10px_28px_-8px] shadow-black/60">
            <Image
              src={CTA_3D_URL}
              alt=""
              fittingType="fill"
              className="h-full w-full"
            />
          </div>
          <p className="font-display text-lg font-bold text-foreground">
            {t("auth.cta.title")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.cta.sub")}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("registro");
              document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-orange-950 transition hover:bg-orange-400"
          >
            {t("auth.cta.btn")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Blog al final de la landing (los artículos son públicos y ayudan al SEO) */}
      <BlogSection />

      {/* Footer a ancho completo, centrado */}
      <SiteFooter />
    </div>
  );
}

function Benefit({ icon: Icon, title, desc, color }) {
  const colors = {
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  };
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl border ${colors[color]} p-3 text-center`}>
      <Icon className="h-5 w-5" />
      <div>
        <p className="text-xs font-bold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
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