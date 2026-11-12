import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { formatFecha } from "@/lib/blog/blogContent";

// Fila de artículo: toda la tarjeta es un enlace, con la imagen en miniatura a
// la izquierda. Pensada para leerse como una lista de enlaces en cualquier
// tamaño de pantalla (celular, tablet y escritorio).
export default function BlogListItem({ article }) {
  const { lang, t } = useI18n();

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-2.5 transition hover:border-orange-500/40 hover:bg-card/80"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-20 sm:w-20">
        <Image
          src={article.imagen}
          alt={article.imagenAlt || article.titulo}
          fittingType="fill"
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[13px] font-bold leading-snug text-foreground transition group-hover:text-orange-300 sm:text-sm">
          {article.titulo}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {article.extracto}
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
          {formatFecha(article.fecha, lang)} · {t("blog.shortMin", { n: article.minutos })}
        </p>
      </div>
    </Link>
  );
}
