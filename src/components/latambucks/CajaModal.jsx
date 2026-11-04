import React from "react";
import { motion } from "framer-motion";
import { Gift, X, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Modal de consentimiento explícito — el anuncio SOLO se carga al presionar
// el botón "Ver Anuncio y Abrir Caja". No hay carga automática ni sorpresa.
export default function CajaModal({ onClose, onConfirm }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/12 via-card to-card p-8 text-center shadow-2xl shadow-orange-500/10"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-500/25 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-violet-500/15 blur-[50px]" />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/30 to-orange-500/5 text-orange-400 ring-1 ring-orange-500/30 shadow-lg shadow-orange-500/20"
        >
          <Gift className="h-10 w-10" />
        </motion.div>
        <p className="relative mt-5 font-display text-lg font-bold tracking-tight text-foreground">
          {t("caja.modal.title")}
        </p>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("caja.modal.sub")}
        </p>
        <button
          onClick={onConfirm}
          className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-3.5 font-display font-bold text-orange-950 shadow-lg shadow-orange-500/30 transition hover:shadow-orange-500/50"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20 transition group-hover:translate-x-full" />
          <Play className="relative h-5 w-5" /> {t("caja.modal.cta")}
        </button>
        <p className="relative mt-3 text-[11px] text-muted-foreground">
          {t("caja.modal.note")}
        </p>
      </motion.div>
    </div>
  );
}