import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function PaymentStatusToast() {
  const { t } = useI18n();
  const [kind, setKind] = useState(null); // "approved" | "pending" | null

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      if (status === "approved" || status === "pending") {
        setKind(status);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const close = () => {
    setKind(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  };

  if (!kind) return null;

  const isApproved = kind === "approved";
  const accent = isApproved ? "orange" : "amber";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border ${
          isApproved ? "border-orange-500/40" : "border-amber-500/40"
        } bg-card p-6 shadow-[0_8px_60px_-12px] ${
          isApproved ? "shadow-orange-500/30" : "shadow-amber-500/30"
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[50px] ${
            isApproved ? "bg-orange-500/30" : "bg-amber-500/30"
          }`}
        />

        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition hover:bg-background/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              isApproved ? "bg-orange-500/15 text-orange-400" : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {isApproved ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
          </div>

          <h3
            className={`mt-4 font-display text-lg font-bold ${
              isApproved ? "text-orange-400" : "text-amber-300"
            }`}
          >
            {t(isApproved ? "paystatus.approved.title" : "paystatus.pending.title")}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(isApproved ? "paystatus.approved.body" : "paystatus.pending.body")}
          </p>

          <button
            onClick={close}
            className={`mt-5 w-full rounded-xl py-3 text-sm font-semibold transition ${
              isApproved
                ? "bg-orange-500 text-orange-950 hover:bg-orange-400"
                : "bg-amber-500 text-amber-950 hover:bg-amber-400"
            }`}
          >
            {t("paystatus.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}