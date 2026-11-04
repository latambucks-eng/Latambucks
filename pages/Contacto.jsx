import React from "react";
import { Mail, LifeBuoy, MessageCircle } from "lucide-react";
import LegalLayout, { Section } from "@/components/latambucks/LegalLayout";
import ContactForm from "@/components/latambucks/ContactForm";
import SeoHead from "@/components/latambucks/SeoHead";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function Contacto() {
  const { t } = useI18n();
  return (
    <LegalLayout title={t("legal.contacto.title")} subtitle={t("legal.contacto.sub")}>
      <SeoHead
        title="Contacto"
        description="Canales oficiales de soporte de LatamBucks: soporte dentro de la plataforma, correo electrónico y recuperación de acceso a tu cuenta."
        path="/contacto"
      />
      <Section title={t("legal.contacto.soporte.title")}>
        <p>{t("legal.contacto.soporte.body")}</p>
      </Section>

      <Section title={t("legal.contacto.email.title")}>
        <a
          href="mailto:latambucks@gmail.com"
          className="flex items-center gap-2 text-sm text-foreground transition hover:text-orange-400"
        >
          <Mail className="h-4 w-4 text-orange-400" />
          latambucks@gmail.com
        </a>
        <p>{t("legal.contacto.email.body")}</p>
      </Section>

      <Section title={t("legal.contacto.acceso.title")}>
        <a
          href="mailto:latambucks@gmail.com?subject=Problemas%20para%20ingresar%20a%20mi%20cuenta"
          className="flex items-center gap-2 text-sm text-foreground transition hover:text-orange-400"
        >
          <LifeBuoy className="h-4 w-4 text-orange-400" />
          {t("legal.contacto.acceso.link")}
        </a>
        <p>{t("legal.contacto.acceso.body")}</p>
      </Section>

      <Section title={t("legal.contacto.proveedores.title")}>
        <p>{t("legal.contacto.proveedores.body")}</p>
      </Section>

      <Section title={t("legal.contacto.whatsapp.title")}>
        <a
          href="https://whatsapp.com/channel/0029VbDZv7ADuMRbQPijiw2p"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground transition hover:text-orange-400"
        >
          <MessageCircle className="h-4 w-4 text-orange-400" />
          {t("legal.contacto.whatsapp.link")}
        </a>
        <p>{t("legal.contacto.whatsapp.body")}</p>
      </Section>

      <Section title={t("legal.contacto.form.title")}>
        <p>{t("legal.contacto.form.body")}</p>
        <ContactForm />
      </Section>
    </LegalLayout>
  );
}