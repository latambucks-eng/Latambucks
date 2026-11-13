import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { PaymentLogoBadge } from "@/components/latambucks/PaymentLogos";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { Wallet } from "lucide-react";

const REDDIT_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 13.42c.07.27.1.55.1.84 0 2.23-2.61 4.04-5.83 4.04s-5.83-1.81-5.83-4.04c0-.29.03-.57.1-.84-.51-.23-.86-.74-.86-1.33 0-.81.66-1.47 1.47-1.47.39 0 .74.15 1.01.4 1.01-.69 2.39-1.13 3.92-1.18l.83-3.9c.03-.14.17-.23.31-.2l2.74.58c.19-.4.59-.68 1.06-.68.65 0 1.17.52 1.17 1.17s-.52 1.17-1.17 1.17c-.62 0-1.13-.48-1.17-1.09l-2.46-.52-.74 3.49c1.5.07 2.85.51 3.84 1.18.27-.25.62-.4 1.01-.4.81 0 1.47.66 1.47 1.47 0 .59-.35 1.1-.86 1.33zm-7.67 1.1c0 .41.33.74.74.74.41 0 .74-.33.74-.74 0-.41-.33-.74-.74-.74-.41 0-.74.33-.74.74zm4.32.74c.41 0 .74-.33.74-.74 0-.41-.33-.74-.74-.74-.41 0-.74.33-.74.74 0 .41.33.74.74.74zm-.37 1.71c-.34.34-.94.36-1.29.01-.13-.12-.33-.12-.45.01-.12.13-.12.33.01.45.3.28.69.43 1.09.43.4 0 .79-.15 1.09-.43.13-.12.13-.32.01-.45-.12-.13-.33-.14-.46-.02z"/>
  </svg>
);

const LOGO_URL = "https://media.base44.com/images/public/6aac56144f542d29eaac794b/2a9717c86_generated_image.png";

export default function SiteFooter() {
  const { t } = useI18n();
  const links = [
    { to: "/acerca-de", labelKey: "footer.acerca" },
    { to: "/contacto", labelKey: "footer.contacto" },
    { to: "/faq", labelKey: "footer.faq" },
    { to: "/terminos", labelKey: "footer.terminos" },
    { to: "/normas", labelKey: "footer.normas" },
    { to: "/reembolsos", labelKey: "footer.reembolsos" },
    { to: "/derechos-autor", labelKey: "footer.derechos" },
    { to: "/privacidad", labelKey: "footer.privacidad" },
    { to: "/cookies", labelKey: "footer.cookies" },
  ];

  return (
    <footer className="mt-6 border-t border-border px-4 py-6 text-center w-full">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Image
          src={LOGO_URL}
          alt="LatamBucks"
          fittingType="fill"
          className="h-7 w-7 rounded-lg"
        />
        <span className="font-display text-sm font-bold tracking-tight text-foreground">
          Latam<span className="text-orange-400">Bucks</span>
        </span>
      </div>
      <nav className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-[11px] font-medium text-orange-400">
        {links.map((l, i) => (
          <React.Fragment key={l.to}>
            {i > 0 && <span className="text-orange-500/40">·</span>}
            <Link to={l.to} className="hover:text-orange-300 transition">{t(l.labelKey)}</Link>
          </React.Fragment>
        ))}
      </nav>
      <Link
        to="/blog"
        className="mt-3 inline-flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-orange-400 transition hover:bg-orange-500/20"
      >
        {t("blog.sectionTitle")}
      </Link>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/60">
        © {new Date().getFullYear()} LatamBucks. {t("footer.tagline")}
        <br />{t("footer.operado")}
      </p>
      <div className="mt-2 border-t border-border/50 pt-2">
        <a
          href="mailto:latambucks@gmail.com?subject=Problemas%20para%20ingresar%20a%20mi%20cuenta"
          className="text-[10px] font-semibold text-orange-400 transition hover:text-orange-300"
        >
          {t("footer.problemasAcceso")}
        </a>
      </div>
      <div className="mt-3 border-t border-border/50 pt-3">
        <div className="mb-2 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-foreground">{t("footer.seguinos")}</span>
          <a
            href="https://www.reddit.com/user/Latambucks/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("footer.seguinos")}
            className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-orange-400 transition hover:bg-orange-500/20 hover:text-orange-300"
          >
            {REDDIT_ICON}
            <span>r/LatamBucks</span>
          </a>
        </div>
      </div>
      <div className="mt-3 border-t border-border/50 pt-3">
        <div className="mb-2 flex items-center justify-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[10px] font-bold text-foreground">{t("footer.metodosRetiro")}</span>
        </div>
        <div className="flex items-center justify-center gap-2.5">
          {["paypal", "binance"].map((m) => (
            <PaymentLogoBadge
              key={m}
              metodo={m}
              className="h-12 w-24 rounded-lg p-1"
              logoClassName="h-full w-full object-contain"
            />
          ))}
        </div>
      </div>
    </footer>
  );
}
