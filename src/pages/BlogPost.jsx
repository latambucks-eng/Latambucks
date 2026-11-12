import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock, User } from "lucide-react";
import BlogLayout from "@/components/latambucks/BlogLayout";
import BlogCard from "@/components/latambucks/BlogCard";
import SeoHead from "@/components/latambucks/SeoHead";
import { Image } from "@/components/ui/image";
import { formatFecha } from "@/lib/blog/blogContent";
import useBlogArticles from "@/lib/blog/useBlogArticles";

// Página de un artículo del blog. El contenido es HTML propio del repo, por
// eso se inyecta tal cual (no hay entrada de usuarios en el blog).
export default function BlogPost() {
  const { slug } = useParams();
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
      inLanguage: "es",
      mainEntityOfPage: `${window.location.origin}/blog/${articulo.slug}`,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [articulo]);

  if (!articulo) {
    return (
      <BlogLayout>
        <SeoHead title="Artículo no encontrado" description="Ese artículo no existe." path="/blog" />
        <h1 className="font-display text-2xl font-bold text-foreground">Artículo no encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Puede que el enlace esté mal escrito o que la nota se haya movido.
        </p>
        <Link
          to="/blog"
          className="mt-4 inline-flex rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-orange-950 transition hover:bg-orange-400"
        >
          Ver todos los artículos
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

      <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground">
        {articulo.titulo}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" /> {articulo.autor}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" /> {formatFecha(articulo.fecha)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {articulo.minutos} min de lectura
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        <Image
          src={articulo.imagen}
          alt={articulo.imagenAlt || articulo.titulo}
          fittingType="fill"
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {articulo.etiquetas.map((tag) => (
          <Link
            key={tag}
            to={`/blog?etiqueta=${encodeURIComponent(tag)}`}
            className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-400 transition hover:bg-orange-500/20"
          >
            {tag}
          </Link>
        ))}
      </div>

      <article className="lb-article mt-4" dangerouslySetInnerHTML={{ __html: articulo.contenido }} />

      <div className="mt-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-4 text-center">
        <p className="font-display text-sm font-bold text-foreground">
          Sumá puntos desde hoy en LatamBucks
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Encuestas, tareas cortas y bonus diario desde el celular. Retiro mínimo de 5 dólares.
        </p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-orange-950 transition hover:bg-orange-400"
        >
          Crear mi cuenta gratis
        </Link>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-display text-base font-bold text-foreground">Seguí leyendo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relacionados.map((art) => (
              <BlogCard key={art.slug} article={art} compact />
            ))}
          </div>
        </section>
      )}
    </BlogLayout>
  );
}