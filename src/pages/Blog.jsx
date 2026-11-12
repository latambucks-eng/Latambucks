import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import BlogLayout from "@/components/latambucks/BlogLayout";
import BlogListItem from "@/components/latambucks/BlogListItem";
import SeoHead from "@/components/latambucks/SeoHead";
import useBlogArticles from "@/lib/blog/useBlogArticles";
import { tagKey } from "@/lib/blog/blogTags";
import MonetagMultitag from "@/components/latambucks/MonetagMultitag";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Portada del blog: una lista de enlaces con miniatura, con filtro por etiqueta.
// El filtro usa la clave estable de la etiqueta (?tag=stats), no el texto
// traducido, así funciona igual en español, inglés y portugués.
export default function Blog() {
  const { t } = useI18n();
  const articulos = useBlogArticles();
  const [params, setParams] = useSearchParams();
  const etiquetaActiva = params.get("tag") || tagKey(params.get("etiqueta"));

  // [clave, etiqueta visible en el idioma activo]
  const etiquetas = [
    ...new Map(articulos.flatMap((a) => a.etiquetas.map((l) => [tagKey(l), l]))).entries(),
  ];
  const visibles = etiquetaActiva
    ? articulos.filter((a) => a.etiquetas.some((l) => tagKey(l) === etiquetaActiva))
    : articulos;

  const langParam = params.get("lang");
  const seleccionar = (clave) => {
    const next = {};
    if (clave) next.tag = clave;
    // Se conserva el idioma de la dirección (?lang=) al cambiar de etiqueta.
    if (langParam) next.lang = langParam;
    setParams(next);
  };

  return (
    <BlogLayout wide>
      <SeoHead title={t("blog.metaTitle")} description={t("blog.metaDesc")} path="/blog" />

      {/* Monetag: sólo en el blog. */}
      <MonetagMultitag />

      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("blog.title")}
      </h1>
      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
        {t("blog.sub")}
      </p>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => seleccionar(null)}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
            !etiquetaActiva
              ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("blog.all")}
        </button>
        {etiquetas.map(([clave, etiqueta]) => (
          <button
            key={clave}
            type="button"
            onClick={() => seleccionar(clave)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
              etiquetaActiva === clave
                ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2.5 md:grid-cols-2 md:gap-3">
        {visibles.map((art) => (
          <BlogListItem key={art.slug} article={art} />
        ))}
      </div>

      {visibles.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t("blog.empty")}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-5 text-center">
        <p className="font-display text-sm font-bold text-foreground sm:text-base">
          {t("blog.ctaTitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("blog.ctaSub")}</p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-orange-950 transition hover:bg-orange-400"
        >
          {t("blog.ctaBtn")}
        </Link>
      </div>
    </BlogLayout>
  );
}
