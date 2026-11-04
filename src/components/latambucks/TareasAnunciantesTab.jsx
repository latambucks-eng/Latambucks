import React from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import CampanasLocales from "@/components/latambucks/CampanasLocales";
import HistorialTareas from "@/components/latambucks/HistorialTareas";
import TimeWallTasksPreview from "@/components/latambucks/TimeWallTasksPreview";
import { ClipboardCheck } from "lucide-react";

export default function TareasAnunciantesTab() {
  const { t } = useI18n();
  return (
    <div className="space-y-6 px-4 pb-4">
      <header className="pt-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-600/5 text-violet-400 ring-1 ring-violet-500/25 shadow-lg shadow-black/30">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{t("tabs.tareas.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("tabs.tareas.sub")}
            </p>
          </div>
        </div>
      </header>

      <TimeWallTasksPreview />

      <CampanasLocales />

      <HistorialTareas />

      <p className="px-1 text-center text-xs text-muted-foreground">
        A medida que completes tareas, accederás a más oportunidades cada día.
      </p>
    </div>
  );
}