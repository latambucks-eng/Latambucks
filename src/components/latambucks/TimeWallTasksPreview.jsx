import React from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import { openTimeWallOfferWall } from "@/lib/timeWallOfferWall";
import { Image } from "@/components/ui/image";
import { Clock, ExternalLink, Info } from "lucide-react";
import { TIMEWALL_TASK_IMAGES } from "@/lib/localAssets";

// ============================================================
// TimeWallTasksPreview — Cards de tareas de TimeWall
// ------------------------------------------------------------
// TimeWall no expone un feed JSON de tasks (solo Survey API), así que
// estas cards son manuales con los datos reales de las tareas que
// existen en el muro. Cada card usa la miniatura de la captura que
// pasó el usuario y, al tocarla, abre el e-frame (placement
// 23136e7e5bb49f18) en una pestaña nueva. Los puntos se acreditan
// vía postback (timewall-postback) al completar la tarea en TimeWall.
// Estilo visual idéntico a CampanasLocales (tareas locales).
// ============================================================

const IMAGES = TIMEWALL_TASK_IMAGES;

const TASKS = [
  // ===== Imagen 1 — 4dc886a5b =====
  { title: "Sign Up Timebucks", puntos: 14, duracion: "1 min", img: 0 },
  { title: "Start Trading Today! Free Demo", puntos: 24.5, duracion: "5 min", img: 0 },
  { title: "Join the TimeWall Gifts Telegram Channel", puntos: 14, duracion: "1 min", img: 0 },
  { title: "Join the TimeWall Bonus Clicks Facebook Channel", puntos: 14, duracion: "1 min", img: 0 },

  // ===== Imagen 2 — d7a6264cb =====
  { title: "Follow the Twitter Page", puntos: 3.5, duracion: "1 min", img: 1 },
  { title: "Install an app + signup + KYC", puntos: 141.75, duracion: "11 min", img: 1 },
  { title: "Watch YouTube Video & Earn Money", puntos: 4.55, duracion: "4 min", img: 1 },
  { title: "Download the application and signup", puntos: 52.85, duracion: "6 min", img: 1 },

  // ===== Imagen 3 — f5f143e92 (16 tarjetas) =====
  { title: "Search for this video on YouTube", puntos: 1.4, duracion: "4 min", img: 2 },
  { title: "Sign-up For New Start", puntos: 39.2, duracion: "5 min", img: 2 },
  { title: "Like And Watch 2 minutes video", puntos: 3.85, duracion: "4 min", img: 2 },
  { title: "Signup and install Glowlive", puntos: 67.9, duracion: "6 min", img: 2 },
  { title: "Like the video", puntos: 2.1, duracion: "4 min", img: 2 },
  { title: "Signup On Hifarm App", puntos: 80.15, duracion: "6 min", img: 2 },
  { title: "Watch youtube video", puntos: 1.75, duracion: "5 min", img: 2 },
  { title: "SEARCH + WATCH ON YOUTUBE", puntos: 2.45, duracion: "5 min", img: 2 },
  { title: "Like the video", puntos: 2.1, duracion: "4 min", img: 2 },
  { title: "Avizo singup + Engage", puntos: 77, duracion: "11 min", img: 2 },
  { title: "Avizo singup with activity", puntos: 77, duracion: "11 min", img: 2 },
  { title: "How to make Beautiful Yellow flower", puntos: 0.7, duracion: "5 min", img: 2 },
  { title: "SEARCH + WATCH ON YOUTUBE", puntos: 2.45, duracion: "5 min", img: 2 },
  { title: "Like the video", puntos: 2.1, duracion: "4 min", img: 2 },
  { title: "I Tested Five AI Writing Tools for 30 Days", puntos: 1.05, duracion: "5 min", img: 2 },
  { title: "Like the video", puntos: 2.1, duracion: "4 min", img: 2 },

  // ===== Imagen 4 — b3d4c56cf (16 tarjetas) =====
  { title: "Watch a video for 2 Minutes", puntos: 2.1, duracion: "4 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "5 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 2.45, duracion: "5 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "5 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "5 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 3.15, duracion: "6 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },
  { title: "Search for this video on YouTube and watch one minute", puntos: 1.4, duracion: "6 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },
  { title: "Post comments — Years to Your Life", puntos: 17.85, duracion: "6 min", img: 3 },
  { title: "Avizo invitation with activity", puntos: 77, duracion: "11 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "6 min", img: 3 },

  // ===== Imagen 5 — 451407015 =====
  { title: "Watch a YouTube video", puntos: 1.75, duracion: "5 min", img: 4 },
  { title: "Search + Watch on YouTube", puntos: 2.45, duracion: "5 min", img: 4 },
  { title: "System Mechanic Review", puntos: 1.75, duracion: "5 min", img: 4 },

  // ===== Imagen 6 — ef97167a3 =====
  { title: "YouTube Search + Watch Video For 4 Minutes", puntos: 4.55, duracion: "4 min", img: 5 },

  // ===== Imagen 7 — a8cc52e19 =====
  { title: "YouTube Search + Watch Video For 3 Minutes", puntos: 5.95, duracion: "4 min", img: 6 },
  { title: "Telegram bot — Tap & Earn", puntos: 14, duracion: "5 min", img: 6 },
  { title: "Sign up to Tap Task", puntos: 14, duracion: "5 min", img: 6 },

  // ===== Imagen 8 — 8beac4344 =====
  { title: "Telegram bot — Daily Bonus", puntos: 1.4, duracion: "5 min", img: 7 },
  { title: "Telegram bot — Monfer Verified", puntos: 14, duracion: "5 min", img: 7 },
];

export default function TimeWallTasksPreview() {
  const { user } = useLatamBucks();

  const abrir = () => {
    openTimeWallOfferWall(user);
  };

  return (
    <div className="space-y-3">
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25">
          <ExternalLink className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-foreground">Tareas de TimeWall</h3>
          <p className="text-xs text-muted-foreground">
            Tocá una tarea para abrirla en el muro de TimeWall y ganar puntos
          </p>
        </div>
      </div>

      {/* Lista de tarjetas — mismo estilo que CampanasLocales */}
      <div className="space-y-3">
        {TASKS.map((t, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={abrir}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrir();
              }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-blue-500/40 hover:shadow-lg hover:shadow-black/30"
          >
            {/* Brillo decorativo superior */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-blue-500/20" />

            <div className="relative flex items-center gap-3">
              {/* Miniatura de la captura */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                <Image
                  src={IMAGES[t.img]}
                  fittingType="fill"
                  className="h-full w-full"
                />
              </div>

              {/* Info: título + badges */}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {t.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    {t.puntos} Puntos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {t.duracion}
                  </span>
                </div>
              </div>

              {/* Botón Comenzar */}
              <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition group-hover:from-blue-500 group-hover:to-blue-600">
                <ExternalLink className="h-3.5 w-3.5" /> Comenzar
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <p>
          Estas tareas se completan dentro de TimeWall. Al terminar, los puntos
          se acreditan automáticamente en tu saldo de LatamBucks.
        </p>
      </div>
    </div>
  );
}