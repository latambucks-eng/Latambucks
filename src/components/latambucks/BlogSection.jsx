import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/latambucks/BlogCard";
import useBlogArticles from "@/lib/blog/useBlogArticles";

// Bloque del blog que se muestra al final del sitio: los 4 artículos en
// tarjetas, con acceso a la portada del blog.
export default function BlogSection() {
  const articulos = useBlogArticles();

  return (
    <section className="border-t border-border px-4 pb-2 pt-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Blog Latam<span className="text-orange-400">Bucks</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Guías y datos reales para ganar más puntos.
          </p>
        </div>
        <Link
          to="/blog"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-400 transition hover:text-orange-300"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {articulos.map((art) => (
          <BlogCard key={art.slug} article={art} compact />
        ))}
      </div>
    </section>
  );
}