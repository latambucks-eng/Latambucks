import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n/LanguageContext";
import Icon3D from "@/components/latambucks/Icon3D";

const TABS = [
  { id: "inicio", path: "/", labelKey: "nav.inicio", icon: "home" },
  { id: "encuestas", path: "/encuestas", labelKey: "nav.encuestas", icon: "surveys" },
  { id: "multiplicar", path: "/multiplicar", labelKey: "nav.ganar", icon: "wheel" },
  { id: "referidos", path: "/referidos", labelKey: "nav.referidos", icon: "referrals" },
  { id: "retiros", path: "/retiros", labelKey: "nav.retirosCorto", icon: "wallet" },
  { id: "perfil", path: "/perfil", labelKey: "nav.perfil", icon: "user" },
  { id: "anunciante", path: "/anunciante", labelKey: "nav.anunciante", icon: "megaphone" },
  { id: "admin", path: "/admin", labelKey: "nav.admin", icon: "shield" },
];

export default function BottomNav({ isAdmin, isAnunciante }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const tabs = TABS.filter(
    (t) => (t.id !== "admin" || isAdmin) && (t.id !== "anunciante" || isAnunciante)
  );
  // "Inicio" vive en la raíz y en /inicio — se resalta en cualquiera de las dos.
  const onHome = pathname === "/" || pathname === "/inicio";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-3 pb-3 pt-1 md:max-w-5xl md:px-4 select-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="flex items-stretch justify-between gap-1 rounded-2xl border border-border bg-card/80 px-2 py-2 backdrop-blur-xl shadow-[0_-4px_30px_-10px] shadow-black/60">
        {tabs.map(({ id, path, labelKey, icon }) => {
          return (
            <NavLink
              key={id}
              to={path}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition select-none"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      (id === "inicio" ? onHome : isActive)
                        ? "bg-orange-500/15 text-orange-400 shadow-[0_0_18px_-4px] shadow-orange-500/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon3D name={icon} className="h-7 w-7 rounded-md" />
                  </span>
                  <span
                    className={`text-[10px] font-medium leading-none ${
                      (id === "inicio" ? onHome : isActive) ? "text-orange-400" : "text-muted-foreground"
                    }`}
                  >
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}