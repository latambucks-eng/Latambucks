import React, { useState } from "react";
import { Copy, Check, ChevronDown, ExternalLink } from "lucide-react";
import { getPaymentMethodLabel } from "@/components/latambucks/PaymentLogos";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { PAGOS } from "@/lib/i18n/content/pagos";

const PAYMENT_DESTINATIONS = {
  payoneer: { type: "email", value: "******" },
  paypal: { type: "link", value: "https://paypal.me/Denise279726?locale.x=es_XC&country.x=AR" },
  airtm: { type: "username", value: "serviciosdig_lat" },
};

export default function PaymentInstructions({ metodo }) {
  const { lang } = useI18n();
  const c = PAGOS[lang] || PAGOS.es;
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const dest = PAYMENT_DESTINATIONS[metodo];
  const steps = c.steps[metodo];
  if (!dest || !steps) return null;

  const copyValue = () => {
    navigator.clipboard?.writeText(dest.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const label = getPaymentMethodLabel(metodo);
  const valueLabel =
    dest.type === "email" ? c.destEmail : dest.type === "link" ? c.destLink : c.destUser;

  return (
    <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="text-sm font-bold text-sky-300">
          💸 {c.title.replace("{metodo}", label)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-sky-300 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Destination value + copy/open buttons */}
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5">
            <p className="mb-1.5 text-[11px] font-medium text-sky-200/80">{valueLabel}</p>
            <div className="flex items-center justify-between gap-2">
              <code className="min-w-0 flex-1 truncate text-xs text-sky-100">{dest.value}</code>
              <div className="flex shrink-0 items-center gap-1.5">
                {dest.type === "link" && (
                  <a
                    href={dest.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-sky-400/50 bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/25"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {c.open}
                  </a>
                )}
                <button
                  onClick={copyValue}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-400/50 bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/25"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? c.copied : c.copy}
                </button>
              </div>
            </div>
          </div>

          {/* Steps */}
          <ol className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-sky-200/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}