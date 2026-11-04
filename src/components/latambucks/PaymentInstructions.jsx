import React, { useState } from "react";
import { Copy, Check, ChevronDown, ExternalLink } from "lucide-react";
import { getPaymentMethodLabel } from "@/components/latambucks/PaymentLogos";

const PAYMENT_DESTINATIONS = {
  payoneer: { type: "email", value: "latambucks@gmail.com" },
  paypal: { type: "link", value: "https://paypal.me/Denise279726?locale.x=es_XC&country.x=AR" },
  airtm: { type: "username", value: "serviciosdig_lat" },
};

const PAYMENT_STEPS = {
  payoneer: [
    "Iniciá sesión en tu cuenta de Payoneer (si no tenés una, creala gratis en payoneer.com).",
    "Seleccioná «Pay» → «Pagar a la cuenta Payoneer de un destinatario».",
    "Ingresá el correo del destinatario: latambucks@gmail.com (copialo con el botón de abajo).",
    "En «Pagar desde» seleccioná tu saldo en USD; en «Pagar a» dejá la moneda del destinatario.",
    "Escribí el importe exacto a enviar y hacé clic en «Siguiente».",
    "Revisá los datos y hacé clic en «Pagar». El pago se realiza al instante y el destinatario lo recibe dentro de las 2 horas.",
    "Tomá una captura del comprobante de pago y subila en el formulario.",
  ],
  paypal: [
    "Copiá el siguiente enlace y pegalo en la barra de direcciones de tu navegador (o tocá «Abrir»).",
    "Iniciá sesión con tu cuenta de PayPal si te lo pide.",
    "Ingresá el importe exacto a enviar y, si querés, agregá una nota.",
    "Confirmá el pago. El dinero se transfiere al instante.",
    "Tomá una captura del comprobante de pago y subila en el formulario.",
  ],
  airtm: [
    "Iniciá sesión en tu cuenta de Airtm (si no tenés una, creala gratis en airtm.com).",
    "Andá al menú y seleccioná «Enviar/Solicitar», luego elegí «Enviar».",
    "Ingresá el nombre de usuario exacto: serviciosdig_lat (copialo con el botón de abajo). No uses correo electrónico.",
    "Escribí la cantidad de USDC (dólares digitales) a transferir.",
    "Revisá los datos y confirmá la operación. El destinatario recibe una notificación al instante.",
    "Tomá una captura del comprobante de pago y subila en el formulario.",
  ],
};

export default function PaymentInstructions({ metodo }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const dest = PAYMENT_DESTINATIONS[metodo];
  const steps = PAYMENT_STEPS[metodo];
  if (!dest || !steps) return null;

  const copyValue = () => {
    navigator.clipboard?.writeText(dest.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const label = getPaymentMethodLabel(metodo);
  const valueLabel =
    dest.type === "email" ? "Correo de destino" : dest.type === "link" ? "Enlace de pago" : "Nombre de usuario";

  return (
    <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="text-sm font-bold text-sky-300">
          💸 Cómo pagar por {label}
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
                    Abrir
                  </a>
                )}
                <button
                  onClick={copyValue}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-400/50 bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/25"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copiado" : "Copiar"}
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