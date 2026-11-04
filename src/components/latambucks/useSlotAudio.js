import { useCallback, useEffect, useRef } from "react";
import spinSound from "@/assets/sounds/spin.mp3";
import winSound from "@/assets/sounds/win.mp3";
import jackpotSound from "@/assets/sounds/jackpot.mp3";
import notifSound from "@/assets/sounds/notif.mp3";

// Sonidos locales: viajan dentro del build, sin CDN externo.
const SOURCES = {
  spin: [spinSound, 0.4],
  win: [winSound, 0.5],
  jackpot: [jackpotSound, 0.6],
  notif: [notifSound, 0.5],
};

export default function useSlotAudio() {
  const audioSpinRef = useRef(null);
  const audioWinRef = useRef(null);
  const audioJackpotRef = useRef(null);
  const audioNotifRef = useRef(null);
  const audios = useRef({ spin: audioSpinRef, win: audioWinRef, jackpot: audioJackpotRef, notif: audioNotifRef });
  const cutoff = useRef(null);
  const generation = useRef(0);
  const limpiarAudios = useCallback(() => {
    generation.current += 1;
    clearTimeout(cutoff.current);
    cutoff.current = null;
    Object.values(audios.current).forEach(({ current: audio }) => {
      if (!audio) return;
      audio.muted = true; // Silencio inmediato, incluso con play() pendiente.
      audio.loop = false;
      try { audio.pause(); } catch { /* El audio nunca bloquea el juego. */ }
      try { audio.currentTime = 0; } catch { /* Puede no estar cargado. */ }
    });
  }, []);

  // Todos los objetos se preparan y habilitan dentro del clic del usuario.
  // Así premios y notificación no crean un Audio nuevo desde un temporizador.
  const prepararAudios = useCallback((except) => {
    Object.entries(SOURCES).forEach(([name, [url]]) => {
      if (name === except) return;
      try {
        const audio = audios.current[name].current ||= new Audio(url);
        audio.preload = "auto";
        audio.onplaying = audio.ontimeupdate = null;
        audio.volume = 0;
        audio.muted = false;
        audio.play().then(() => {
          if (audio.volume !== 0) return; // No interrumpir un premio que ya empezó.
          try { audio.pause(); audio.currentTime = 0; } catch { /* Habilitación segura. */ }
        }).catch(() => {});
      } catch { /* Un navegador puede bloquear audio; el juego sigue. */ }
    });
  }, []);

  const reproducirAudio = useCallback((name) => {
    limpiarAudios();
    try {
      const [url, volume] = SOURCES[name];
      const audio = audios.current[name].current ||= new Audio(url);
      const version = generation.current;
      const continuous = name === "spin";
      let startedAt = 0;
      audio.volume = volume;
      audio.muted = false;
      audio.loop = continuous;
      audio.onplaying = () => {
        if (generation.current !== version) return;
        if (!continuous && !startedAt) {
          startedAt = Date.now();
          cutoff.current = setTimeout(limpiarAudios, 1000);
        }
      };
      audio.ontimeupdate = () => {
        if (generation.current === version && !continuous &&
          (audio.currentTime >= 1 || (startedAt && Date.now() - startedAt >= 1000))) limpiarAudios();
      };
      audio.play().catch(() => {});
    } catch { /* Autoplay bloqueado: el juego continúa sin sonido. */ }
  }, [limpiarAudios]);

  useEffect(() => {
    Object.entries(SOURCES).forEach(([name, [url]]) => {
      try {
        const audio = audios.current[name].current ||= new Audio(url);
        audio.preload = "auto";
        audio.load();
      } catch { /* Precarga opcional. */ }
    });
    return () => {
      limpiarAudios();
      Object.values(audios.current).forEach((ref) => {
        const audio = ref.current;
        if (!audio) return;
        audio.onplaying = audio.ontimeupdate = null;
        audio.removeAttribute("src");
        try { audio.load(); } catch { /* Liberación segura. */ }
        ref.current = null;
      });
    };
  }, [limpiarAudios]);
  return { limpiarAudios, reproducirAudio, prepararAudios };
}