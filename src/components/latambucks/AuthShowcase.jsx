import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  TrendingUp,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { getCountryFlag } from "@/components/latambucks/countryFlags";
import { CPX_LOGO_URL } from "@/lib/cpxOfferWall";
import { authHero1, authHero2, authHero3, authHero4, authHero5 } from "@/lib/localAssets";
import { useI18n } from "@/lib/i18n/LanguageContext";

import { localFlag } from "@/lib/localFlags";
import THEOREMREACH_LOGO_URL from "@/assets/theoremreach-logo.png";
import ICON_MULT_URL from "@/assets/external/icon-multiplier.png";
import ICON_WITHDRAWALS_URL from "@/assets/external/icon-withdrawals.png";
import TIMEWALL_LOGO_URL from "@/assets/external/timewall-icon.png";

// Imagen 3D de Caja Sorpresa — misma que usa CajaSlider dentro del sitio.
const CAJA_3D_URL = authHero1;
// Ícono 3D del Bono de bienvenida (generado, estilo casino).
const BONO_3D_URL = authHero2;
// Ícono 3D de smartphone para CPAGrip (apps y juegos).
const APPS_3D_URL = authHero3;
// Ícono 3D de anuncio recompensado para Monetag.
const MONETAG_3D_URL = authHero4;
// Ícono 3D de la ruleta del Multiplicador de puntos.
const MULT_3D_URL = ICON_MULT_URL;
// Ícono 3D de retiros (billetera con billetes y monedas).
const RETIROS_3D_URL = ICON_WITHDRAWALS_URL;

// Tarjetas explicativas del slider — cada feature del sitio con su ícono/logo,
// título, descripción corta y tag de recompensa. El slider auto-rota cada 3.5s.
const FEATURES = [
  {
    id: "cpx",
    type: "logo",
    logo: CPX_LOGO_URL,
    logoFit: "object-contain",
    title: "auths.feat.cpx.title",
    desc: "auths.feat.cpx.desc",
    tag: "auths.feat.cpx.tag",
    reward: "+500 pts",
    accent: "from-sky-500/25 to-sky-600/5",
    ring: "ring-sky-500/30",
    glow: "bg-sky-500/20",
  },
  {
    id: "theoremreach",
    type: "logo",
    logo: THEOREMREACH_LOGO_URL,
    logoFit: "object-contain",
    title: "auths.feat.theoremreach.title",
    desc: "auths.feat.theoremreach.desc",
    tag: "auths.feat.theoremreach.tag",
    reward: "+800 pts",
    accent: "from-emerald-500/25 to-emerald-600/5",
    ring: "ring-emerald-500/30",
    glow: "bg-emerald-500/20",
  },
  {
    id: "timewall",
    type: "logo",
    logo: TIMEWALL_LOGO_URL,
    logoFit: "object-contain",
    title: "auths.feat.timewall.title",
    desc: "auths.feat.timewall.desc",
    tag: "auths.feat.timewall.tag",
    reward: "+1000 pts",
    accent: "from-rose-500/25 to-rose-600/5",
    ring: "ring-rose-500/30",
    glow: "bg-rose-500/20",
  },
  {
    id: "cpagrip",
    type: "image",
    image: APPS_3D_URL,
    title: "auths.feat.cpagrip.title",
    desc: "auths.feat.cpagrip.desc",
    tag: "auths.feat.cpagrip.tag",
    reward: "+1000 pts",
    accent: "from-violet-500/25 to-violet-600/5",
    ring: "ring-violet-500/30",
    glow: "bg-violet-500/20",
  },
  {
    id: "monetag",
    type: "image",
    image: MONETAG_3D_URL,
    title: "auths.feat.monetag.title",
    desc: "auths.feat.monetag.desc",
    tag: "auths.feat.monetag.tag",
    reward: "+100 pts",
    accent: "from-orange-500/25 to-orange-600/5",
    ring: "ring-orange-500/30",
    glow: "bg-orange-500/20",
  },
  {
    id: "multiplicador",
    type: "image",
    image: MULT_3D_URL,
    title: "auths.feat.mult.title",
    desc: "auths.feat.mult.desc",
    tag: "auths.feat.mult.tag",
    reward: "auths.feat.mult.reward",
    accent: "from-amber-500/25 to-amber-600/5",
    ring: "ring-amber-500/30",
    glow: "bg-amber-500/20",
  },
  {
    id: "bono",
    type: "image",
    image: BONO_3D_URL,
    title: "auths.feat.bono.title",
    desc: "auths.feat.bono.desc",
    tag: "auths.feat.bono.tag",
    reward: "auths.feat.bono.reward",
    accent: "from-pink-500/25 to-pink-600/5",
    ring: "ring-pink-500/30",
    glow: "bg-pink-500/20",
  },
  {
    id: "retiros",
    type: "image",
    image: RETIROS_3D_URL,
    title: "auths.feat.retiros.title",
    desc: "auths.feat.retiros.desc",
    tag: "auths.feat.retiros.tag",
    reward: "auths.feat.retiros.reward",
    accent: "from-teal-500/25 to-emerald-600/5",
    ring: "ring-teal-500/30",
    glow: "bg-teal-500/20",
  },
];

// Simulación de usuarios en vivo — datos de marketing para la pantalla de
// autenticación (sin token, no se consulta el backend). Muestra actividad
// realista con países de Latam y puntos variables.
const LIVE_USERS = [
  { user: "María G.", country: "Argentina", pts: 850, task: "auths.live.cpx" },
  { user: "Carlos R.", country: "México", pts: 1200, task: "auths.live.app" },
  { user: "Lucía P.", country: "Colombia", pts: 500, task: "auths.live.theorem" },
  { user: "Diego M.", country: "Chile", pts: 100, task: "auths.live.mult" },
  { user: "Ana T.", country: "Perú", pts: 1000, task: "auths.live.timewall" },
  { user: "Jorge L.", country: "Uruguay", pts: 320, task: "auths.live.cpx" },
  { user: "Valeria S.", country: "Paraguay", pts: 750, task: "auths.live.monetag" },
  { user: "Roberto F.", country: "Ecuador", pts: 1500, task: "auths.live.app" },
  { user: "Camila N.", country: "Bolivia", pts: 80, task: "auths.live.mult" },
  { user: "Fernando A.", country: "Venezuela", pts: 600, task: "auths.live.timewallSurvey" },
];

const COIN_ICON_URL = authHero5;

export default function AuthShowcase() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [liveIdx, setLiveIdx] = useState(0);

  // Auto-rotación del slider de features
  useEffect(() => {
    const t = setInterval(() => {
      setActive((p) => (p + 1) % FEATURES.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // Rotación de usuarios en vivo cada 2.5s
  useEffect(() => {
    const t = setInterval(() => {
      setLiveIdx((p) => (p + 1) % LIVE_USERS.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const feature = FEATURES[active];
  const live = LIVE_USERS[liveIdx];

  return (
    <div className="relative z-10 mt-6 space-y-5">
      {/* ===== Slider de features explicativas ===== */}
      <div className="w-[85%] sm:w-[92%]">
        <div className="mb-2.5 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-orange-400" />
          <p className="font-display text-sm font-bold tracking-wide text-foreground">
            {t("auths.howTo")}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 shadow-[0_8px_32px_-12px] shadow-black/50 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`relative flex items-center gap-3.5 overflow-hidden bg-gradient-to-br ${feature.accent} p-4`}
            >
              {/* Glow de fondo */}
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${feature.glow} blur-2xl`}
              />
              {/* Brillo que barre la tarjeta */}
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.8, ease: "easeInOut", delay: 0.3 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              {/* Logo, imagen 3D o ícono del feature */}
              <div className="relative shrink-0">
                {feature.type === "logo" ? (
                  <div className="relative flex h-14 w-20 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg shadow-black/30 ring-1 ring-white/10">
                    <img
                      src={feature.logo}
                      alt={t(feature.title)}
                      className={`h-full w-full ${feature.logoFit}`}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-transparent to-black/10" />
                  </div>
                ) : feature.type === "image" ? (
                  <div className={`relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${feature.accent} p-1 ring-1 ${feature.ring} shadow-lg shadow-black/30`}>
                    <Image
                      src={feature.image}
                      alt={t(feature.title)}
                      fittingType="fill"
                      className="h-full w-full rounded-lg"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-14 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} ring-1 ${feature.ring} shadow-lg shadow-black/30`}
                  >
                    <feature.icon className="h-7 w-7 text-foreground" />
                  </div>
                )}
              </div>

              {/* Texto */}
              <div className="relative min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t(feature.tag)}
                  </span>
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    {t(feature.reward)}
                  </span>
                </div>
                <p className="font-display text-sm font-bold text-foreground">
                  {t(feature.title)}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {t(feature.desc)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-orange-400" : "w-1.5 bg-border hover:bg-orange-500/40"
                }`}
                aria-label={`${t("auths.see")} ${t(f.title)}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===== Usuarios en vivo ===== */}
      <div className="ml-auto w-[85%] sm:w-[92%]">
        <LiveUsers user={live} />
      </div>
    </div>
  );
}

function LiveUsers({ user }) {
  const { t } = useI18n();
  const flagEmoji = useMemo(() => getCountryFlag(user.country), [user.country]);
  const flagChars = Array.from(flagEmoji);
  const isFlag =
    flagChars.length === 2 &&
    flagChars.every((c) => {
      const p = c.codePointAt(0);
      return p >= 0x1f1e6 && p <= 0x1f1ff;
    });
  const countryCode = isFlag
    ? flagChars.map((c) => String.fromCharCode(c.codePointAt(0) - 0x1f1e6 + 97)).join("")
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/60 to-card/60 p-4 backdrop-blur-sm">
      {/* Halos animados */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-3xl"
      />

      <div className="relative mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Users className="h-4 w-4 text-emerald-400" />
        </div>
        <p className="font-display text-sm font-bold tracking-wide text-emerald-300">
          {t("auths.liveUsers")}
        </p>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t("auths.live")}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={userKey(user)}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur-sm"
        >
          {/* Avatar moneda 3D */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-amber-500/30">
            <Image
              src={COIN_ICON_URL}
              alt={t("auths.coin")}
              fittingType="fill"
              className="h-full w-full"
            />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <motion.span
                key={`pts-${user.pts}`}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="font-display text-lg font-bold text-amber-300"
              >
                +{user.pts.toLocaleString("es")}
              </motion.span>
              <span className="text-[11px] font-medium text-muted-foreground">pts</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {localFlag(countryCode) ? (
                <div
                  title={user.country}
                  className="relative h-5 w-5 shrink-0 overflow-hidden rounded-sm ring-1 ring-white/20 shadow-md shadow-black/40"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(0,0,0,0.25))",
                  }}
                >
                  <Image
                    src={localFlag(countryCode)}
                    alt={t("auths.flag", { country: user.country })}
                    fittingType="fill"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-sm bg-gradient-to-br from-white/25 via-transparent to-black/25" />
                </div>
              ) : (
                <span className="text-sm leading-none">{flagEmoji}</span>
              )}
              <span className="truncate font-medium text-foreground">{user.user}</span>
            </div>
            <p className="truncate text-[11px] font-semibold text-emerald-300/80">
              {t(user.task)}
            </p>
          </div>

          {/* Trophy decorativo */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-600/10 ring-1 ring-amber-500/30"
          >
            <Trophy className="h-4 w-4 text-amber-300" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper para key único del AnimatePresence
function userKey(u) {
  return u.user + u.pts;
}