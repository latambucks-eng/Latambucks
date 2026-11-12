import React from "react";
import { useI18n } from "@/lib/i18n/LanguageContext";
import CampanasLocales from "@/components/latambucks/CampanasLocales";
import HistorialTareas from "@/components/latambucks/HistorialTareas";
import TimeWallEframe from "@/components/latambucks/TimeWallEframe";
import TaskSectionHeader from "@/components/latambucks/TaskSectionHeader";
import { tareasText } from "@/lib/i18n/content/tareas";
import Icon3D from "@/components/latambucks/Icon3D";

export default function TareasAnunciantesTab() {
  const { t, lang } = useI18n();
  const txt = tareasText(lang);
  return (
    <div className="space-y-6 px-4 pb-4">
      <header className="pt-1">
        <div className="flex items-center gap-3">
          <Icon3D name="megaphone" className="h-11 w-11 rounded-xl shadow-lg shadow-black/30" />
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{t("tabs.tareas.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("tabs.tareas.sub")}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <TaskSectionHeader
          tone="blue"
          title={txt.proveedores.title}
          description={txt.proveedores.sub}
        />
        <TimeWallEframe />
      </section>

      <section className="space-y-3">
        <TaskSectionHeader
          tone="violet"
          title={txt.latambucks.title}
          description={txt.latambucks.sub}
        />
        <CampanasLocales />
      </section>

      <HistorialTareas />
    </div>
  );
}