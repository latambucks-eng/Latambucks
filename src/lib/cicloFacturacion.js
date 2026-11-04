// Ciclo de facturación automático — Jueves 16:00 hs (Hora Argentina, UTC-3)

function arNowParts() {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    f.formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  const d = new Date(
    Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  );
  return { ...parts, dow: d.getUTCDay() }; // 0=Dom ... 4=Jue
}

const pad = (n) => String(n).padStart(2, "0");

// Identificador del último corte de facturación que ya pasó (Jueves 16:00 AR).
// Formato YYYY-MM-DD (fecha del jueves en AR).
export function cicloActualMarker() {
  const p = arNowParts();
  let diffDays = (p.dow - 4 + 7) % 7;
  const mismoJueves = p.dow === 4;
  const antesDelCorte = mismoJueves && Number(p.hour) < 16;
  if (antesDelCorte) diffDays = 7; // todavía no llegó el corte de esta semana
  const jue = new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - diffDays * 86400000);
  return `${jue.getUTCFullYear()}-${pad(jue.getUTCMonth() + 1)}-${pad(jue.getUTCDate())}`;
}

// Epoch (ms) del próximo Jueves 16:00 AR.
export function proximoCorteEpoch() {
  const p = arNowParts();
  let diff = (4 - p.dow + 7) % 7;
  if (p.dow === 4 && Number(p.hour) >= 16) diff = 7; // ya pasó hoy, el próximo es en 7 días
  // AR = UTC-3 → 16:00 AR = 19:00 UTC
  return Date.UTC(+p.year, +p.month - 1, +p.day) + diff * 86400000 + 19 * 3600000;
}

export function formatCountdown(ms) {
  if (ms < 0) ms = 0;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
}