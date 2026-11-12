import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import BlogLayout from "@/components/latambucks/BlogLayout";
import BlogCard from "@/components/latambucks/BlogCard";
import SeoHead from "@/components/latambucks/SeoHead";
import useBlogArticles from "@/lib/blog/useBlogArticles";
import MonetagMultitag from "@/components/latambucks/MonetagMultitag";

// Portada del blog: los 4 artículos con filtro por etiqueta.
export default function Blog() {
  const articulos = useBlogArticles();
  const [params, setParams] = useSearchParams();
  const etiquetaActiva = params.get("etiqueta");

  const etiquetas = [...new Set(articulos.flatMap((a) => a.etiquetas))];
  const visibles = etiquetaActiva
    ? articulos.filter((a) => a.etiquetas.includes(etiquetaActiva))
    : articulos;

  const seleccionar = (tag) => {
    if (!tag) setParams({});
    else setParams({ etiqueta: tag });
  };

  return (
    <BlogLayout>
      <SeoHead
        title="Blog LatamBucks: guías, datos y cómo ganar puntos"
        description="Artículos sobre cómo ganar puntos en LatamBucks: estadísticas de la comunidad, ingresos reales por mes, rutinas diarias y guía de retiros por Payoneer, Airtm y PayPal."
        path="/blog"
      />

      {/* Monetag: sólo en el blog. */}
      <MonetagMultitag />

      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        El blog de Latam<span className="text-orange-400">Bucks</span>
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Datos de nuestra comunidad, cuentas claras y rutinas que funcionan. Sin humo y sin
        promesas de sueldos soñados.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => seleccionar(null)}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
            !etiquetaActiva
              ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {etiquetas.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => seleccionar(tag)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              etiquetaActiva === tag
                ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visibles.map((art) => (
          <BlogCard key={art.slug} article={art} />
        ))}
      </div>

      {visibles.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Todavía no hay artículos con esa etiqueta.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card to-card p-4 text-center">
        <p className="font-display text-sm font-bold text-foreground">
          ¿Querés empezar a sumar puntos hoy?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Crear una cuenta es gratis y el bonus de bienvenida se acredita al registrarte.
        </p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-orange-950 transition hover:bg-orange-400"
        >
          Entrar a LatamBucks
        </Link>
      </div>
    </BlogLayout>
  );
}