import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { PaymentLogoBadge } from "@/components/latambucks/PaymentLogos";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { Wallet } from "lucide-react";
import { brandLogo } from "@/lib/localAssets";

const LOGO_URL = brandLogo;

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
        Blog LatamBucks
      </Link>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/60">
        © {new Date().getFullYear()} LatamBucks. {t("footer.tagline")}
        <br />{t("footer.operado")}
      </p>
      <div className="mt-2 border-t border-border/50 pt-2">
        <a
          href="mailto:team@latambucks.com?subject=Problemas%20para%20ingresar%20a%20mi%20cuenta"
          className="text-[10px] font-semibold text-orange-400 transition hover:text-orange-300"
        >
          {t("footer.problemasAcceso")}
        </a>
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
