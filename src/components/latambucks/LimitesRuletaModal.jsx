import React from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LimitesRuletaContenido from "@/components/latambucks/LimitesRuletaContenido";

// Enlace discreto bajo los checks: abre el modal oscuro con las probabilidades
// exactas y los límites por tier. Los valores viven en el contenido i18n.
export default function LimitesRuletaModal({ copy, label }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground/80 underline-offset-2 transition hover:text-foreground hover:underline"
        >
          <Info className="h-3 w-3 shrink-0" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto border-border bg-card p-5">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{copy.title}</DialogTitle>
        </DialogHeader>
        <LimitesRuletaContenido copy={copy} />
      </DialogContent>
    </Dialog>
  );
}
