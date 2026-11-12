import React, { useState } from "react";
import { AVATAR_CATEGORIES } from "@/lib/avatars";
import FunAvatar from "@/components/latambucks/FunAvatar";
import { useI18n } from "@/lib/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, RotateCcw } from "lucide-react";

// Selector de avatar por temáticas. Cada opción se aplica al instante y se
// puede cambiar o quitar las veces que haga falta: no hay pasos que puedan
// quedar a medias ni cargas de archivos que puedan fallar.
export default function AvatarPicker({ open, onClose, value, onSelect, email }) {
  const { t } = useI18n();
  const [categoryId, setCategoryId] = useState(AVATAR_CATEGORIES[0].id);
  const category =
    AVATAR_CATEGORIES.find((c) => c.id === categoryId) || AVATAR_CATEGORIES[0];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b border-border px-4 pb-3 pt-4">
          <DialogTitle className="font-display text-lg font-bold text-foreground">
            {t("avatar.title")}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            {t("avatar.sub")}
          </DialogDescription>
        </div>

        {/* Categorías */}
        <div className="lb-nav-scroll flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2.5">
          {AVATAR_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                c.id === categoryId
                  ? "bg-orange-500 text-orange-950"
                  : "border border-border bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Opciones */}
        <div className="lb-menu-scroll max-h-[44vh] overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-4 gap-2.5">
            {category.items.map((item) => {
              const selected = value === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  aria-label={item.label}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition ${
                    selected
                      ? "bg-orange-500/10 ring-2 ring-orange-500"
                      : "ring-1 ring-transparent hover:bg-background/60 hover:ring-orange-500/40"
                  }`}
                >
                  <div className="relative">
                    <FunAvatar avatarId={item.id} size="md" showLetter={false} />
                    {selected && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-orange-950 ring-2 ring-card">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <button
            onClick={() => onSelect("")}
            className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium transition ${
              value
                ? "text-muted-foreground hover:text-foreground"
                : "text-orange-300 ring-2 ring-orange-500"
            }`}
          >
            <FunAvatar size="sm" showLetter={false} />
            <span className="flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Panda original
            </span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-orange-950 transition hover:bg-orange-400"
          >
            Listo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}