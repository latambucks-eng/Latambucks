import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins, Info } from "lucide-react";
import SiteFooter from "@/components/latambucks/SiteFooter";
import LanguagePicker from "@/components/latambucks/LanguagePicker";
import { useI18n } from "@/lib/i18n/LanguageContext";

export function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card/50 p-4">
      <h2 className="mb-2 font-display text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function QA({ q, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4">
      <h3 className="mb-1.5 font-display text-sm font-semibold text-foreground">{q}</h3>
      <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function LegalLayout({ title, subtitle, notice, children }) {
  const { t } = useI18n();
  return (
    <div className="lb-stage relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/"
          aria-label={t("legal.volver")}
          className="flex items-center justify-center rounded-lg bg-secondary/50 p-1.5 text-foreground transition hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
            <Coins className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-foreground">
            Latam<span className="text-orange-400">Bucks</span>
          </span>
        </div>
        <LanguagePicker className="ml-auto shrink-0" />
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-20">
        <h1 className="mb-1 font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className={`text-sm text-muted-foreground ${notice ? "mb-3" : "mb-6"}`}>{subtitle}</p>
        )}
        {notice && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
            <p>{notice}</p>
          </div>
        )}
        <div className="space-y-4">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}