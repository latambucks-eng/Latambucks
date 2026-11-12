import React, { useEffect } from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";

const SITE_NAME = "LatamBucks";
const SITE_URL = "https://latambucks.base44.app";
const DEFAULT_IMAGE =
  "https://media.base44.com/images/public/6aac56144f542d29eaac794b/2a9717c86_generated_image.png";
const DEFAULT_LOCALE = "es";
const OG_LOCALES = { es: "es_ES", en: "en_US", pt: "pt_BR" };

/**
 * Actualiza dinámicamente el <head> por ruta e idioma:
 * document.title, meta description, Open Graph, Twitter Card, canonical,
 * og:locale y alternates hreflang (es / en / pt / x-default), para que Google
 * indexe cada idioma con su propia dirección (?lang=en, ?lang=pt).
 * Limpia los tags al desmontar para que no persistan entre páginas.
 */
export default function SeoHead({ title, description, path }) {
  const { lang } = useI18n();

  useEffect(() => {
    if (!title) return;
    const active = OG_LOCALES[lang] ? lang : DEFAULT_LOCALE;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const urlFor = (code) => `${SITE_URL}${path || ""}${code === DEFAULT_LOCALE ? "" : `?lang=${code}`}`;
    const canonical = urlFor(active);
    const previousTitle = document.title;

    const created = [];
    const restore = [];

    const meta = (attr, key, value) => {
      if (!value) return;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
      } else {
        restore.push([el, "content", el.getAttribute("content") || ""]);
      }
      el.setAttribute("content", value);
    };

    document.title = fullTitle;
    meta("name", "description", description);
    meta("property", "og:title", fullTitle);
    meta("property", "og:description", description);
    meta("property", "og:url", canonical);
    meta("property", "og:type", "website");
    meta("property", "og:site_name", SITE_NAME);
    meta("property", "og:image", DEFAULT_IMAGE);
    meta("property", "og:locale", OG_LOCALES[active]);
    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", fullTitle);
    meta("name", "twitter:description", description);
    meta("name", "twitter:image", DEFAULT_IMAGE);

    // Canonical del idioma activo.
    let linkCanonical = document.head.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
      created.push(linkCanonical);
    } else {
      restore.push([linkCanonical, "href", linkCanonical.getAttribute("href") || ""]);
    }
    linkCanonical.setAttribute("href", canonical);

    // Versiones por idioma de esta misma página.
    document.head
      .querySelectorAll('link[data-lb-hreflang="1"]')
      .forEach((el) => el.remove());
    const alternates = [
      ...["es", "en", "pt"].map((code) => ({ hreflang: code, href: urlFor(code) })),
      { hreflang: "x-default", href: urlFor(DEFAULT_LOCALE) },
    ];
    alternates.forEach(({ hreflang, href }) => {
      const el = document.createElement("link");
      el.setAttribute("rel", "alternate");
      el.setAttribute("hreflang", hreflang);
      el.setAttribute("href", href);
      el.setAttribute("data-lb-hreflang", "1");
      document.head.appendChild(el);
    });

    return () => {
      document.title = previousTitle;
      created.forEach((el) => el.remove());
      restore.forEach(([el, attr, value]) => {
        if (value) el.setAttribute(attr, value);
        else el.removeAttribute(attr);
      });
      document.head
        .querySelectorAll('link[data-lb-hreflang="1"]')
        .forEach((el) => el.remove());
    };
  }, [title, description, path, lang]);

  return null;
}
