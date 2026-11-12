import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins } from "lucide-react";
import SiteFooter from "@/components/latambucks/SiteFooter";

// Marco de las páginas públicas del blog (portada y artículos): ancho de
// lectura cómodo, encabezado con marca y pie del sitio.
export default function BlogLayout({ children }) {
  return (
    <div className="lb-stage relative mx-auto flex min-h-screen max-w-[760px] flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/"
          aria-label="Volver a LatamBucks"
          className="flex items-center justify-center rounded-lg bg-secondary/50 p-1.5 text-foreground transition hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
            <Coins className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-foreground">
            Latam<span className="text-orange-400">Bucks</span>
          </span>
        </Link>
        <Link
          to="/blog"
          className="ml-auto shrink-0 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-orange-400 transition hover:bg-orange-500/20"
        >
          Blog
        </Link>
      </header>

      <main className="flex-1 px-4 py-5 pb-14">{children}</main>
      <SiteFooter />
    </div>
  );
}