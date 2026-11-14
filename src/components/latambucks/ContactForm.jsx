import React, { useState, useRef, useEffect } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Formulario de contacto blindado contra bots SIN gastar créditos de integración.
// Tres capas de protección 100% del lado del cliente:
//   1. Honeypot: campo oculto que los bots completan automáticamente; si llega
//      con contenido, se descarta el envío silenciosamente.
//   2. Captcha matemático: suma aleatoria que un bot típico no resuelve sin
//      ejecutar lógica específica.
//   3. Tiempo mínimo de envío: si el formulario se envía antes de los 3 segundos
//      desde que se montó, se asume bot (los humanos tardan más en leer y tipear).
//
// Al validar, arma un enlace mailto: con el asunto y cuerpo del mensaje, abriendo
// el cliente de correo del usuario. No hay backend ni integraciones: cero créditos.

const MIN_SECONDS = 3;
const SUPPORT_EMAIL = "team@latambucks.com";

function makeChallenge() {
  const a = Math.floor(Math.random() * 8) + 2; // 2..9
  const b = Math.floor(Math.random() * 8) + 2; // 2..9
  return { a, b, answer: a + b };
}

export default function ContactForm() {
  const { t } = useI18n();
  const [challenge, setChallenge] = useState(makeChallenge);
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [captcha, setCaptcha] = useState("");
  const [honeypot, setHoneypot] = useState(""); // debe quedar vacío
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    mountTime.current = Date.now();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Capa 1: honeypot — si el campo oculto tiene contenido, es un bot.
    if (honeypot.trim() !== "") {
      // Simulamos éxito para que el bot no se dé cuenta.
      setEnviado(true);
      return;
    }

    // Capa 2: captcha matemático.
    if (Number(captcha) !== challenge.answer) {
      setError(t("contacto.err.math"));
      setChallenge(makeChallenge());
      setCaptcha("");
      return;
    }

    // Capa 3: tiempo mínimo de envío.
    const elapsed = (Date.now() - mountTime.current) / 1000;
    if (elapsed < MIN_SECONDS) {
      setError(t("contacto.err.fast"));
      setChallenge(makeChallenge());
      setCaptcha("");
      return;
    }

    // Validación de campos obligatorios.
    if (!form.nombre.trim() || !form.email.trim() || !form.mensaje.trim()) {
      setError(t("contacto.err.required"));
      return;
    }

    // Construir el enlace mailto: con el contenido del formulario.
    const subject = encodeURIComponent(
      `[Contacto LatamBucks] ${form.asunto || t("contacto.asuntoDefault")} — ${form.nombre}`
    );
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\n` +
      `Email: ${form.email}\n\n` +
      `Mensaje:\n${form.mensaje}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setEnviado(true);

    // Evento de contacto; falta la etiqueta de conversión de la cuenta nueva.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        send_to: 'AW-18480858834',
      });
    }
  };

  if (enviado) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {t("contacto.sent.title")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("contacto.sent.hint")}{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-orange-400 hover:text-orange-300">
            {SUPPORT_EMAIL}
          </a>.
        </p>
        <button
          onClick={() => {
            setEnviado(false);
            setForm({ nombre: "", email: "", asunto: "", mensaje: "" });
            setCaptcha("");
            setChallenge(makeChallenge());
            mountTime.current = Date.now();
          }}
          className="mt-3 text-xs text-orange-400 hover:text-orange-300"
        >
          {t("contacto.sent.otro")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {/* Honeypot — oculto visualmente, accesible a bots */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label>
          {t("contacto.honeypot")}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("contacto.nombre")}
        </label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className="lb-input"
          placeholder={t("contacto.nombrePh")}
          autoComplete="name"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("contacto.email")}
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="lb-input"
          placeholder={t("contacto.emailPh")}
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("contacto.asunto")}
        </label>
        <input
          name="asunto"
          value={form.asunto}
          onChange={handleChange}
          className="lb-input"
          placeholder={t("contacto.asuntoPh")}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("contacto.mensaje")}
        </label>
        <textarea
          name="mensaje"
          value={form.mensaje}
          onChange={handleChange}
          className="lb-input min-h-[110px] resize-y"
          placeholder={t("contacto.mensajePh")}
        />
      </div>

      {/* Captcha matemático */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("contacto.captcha", { a: challenge.a, b: challenge.b })}
        </label>
        <input
          name="captcha"
          value={captcha}
          onChange={(e) => setCaptcha(e.target.value)}
          className="lb-input"
          placeholder={t("contacto.captchaPh")}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        <Send className="h-4 w-4" />
        {t("contacto.enviar")}
      </button>

      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60">
        <ShieldCheck className="h-3 w-3" />
        {t("contacto.protegido")}
      </p>
    </form>
  );
}
