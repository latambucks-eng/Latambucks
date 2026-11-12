import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BlogListItem from "@/components/latambucks/BlogListItem";
import useBlogArticles from "@/lib/blog/useBlogArticles";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Bloque del blog al final de la landing: enlaces a los artículos, cada uno con
// su miniatura, y acceso a la portada del blog.
export default function BlogSection() {
  const { t } = useI18n();
  const articulos = useBlogArticles();

  return (
    <section className="w-full border-t border-border px-4 pb-2 pt-6">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              {t("blog.sectionTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("blog.sectionSub")}</p>
          </div>
          <Link
            to="/blog"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-400 transition hover:text-orange-300"
          >
            {t("blog.readAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {articulos.map((art) => (
            <BlogListItem key={art.slug} article={art} />
          ))}
        </div>
      </div>
    </section>
  );
}
