import React from "react";

// Encabezado de proveedor: logo en recuadro blanco + título y subtítulo.
// Es el mismo formato que ya usaba la sección de TimeWall, reutilizado para
// todos los proveedores del filtro de Encuestas.
export default function ProviderHeader({ logo, title, subtitle, action }) {
  return (
    <div className="flex items-center gap-2">
      {/* Recuadro cuadrado blanco e igual para todos los proveedores. Cada uno
          aporta su isotipo cuadrado, así el logo entra nítido y sin deformarse. */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-black/30 ring-1 ring-white/20">
        <img
          src={logo}
          alt={title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
        <p className="text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
