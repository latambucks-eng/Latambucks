import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Coins, ClipboardList, Gift, Wallet, User, Shield, Megaphone, Users, X, LogOut, ClipboardCheck, BookOpen } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import LanguagePicker from "@/components/latambucks/LanguagePicker";
import { brandLogo } from "@/lib/localAssets";

const LOGO_URL = brandLogo;

const TABS = [
  { id: "ganar", path: "/ganar", labelKey: "nav.ganar", icon: Coins },
  { id: "tareas-anunciantes", path: "/tareas-anunciantes", labelKey: "nav.tareas", icon: ClipboardCheck },
  { id: "encuestas", path: "/encuestas", labelKey: "nav.encuestas", icon: ClipboardList },
  { id: "timewall", path: "/timewall", labelKey: "nav.ofertas", icon: Gift },
  { id: "retiros", path: "/retiros", labelKey: "nav.retiros", icon: Wallet },
  { id: "referidos", path: "/referidos", labelKey: "nav.referidos", icon: Users },
  { id: "perfil", path: "/perfil", labelKey: "nav.perfil", icon: User },
  { id: "anunciante", path: "/anunciante", labelKey: "nav.anunciante", icon: Megaphone },
  { id: "admin", path: "/admin", labelKey: "nav.admin", icon: Shield },
];

function LogoutButton({ onDone }) {
  const { logout } = useLatamBucks();
  const { t } = useI18n();
  return (
    <button
      onClick={() => { logout(); onDone?.(); }}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2.5 text-left transition-all duration-300 ring-1 ring-rose-500/20 hover:bg-rose-500/10 hover:ring-rose-500/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 transition group-hover:bg-rose-500/20">
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="text-sm font-medium text-rose-400/90 transition group-hover:text-rose-400">
        {t("nav.cerrarSesion")}
      </span>
    </button>
  );
}

function GuideButton({ onClick }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      className="group mt-3 flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left ring-1 ring-orange-500/25 transition-all duration-300 hover:bg-orange-500/10 hover:ring-orange-500/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 transition group-hover:bg-orange-500/20">
        <BookOpen className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="text-sm font-medium text-orange-300/90 transition group-hover:text-orange-300">
        {t("nav.guia")}
      </span>
    </button>
  );
}

function NavItems({ tabs, onEncuestas, onNavigate }) {
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-1.5">
      {tabs.map(({ id, path, labelKey, icon: Icon }) => (
        <NavLink
          key={id}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) => {
            const active = id === "encuestas" ? onEncuestas : isActive;
            return `group relative flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-300 select-none ${
              active
                ? "bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent ring-1 ring-orange-500/30"
                : "hover:bg-card/60 ring-1 ring-transparent"
            }`;
          }}
        >
          {({ isActive }) => {
            const active = id === "encuestas" ? onEncuestas : isActive;
            return (
              <>
                {/* Barra lateral de acento para el ítem activo */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_10px] shadow-orange-500/70" />
                )}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-br from-orange-500/25 to-orange-600/10 text-orange-400 shadow-[0_0_20px_-3px] shadow-orange-500/70 scale-105"
                      : "bg-card/40 text-muted-foreground group-hover:text-foreground group-hover:bg-card/80"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                <span
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? "bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {t(labelKey)}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}

export default function SideNav({ isAdmin, isAnunciante, isOpen, onClose, onOpenGuide }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  // La pestaña Anunciante es visible para todos los usuarios logueados:
  // cualquiera puede crear una campaña. Solo Admin sigue restringido por rol.
  const tabs = TABS.filter((t) => t.id !== "admin" || isAdmin);
  // Encuestas se resalta tanto en su ruta como en la raíz (landing).
  const onEncuestas = pathname === "/" || pathname === "/encuestas";

  return (
    <>
      {/* Escritorio / tablet — barra lateral fija permanente en md+ */}
      <aside className="hidden md:grid md:grid-rows-[auto_minmax(0,1fr)] md:fixed md:top-0 md:left-0 md:h-[100dvh] md:w-64 md:overflow-hidden md:border-r md:border-border md:bg-card/40 md:backdrop-blur-xl md:z-30 md:py-5 md:px-3">
        <div className="mb-6 flex shrink-0 items-center gap-2 px-2">
          <Image src={LOGO_URL} alt="LatamBucks" fittingType="fill" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Latam<span className="text-orange-400">Bucks</span>
          </span>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-1 pb-2 lb-menu-scroll">
          <NavItems tabs={tabs} onEncuestas={onEncuestas} />
          <GuideButton onClick={onOpenGuide} />
          <div className="mt-3 px-1">
            <LanguagePicker />
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Móvil — drawer deslizable desde la izquierda con overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <aside className="fixed top-0 left-0 z-50 grid h-[100dvh] w-72 max-w-[85vw] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-r border-border bg-card/95 backdrop-blur-xl py-5 px-3 md:hidden">
            <div className="mb-4 flex shrink-0 items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Image src={LOGO_URL} alt="LatamBucks" fittingType="fill" className="h-8 w-8 rounded-lg" />
                <span className="font-display text-lg font-bold tracking-tight text-foreground">
                  Latam<span className="text-orange-400">Bucks</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-background/60"
                aria-label={t("nav.cerrarMenu")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-1 pb-2 lb-menu-scroll">
              <NavItems tabs={tabs} onEncuestas={onEncuestas} onNavigate={onClose} />
              <GuideButton onClick={() => { onClose?.(); onOpenGuide?.(); }} />
              <div className="mt-3">
                <LanguagePicker />
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <LogoutButton onDone={onClose} />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}