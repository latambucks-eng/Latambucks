import React, { useState, useEffect } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { fetchTareasHoy, fetchRetirosTotales } from "@/lib/supabaseClient";
import CheckinDiario from "@/components/latambucks/CheckinDiario";
import CajasSorpresa from "@/components/latambucks/CajasSorpresa";
import SlotMachine from "@/components/latambucks/SlotMachine";
import { useI18n } from "@/lib/i18n/LanguageContext";

export default function HomeTab() {
  // El refresco del saldo (al volver a la pestaña y cada 30 s) ahora vive en el
  // store global, así que todas las pantallas lo reciben sin polling duplicado.
  const { user, perfil, token } = useLatamBucks();
  const { t } = useI18n();

  const disponible = perfil?.saldo_disponible ?? 0;

  // Estadísticas reales: tareas hoy y retiros totales
  const [tareasHoy, setTareasHoy] = useState(0);
  const [retirosTotales, setRetirosTotales] = useState(0);
  useEffect(() => {
    if (!token || !user?.id) return;
    Promise.all([
      fetchTareasHoy(token, user.id).catch(() => 0),
      fetchRetirosTotales(token, user.id).catch(() => 0),
    ]).then(([t, r]) => {
      setTareasHoy(t);
      setRetirosTotales(r);
    });
  }, [token, user?.id, disponible]);

  return (
    <div className="space-y-5 px-4 pb-4">
      {/* Check-in diario */}
      <CheckinDiario />

      {/* Cajas Sorpresa */}
      <CajasSorpresa />

      {/* Tragamonedas — reemplaza al anuncio de video automático */}
      <SlotMachine />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t("home.tareasHoy")} value={tareasHoy} />
        <StatCard label={t("home.retirosTotales")} value={retirosTotales} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}