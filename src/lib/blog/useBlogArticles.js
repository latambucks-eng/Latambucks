import { useEffect, useState } from "react";
import { fetchBlogArticulos } from "@/lib/supabaseClient";
import { BLOG_ARTICLES, mergeArticles } from "@/lib/blog/blogContent";

// Artículos del blog: arranca con el contenido del repo (siempre disponible,
// sin esperas ni pantallas vacías) y, si la tabla blog_articulos de Supabase
// tiene filas, adopta esos textos.
export default function useBlogArticles() {
  const [articulos, setArticulos] = useState(BLOG_ARTICLES);

  useEffect(() => {
    let vivo = true;
    fetchBlogArticulos().then((filas) => {
      if (vivo && filas?.length) setArticulos(mergeArticles(BLOG_ARTICLES, filas));
    });
    return () => {
      vivo = false;
    };
  }, []);

  return articulos;
}