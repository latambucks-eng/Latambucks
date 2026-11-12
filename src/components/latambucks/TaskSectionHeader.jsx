import React from "react";
import Icon3D from "@/components/latambucks/Icon3D";

// Título + descripción corta para separar los dos tipos de microtareas.
// Icono 3D por tipo de tarea: azul = proveedores externos (ofertas y apps),
// violeta = microtareas de anunciantes.
export default function TaskSectionHeader({ title, description, tone = "violet" }) {
  const bar = tone === "blue" ? "bg-blue-400" : "bg-violet-400";
  const icon = tone === "blue" ? "apps" : "megaphone";

  return (
    <div className="px-1">
      <div className="flex items-center gap-2">
        <span className={`h-3.5 w-1 rounded-full ${bar}`} />
        <Icon3D name={icon} className="h-7 w-7" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-0.5 pl-9 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}