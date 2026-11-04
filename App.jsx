import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import ScrollToTop from './components/ScrollToTop';
import LatamBucks from '@/pages/LatamBucks';
import ActualizarClave from '@/pages/ActualizarClave';
import Faq from '@/pages/Faq';
import Terminos from '@/pages/Terminos';
import Normas from '@/pages/Normas';
import Reembolsos from '@/pages/Reembolsos';
import DerechosAutor from '@/pages/DerechosAutor';
import AcercaDe from '@/pages/AcercaDe';
import Contacto from '@/pages/Contacto';
import Privacidad from '@/pages/Privacidad';
import Cookies from '@/pages/Cookies';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// La sesión la resuelve Supabase (lb_token + AuthScreen). No hay ninguna capa
// de autenticación externa: las páginas legales y el shell público se montan
// directamente y el resto queda dentro del shell de LatamBucks.

const AppRoutes = () => {
  // Páginas públicas accesibles sin sesión
  const publicPaths = ['/actualizar-clave', '/faq', '/terminos', '/normas', '/reembolsos', '/derechos-autor', '/acerca-de', '/contacto', '/privacidad', '/cookies', '/login', '/register', '/forgot-password', '/reset-password'];
  if (publicPaths.includes(window.location.pathname)) {
    return (
      <Routes>
        <Route path="/actualizar-clave" element={<ActualizarClave />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/normas" element={<Normas />} />
        <Route path="/reembolsos" element={<Reembolsos />} />
        <Route path="/derechos-autor" element={<DerechosAutor />} />
        <Route path="/acerca-de" element={<AcercaDe />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* LatamBucks deriva su pestaña activa de la URL (useLocation), sin
          <Routes> anidado propio. Se monta como layout route que cubre la
          raíz y todas las rutas de pestaña. */}
      <Route element={<LatamBucks />}>
        <Route path="/" element={null} />
        <Route path="/inicio" element={null} />
        <Route path="/ganar" element={null} />
        <Route path="/tareas-anunciantes" element={null} />
        <Route path="/encuestas" element={null} />
        <Route path="/timewall" element={null} />
        <Route path="/retiros" element={null} />
        <Route path="/referidos" element={null} />
        <Route path="/perfil" element={null} />
        <Route path="/admin" element={null} />
        <Route path="/anunciante" element={null} />
      </Route>
      <Route path="/actualizar-clave" element={<ActualizarClave />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/normas" element={<Normas />} />
      <Route path="/reembolsos" element={<Reembolsos />} />
      <Route path="/derechos-autor" element={<DerechosAutor />} />
      <Route path="/acerca-de" element={<AcercaDe />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </LanguageProvider>
  )
}

export default App