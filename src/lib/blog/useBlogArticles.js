import { useEffect, useState } from "react";
import { fetchBlogArticulos } from "@/lib/supabaseClient";
import { getBlogArticles, mergeArticles } from "@/lib/blog/blogContent";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Artículos del blog en el idioma elegido en el sitio. Arranca con el contenido
// del repo (siempre disponible, sin pantallas vacías) y, en español, adopta los
// textos de la tabla blog_articulos de Supabase si tiene filas.
export default function useBlogArticles() {
  const { lang } = useI18n();
  const [articulos, setArticulos] = useState(() => getBlogArticles(lang));

  useEffect(() => {
    setArticulos(getBlogArticles(lang));
    // Los textos guardados en la base están en español: no pisan EN ni PT.
    if (lang !== "es") return undefined;

    let vivo = true;
    fetchBlogArticulos().then((filas) => {
      if (vivo && filas?.length) setArticulos(mergeArticles(getBlogArticles("es"), filas));
    });
    return () => {
      vivo = false;
    };
  }, [lang]);

  return articulos;
}
