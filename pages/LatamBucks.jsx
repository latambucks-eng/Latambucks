import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LatamBucksProvider, useLatamBucks } from "@/lib/latambucksStore";
import AuthScreen from "@/components/latambucks/AuthScreen";
import SideNav from "@/components/latambucks/SideNav";
import GanarTab from "@/components/latambucks/GanarTab";
import TareasAnunciantesTab from "@/components/latambucks/TareasAnunciantesTab";
import EncuestasTab from "@/components/latambucks/EncuestasTab";
import TimeWallTab from "@/components/latambucks/TimeWallTab";
import WithdrawalsTab from "@/components/latambucks/WithdrawalsTab";
import ReferidosTab from "@/components/latambucks/ReferidosTab";
import ProfileTab from "@/components/latambucks/ProfileTab";
import AdminTab from "@/components/latambucks/AdminTab";
import AnunciantePanel from "@/components/latambucks/AnunciantePanel";
import PaymentStatusToast from "@/components/latambucks/PaymentStatusToast";
import AvisoBanner from "@/components/latambucks/AvisoBanner";
import { brandLogo } from "@/lib/localAssets";
import SiteFooter from "@/components/latambucks/SiteFooter";
import GanadoresSlider from "@/components/latambucks/GanadoresSlider";
import CookieConsentBanner from "@/components/latambucks/CookieConsentBanner";
import GuiaInteractiva from "@/components/latambucks/GuiaInteractiva";
import LanguagePicker from "@/components/latambucks/LanguagePicker";
import { Loader2, Menu, BookOpen } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/lib/i18n/LanguageContext";

const LOGO_URL = brandLogo;

function Shell() {
  const { user, loading, isAdmin, isAnunciante } = useLatamBucks();
  const { t } = useI18n();
  const location = useLocation();
  const path = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Cierra el drawer del menú lateral al cambiar de ruta.
  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  // Guía interactiva: se abre sola la primera vez que el usuario entra
  // (una sola vez por cuenta, recordado en localStorage). Después queda
  // siempre disponible desde el botón del encabezado y el menú lateral.
  useEffect(() => {
    if (!user?.id) return;
    const key = `lb_guia_vista_${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setGuideOpen(true);
  }, [user?.id]);

  // Google Ads — SIGNUP conversion.
  // Supabase crea el usuario fuera de las páginas de la app (email/OTP o OAuth)
  // y el usuario aterriza autenticado en la raíz. Se dispara en el primer render
  // autenticado, sólo si la cuenta fue creada en las últimas 24h (signup nuevo,
  // no login recurrente) y sin doble disparo vía localStorage.
  // La etiqueta base (AW-18480858834) se inicializa en index.html. Se deja el
  // evento como sign_up genérico sobre la etiqueta mientras no se configure la
  // acción de conversión "Registro" en el panel de Google Ads.
  useEffect(() => {
    if (typeof window === 'undefined' || !user || !user.id) return;
    // Supabase usa created_at (no created_date)
    const createdDate = String(user.created_at || user.created_date || '');
    const createdDateUtc = /(?:Z|[+-]\d{2}:?\d{2})$/.test(createdDate)
        ? createdDate
        : createdDate + 'Z';
    const createdAtMs = Date.parse(createdDateUtc);
    const isNewSignup = Number.isFinite(createdAtMs) &&
        Date.now() - createdAtMs < 24 * 60 * 60 * 1000;
    const key = '_aw_signup_fired_AW-18480858834_' + user.id;
    if (!isNewSignup || localStorage.getItem(key)) return;
    let tries = 0;
    const fire = () => {
        if (!window.gtag) { if (tries++ < 20) setTimeout(fire, 250); return; }
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
        window.gtag('event', 'sign_up', { send_to: 'AW-18480858834' });
    };
    fire();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="lb-stage relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background md:ml-64 md:max-w-5xl md:px-6">
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-400 transition hover:bg-orange-500/20 md:hidden"
            aria-label={t("shell.abrirMenu")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src={LOGO_URL}
            alt="LatamBucks"
            fittingType="fill"
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Latam<span className="text-orange-400">Bucks</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguagePicker className="md:hidden" />
          <button
            onClick={() => setGuideOpen(true)}
            aria-label={t("shell.abrirGuia")}
            title={t("shell.guia")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 transition hover:bg-orange-500/20"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <span className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" /> {t("shell.enLinea")}
          </span>
        </div>
      </header>

      {/* Aviso del sistema — visible para todos los usuarios logueados */}
      <AvisoBanner />

      {/* Stage — la pestaña activa se deriva directamente de la URL actual.
          El Router padre solo monta LatamBucks en "/"; aquí NO usamos un
          <Routes> anidado, lo que evita que las rutas absolutas de las
          pestañas choquen con el router de App.jsx y dejen el main vacío. */}
      <main className="flex-1 overflow-y-auto pb-8 pt-3">
        {/* Ganadores en vivo — arriba, en todas las pestañas menos Perfil
            y Retiros (donde el usuario está viendo sus propios saldos). */}
        {!TABS_SIN_GANADORES.includes(path) && (
          <div className="px-4 pb-1">
            <GanadoresSlider />
          </div>
        )}
        {renderTab(path, isAdmin, isAnunciante)}
        <SiteFooter />
      </main>

      <SideNav
        isAdmin={isAdmin}
        isAnunciante={isAnunciante}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenGuide={() => setGuideOpen(true)}
      />
      <GuiaInteractiva open={guideOpen} onClose={() => setGuideOpen(false)} />
      <PaymentStatusToast />
      {/* Aviso de consentimiento de cookies — simple y no intrusivo */}
      <CookieConsentBanner />
    </div>
  );
}

// Pestañas donde NO se muestra el slider de ganadores (perfil y retiros:
// el usuario está concentrado en su propio saldo).
const TABS_SIN_GANADORES = ["/perfil", "/retiros"];

// Renderiza la pestaña según la URL. Rutas de rol que no corresponden
// (admin/anunciante sin permiso) caen al inicio. Cualquier otra ruta
// desconocida también aterriza en inicio.
function renderTab(path, isAdmin, isAnunciante) {
  // La raíz "/" es la landing: muestra Encuestas como primera pestaña.
  if (path === "/") return <EncuestasTab />;
  // El flujo de Inicio se mudó al menú Ganar; /inicio redirige ahí.
  if (path === "/inicio") return <Navigate to="/ganar" replace />;
  if (path === "/ganar") return <GanarTab />;
  if (path === "/tareas-anunciantes") return <TareasAnunciantesTab />;
  if (path === "/encuestas") return <EncuestasTab />;
  if (path === "/timewall") return <TimeWallTab />;
  if (path === "/retiros") return <WithdrawalsTab />;
  if (path === "/referidos") return <ReferidosTab />;
  if (path === "/perfil") return <ProfileTab />;
  // Rutas de rol: si el usuario no tiene el permiso, se redirige a /ganar
  // (panel principal) en vez de dejar la URL rota.
  if (path === "/admin") return isAdmin ? <AdminTab /> : <Navigate to="/ganar" replace />;
  if (path === "/anunciante") return <AnunciantePanel />;
  // Cualquier otra ruta desconocida cae al panel Ganar.
  return <GanarTab />;
}

export default function LatamBucks() {
  return (
    <LatamBucksProvider>
      <Shell />
    </LatamBucksProvider>
  );
}