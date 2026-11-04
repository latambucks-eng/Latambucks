import { useCallback, useEffect, useState } from "react";

const day = () => new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
const keyFor = (userId) => `lb_slot_recargas:${userId}:${day()}`;
const read = (userId) => {
  if (!userId) return 0;
  try { return Math.max(0, Math.min(4, Number(localStorage.getItem(keyFor(userId))) || 0)); }
  catch { return 0; }
};

// Caché UX del conteo devuelto por el servidor; no reemplaza su frequency capping.
export default function useSlotReloadLimit(userId) {
  const [recargasHoy, setCount] = useState(() => read(userId));
  const consultarLimite = useCallback(() => {
    const count = read(userId);
    setCount(count);
    return count;
  }, [userId]);
  const registrarConteo = useCallback((count) => {
    if (!Number.isFinite(Number(count))) return;
    const next = Math.max(read(userId), Math.min(4, Math.max(0, Number(count))));
    try { if (userId) localStorage.setItem(keyFor(userId), String(next)); } catch { /* Caché opcional. */ }
    setCount(next);
  }, [userId]);
  useEffect(() => {
    consultarLimite();
    const onStorage = (event) => { if (event.key === keyFor(userId)) consultarLimite(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", consultarLimite);
    const timer = setInterval(consultarLimite, 30000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", consultarLimite);
    };
  }, [userId, consultarLimite]);
  return { recargasHoy, consultarLimite, registrarConteo };
}