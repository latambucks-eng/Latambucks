import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock } from "lucide-react";
import { Image } from "@/components/ui/image";
import { formatFecha } from "@/lib/blog/blogContent";

// Tarjeta de artículo: imagen, etiquetas, título, extracto y datos de lectura.
export default function BlogCard({ article, compact = false }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-orange-500/40 hover:shadow-lg hover:shadow-black/30">
      <Link to={`/blog/${article.slug}`} className="block h-full">
        <div className="aspect-[16/9] w-full overflow-hidden bg-secondary">
          <Image
            src={article.imagen}
            alt={article.imagenAlt || article.titulo}
            fittingType="fill"
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className={compact ? "p-3" : "p-3.5"}>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {article.etiquetas.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-orange-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-display text-sm font-bold leading-snug text-foreground transition group-hover:text-orange-300">
            {article.titulo}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {article.extracto}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatFecha(article.fecha)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.minutos} min
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}