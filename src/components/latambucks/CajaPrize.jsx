import React from "react";
import { motion } from "framer-motion";
import { Coins, Sparkles, Trophy, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

const STYLES = {
  big: { bg: "bg-gradient-to-br from-amber-500/30 to-amber-500/5", text: "text-amber-400", ring: "ring-amber-500/40", shadow: "shadow-amber-500/30", label: "caja.prize.special" },
  medium: { bg: "bg-gradient-to-br from-violet-500/30 to-violet-500/5", text: "text-violet-400", ring: "ring-violet-500/40", shadow: "shadow-violet-500/30", label: "caja.prize.good" },
  small: { bg: "bg-gradient-to-br from-orange-500/30 to-orange-500/5", text: "text-orange-400", ring: "ring-orange-500/40", shadow: "shadow-orange-500/30", label: "caja.prize.normal" },
};

export default function CajaPrize({ prize, onClose }) {
  const { t } = useI18n();
  const tier = prize >= 100 ? "big" : prize >= 10 ? "medium" : "small";
  const s = STYLES[tier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-card p-8 text-center shadow-2xl ${s.shadow}`}
      >
        <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full ${s.bg} blur-[60px] opacity-60`} />
        <div className={`pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full ${s.bg} blur-[50px] opacity-40`} />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full ${s.bg} ${s.text} ring-1 ${s.ring} shadow-lg ${s.shadow}`}
        >
          {tier === "big" ? <Trophy className="h-12 w-12" /> : tier === "medium" ? <Sparkles className="h-12 w-12" /> : <Coins className="h-12 w-12" />}
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`relative mt-5 inline-block rounded-full ${s.bg} px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${s.text}`}
        >
          {t(s.label)}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="relative mt-3 text-sm font-medium text-muted-foreground"
        >
          {t("caja.prize.won")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className={`relative mt-1 font-display text-6xl font-bold tracking-tight ${s.text} drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]`}
        >
          {prize.toLocaleString("es")}
        </motion.p>
        <p className="relative mt-1 text-sm font-medium text-muted-foreground">{t("caja.prize.points")}</p>
        {tier === "big" && (
          <p className="relative mt-3 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
            {t("caja.prize.month")}
          </p>
        )}
        <button
          onClick={onClose}
          className="relative mt-6 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-3.5 font-display font-bold text-orange-950 shadow-lg shadow-orange-500/30 transition hover:shadow-orange-500/50"
        >
          {t("caja.prize.ok")}
        </button>
      </motion.div>
    </div>
  );
}