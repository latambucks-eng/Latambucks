import { Play, ClipboardList, Users, Gamepad2, Smartphone, Target, Gift } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

const ITEMS = [
  { icon: Play, labelKey: "fl.videos", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
  { icon: ClipboardList, labelKey: "fl.encuestas", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  { icon: Users, labelKey: "fl.referidos", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
  { icon: Gamepad2, labelKey: "fl.juegos", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  { icon: Smartphone, labelKey: "fl.apps", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
  { icon: Target, labelKey: "fl.tareas", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  { icon: Gift, labelKey: "fl.recompensas", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
];

export default function FloatingIcons() {
  const { t } = useI18n();
  return (
    <div className="relative z-10 mt-6 overflow-hidden">
      {/* Fade gradients en los bordes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-16" />

      <div className="flex w-max animate-marquee gap-3">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div
            key={i}
            className={`flex shrink-0 items-center gap-2 rounded-full border ${item.border} ${item.bg} px-3.5 py-2 backdrop-blur-sm sm:px-4`}
          >
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="whitespace-nowrap text-xs font-medium text-foreground/80">
              {t(item.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}