import { useEffect } from "react";
import { brandLogo } from "@/lib/localAssets";

const SITE_NAME = "LatamBucks";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";
const DEFAULT_IMAGE = brandLogo;

/**
 * Actualiza dinámicamente el <head> por ruta (SPA):
 * document.title + meta description + Open Graph + Twitter Card + canonical.
 * Limpia los tags al desmontar para que no persistan entre páginas.
 */
export default function SeoHead({ title, description, path }) {
  useEffect(() => {
    if (!title) return;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const canonical = path ? `${SITE_URL}${path}` : SITE_URL;

    const ensure = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };

    const originals = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
      ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") || "",
      twTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || "",
      twDesc: document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") || "",
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    };

    document.title = fullTitle;
    ensure('meta[name="description"]', { name: "description", content: description });
    ensure('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    ensure('meta[property="og:description"]', { property: "og:description", content: description });
    ensure('meta[property="og:url"]', { property: "og:url", content: canonical });
    ensure('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    ensure('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    return () => {
      document.title = originals.title;
      ensure('meta[name="description"]', { name: "description", content: originals.description });
      ensure('meta[property="og:title"]', { property: "og:title", content: originals.ogTitle });
      ensure('meta[property="og:description"]', { property: "og:description", content: originals.ogDesc });
      ensure('meta[property="og:url"]', { property: "og:url", content: originals.ogUrl });
      ensure('meta[name="twitter:title"]', { name: "twitter:title", content: originals.twTitle });
      ensure('meta[name="twitter:description"]', { name: "twitter:description", content: originals.twDesc });
      link.setAttribute("href", originals.canonical);
    };
  }, [title, description, path]);

  return null;
}