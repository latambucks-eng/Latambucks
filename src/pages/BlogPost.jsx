import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock, User } from "lucide-react";
import BlogLayout from "@/components/latambucks/BlogLayout";
import BlogListItem from "@/components/latambucks/BlogListItem";
import SeoHead from "@/components/latambucks/SeoHead";
import { Image } from "@/components/ui/image";
import { formatFecha } from "@/lib/blog/blogContent";
import { tagKey } from "@/lib/blog/blogTags";
import useBlogArticles from "@/lib/blog/useBlogArticles";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Página de un artículo del blog. El contenido es HTML propio del repo, por
// eso se inyecta tal cual (no hay entrada de usuarios en el blog).
export default function BlogPost() {
  const { slug } = useParams();
  const { lang, t } = useI18n();
  const articulos = useBlogArticles();
  const articulo = articulos.find((a) => a.slug === slug);
  const relacionados = articulos.filter((a) => a.slug !== slug).slice(0, 2);

  // Si el artículo no existe, se marca 404 para que Google no lo indexe.
  useEffect(() => {
    if (articulo) return;
    const meta = document.createElement("meta");
    meta.setAttribute("name", "prerender-status-code");
    meta.setAttribute("content", "404");
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [articulo]);

  // Datos estructurados para que Google entienda que es un artículo.
  useEffect(() => {
    if (!articulo) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: articulo.titulo,
      description: articulo.extracto,
      datePublished: articulo.fecha,
      author: { "@type": "Organization", name: articulo.autor },
      publisher: { "@type": "Organization", name: "LatamBucks" },
      keywords: articulo.etiquetas.join(", "),
      inLanguage: lang,
      mainEntityOfPage: `${window.location.origin}/blog/${articulo.slug}`,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [articulo, lang]);

  if (!articulo) {
    return (
      <BlogLayout>
        <SeoHead title={t("blog.notFound")} description={t("blog.notFoundSub")} path="/blog" />
        <h1 className="font-display text-2xl font-bold text-foreground">{t("blog.notFound")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("blog.notFoundSub")}</p>
        <Link
          to="/blog"
          className="mt-4 inline-flex rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-orange-950 transition hover:bg-orange-400"
        >
          {t("blog.notFoundBtn")}
        </Link>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <SeoHead
        title={articulo.metaTitulo || articulo.titulo}
        description={articulo.metaDescripcion || articulo.extracto}
        path={`/blog/${articulo.slug}`}
      />

      <nav className="mb-2 text-[11px] text-muted-foreground">
        <Link to="/blog" className="transition hover:text-orange-400">
          Blog
        </Link>
        <span className="mx-1.5 text-muted-foreground/50">/</span>
        <span>{articulo.etiquetas[0]}</span>
      </nav>

      <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
        {articulo.titulo}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:text-xs">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" /> {articulo.autor}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" /> {formatFecha(articulo.fecha, lang)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {t("blog.readMin", { n: articulo.minutos })}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <Image
          src={articulo.imagen}
          alt={articulo.imagenAlt || articulo.titulo}
          fittingType="fill"
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {articulo.etiquetas.map((tag) => (
          <Link
            key={tag}
            to={`/blog?tag=${encodeURIComponent(tagKey(tag))}`}
            className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-400 transition hover:bg-orange-500/20"
          >
            {tag}
          </Link>
        ))}
      </div>

      <article
        className="lb-article mt-4"
        dangerouslySetInnerHTML={{ __html: articulo.contenido }}
      />

      <div className="mt-8 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-5 text-center">
        <p className="font-display text-sm font-bold text-foreground sm:text-base">
          {t("blog.postCtaTitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("blog.postCtaSub")}</p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-orange-950 transition hover:bg-orange-400"
        >
          {t("blog.postCtaBtn")}
        </Link>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-display text-base font-bold text-foreground">
            {t("blog.related")}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {relacionados.map((art) => (
              <BlogListItem key={art.slug} article={art} />
            ))}
          </div>
        </section>
      )}
    </BlogLayout>
  );
}
