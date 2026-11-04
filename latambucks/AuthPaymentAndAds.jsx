import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Megaphone, Users, Smartphone, Globe, Store, Sparkles, Gift, CalendarClock, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Tarjetas del slider de retiros — explica el ciclo de facturación semanal
// del sitio: acumulación → corte → procesamiento → pago en USD.
const WITHDRAWAL_CARDS = [
  {
    id: "viernes",
    icon: Wallet,
    title: "authw.wd.viernes.title",
    desc: "authw.wd.viernes.desc",
    tag: "authw.wd.viernes.tag",
    accent: "from-orange-500/30 to-amber-600/5",
    ring: "ring-orange-500/40",
    glow: "bg-orange-500/25",
    iconBg: "from-orange-500 to-amber-600",
  },
  {
    id: "corte",
    icon: CalendarClock,
    title: "authw.wd.corte.title",
    desc: "authw.wd.corte.desc",
    tag: "authw.wd.corte.tag",
    accent: "from-violet-500/30 to-indigo-600/5",
    ring: "ring-violet-500/40",
    glow: "bg-violet-500/25",
    iconBg: "from-violet-500 to-indigo-600",
  },
  {
    id: "acumulacion",
    icon: Clock,
    title: "authw.wd.acumulacion.title",
    desc: "authw.wd.acumulacion.desc",
    tag: "authw.wd.acumulacion.tag",
    accent: "from-sky-500/30 to-cyan-600/5",
    ring: "ring-sky-500/40",
    glow: "bg-sky-500/25",
    iconBg: "from-sky-500 to-cyan-600",
  },
  {
    id: "usd",
    icon: DollarSign,
    title: "authw.wd.usd.title",
    desc: "authw.wd.usd.desc",
    tag: "authw.wd.usd.tag",
    accent: "from-emerald-500/30 to-teal-600/5",
    ring: "ring-emerald-500/40",
    glow: "bg-emerald-500/25",
    iconBg: "from-emerald-500 to-teal-600",
  },
  {
    id: "automatico",
    icon: CheckCircle2,
    title: "authw.wd.automatico.title",
    desc: "authw.wd.automatico.desc",
    tag: "authw.wd.automatico.tag",
    accent: "from-teal-500/30 to-emerald-600/5",
    ring: "ring-teal-500/40",
    glow: "bg-teal-500/25",
    iconBg: "from-teal-500 to-emerald-600",
  },
];

// Tarjetas del slider de anunciantes — cada una con un caso de uso distinto,
// ícono 3D, título, descripción persuasiva y tag. Auto-rota cada 3.5s.
const ADVERTISER_CARDS = [
  {
    id: "influencers",
    icon: Users,
    title: "authw.ad.influencers.title",
    desc: "authw.ad.influencers.desc",
    tag: "authw.ad.influencers.tag",
    accent: "from-fuchsia-500/30 to-pink-600/5",
    ring: "ring-fuchsia-500/40",
    glow: "bg-fuchsia-500/25",
    iconBg: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "apps",
    icon: Smartphone,
    title: "authw.ad.apps.title",
    desc: "authw.ad.apps.desc",
    tag: "authw.ad.apps.tag",
    accent: "from-violet-500/30 to-indigo-600/5",
    ring: "ring-violet-500/40",
    glow: "bg-violet-500/25",
    iconBg: "from-violet-500 to-indigo-600",
  },
  {
    id: "webs",
    icon: Globe,
    title: "authw.ad.webs.title",
    desc: "authw.ad.webs.desc",
    tag: "authw.ad.webs.tag",
    accent: "from-sky-500/30 to-cyan-600/5",
    ring: "ring-sky-500/40",
    glow: "bg-sky-500/25",
    iconBg: "from-sky-500 to-cyan-600",
  },
  {
    id: "negocios",
    icon: Store,
    title: "authw.ad.negocios.title",
    desc: "authw.ad.negocios.desc",
    tag: "authw.ad.negocios.tag",
    accent: "from-orange-500/30 to-amber-600/5",
    ring: "ring-orange-500/40",
    glow: "bg-orange-500/25",
    iconBg: "from-orange-500 to-amber-600",
  },
  {
    id: "presupuesto",
    icon: Wallet,
    title: "authw.ad.presupuesto.title",
    desc: "authw.ad.presupuesto.desc",
    tag: "authw.ad.presupuesto.tag",
    accent: "from-emerald-500/30 to-teal-600/5",
    ring: "ring-emerald-500/40",
    glow: "bg-emerald-500/25",
    iconBg: "from-emerald-500 to-teal-600",
  },
  {
    id: "promo",
    icon: Gift,
    title: "authw.ad.promo.title",
    desc: "authw.ad.promo.desc",
    tag: "authw.ad.promo.tag",
    accent: "from-amber-500/30 to-yellow-600/5",
    ring: "ring-amber-500/40",
    glow: "bg-amber-500/25",
    iconBg: "from-amber-500 to-yellow-600",
  },
];

export default function AuthPaymentAndAds() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [withdrawalActive, setWithdrawalActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((p) => (p + 1) % ADVERTISER_CARDS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setWithdrawalActive((p) => (p + 1) % WITHDRAWAL_CARDS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const card = ADVERTISER_CARDS[active];
  const withdrawalCard = WITHDRAWAL_CARDS[withdrawalActive];

  return (
    <div className="relative z-10 mt-6 space-y-5">
      {/* ===== Slider del ciclo de retiros (3D) ===== */}
      <div className="w-[85%] sm:w-[92%]">
        <div className="mb-2.5 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-orange-400" />
          <p className="font-display text-sm font-bold tracking-wide text-foreground">
            {t("authw.withdrawTitle")}
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-card/60 backdrop-blur-sm"
          style={{ perspective: "1000px" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={withdrawalCard.id}
              initial={{ opacity: 0, rotateY: -25, x: 40 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              exit={{ opacity: 0, rotateY: 25, x: -40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`relative overflow-hidden bg-gradient-to-br ${withdrawalCard.accent} p-4`}
            >
              {/* Glow de fondo */}
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${withdrawalCard.glow} blur-3xl`}
              />
              <div
                className={`pointer-events-none absolute -bottom-12 -left-8 h-24 w-24 rounded-full ${withdrawalCard.glow} blur-3xl opacity-60`}
              />
              {/* Brillo que barre la tarjeta */}
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.8, ease: "easeInOut", delay: 0.3 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              <div className="relative flex items-center gap-3.5">
                {/* Ícono 3D */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${withdrawalCard.iconBg} shadow-[0_8px_24px_-6px] shadow-black/50 ring-1 ${withdrawalCard.ring}`}
                >
                  <withdrawalCard.icon className="h-7 w-7 text-white drop-shadow-lg" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                </motion.div>

                {/* Texto */}
                <div className="relative min-w-0 flex-1">
                  <span className="mb-1 inline-block rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/80">
                    {t(withdrawalCard.tag)}
                  </span>
                  <p className="font-display text-sm font-bold text-foreground">
                    {t(withdrawalCard.title)}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {t(withdrawalCard.desc)}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            {WITHDRAWAL_CARDS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setWithdrawalActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === withdrawalActive ? "w-5 bg-orange-400" : "w-1.5 bg-border hover:bg-orange-500/40"
                }`}
                aria-label={`${t("authw.see")} ${t(c.title)}`}
              />
            ))}
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] font-semibold text-orange-300">
          {t("authw.wdFooter")}
        </p>
      </div>

      {/* ===== Slider para anunciantes (3D) ===== */}
      <div className="ml-auto w-[85%] sm:w-[92%]">
        <div className="mb-2.5 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-violet-400" />
          <p className="font-display text-sm font-bold tracking-wide text-foreground">
            {t("authw.adsTitle")}
          </p>
          <Sparkles className="ml-auto h-4 w-4 text-amber-300" />
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-card/60 backdrop-blur-sm"
          style={{ perspective: "1000px" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={{ opacity: 0, rotateY: -25, x: 40 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              exit={{ opacity: 0, rotateY: 25, x: -40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`relative overflow-hidden bg-gradient-to-br ${card.accent} p-4`}
            >
              {/* Glow de fondo */}
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${card.glow} blur-3xl`}
              />
              <div
                className={`pointer-events-none absolute -bottom-12 -left-8 h-24 w-24 rounded-full ${card.glow} blur-3xl opacity-60`}
              />
              {/* Brillo que barre la tarjeta */}
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.8, ease: "easeInOut", delay: 0.3 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              <div className="relative flex items-center gap-3.5">
                {/* Ícono 3D */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconBg} shadow-[0_8px_24px_-6px] shadow-black/50 ring-1 ${card.ring}`}
                >
                  <card.icon className="h-7 w-7 text-white drop-shadow-lg" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                </motion.div>

                {/* Texto */}
                <div className="relative min-w-0 flex-1">
                  <span className="mb-1 inline-block rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/80">
                    {t(card.tag)}
                  </span>
                  <p className="font-display text-sm font-bold text-foreground">
                    {t(card.title)}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {t(card.desc)}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            {ADVERTISER_CARDS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-violet-400" : "w-1.5 bg-border hover:bg-violet-500/40"
                }`}
                aria-label={`${t("authw.see")} ${t(c.title)}`}
              />
            ))}
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] font-semibold text-violet-300">
          {t("authw.adFooter")}
        </p>
      </div>
    </div>
  );
}