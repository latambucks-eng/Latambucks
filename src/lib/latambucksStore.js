import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  supabaseLogin,
  supabaseSignup,
  supabaseGetUser,
  supabaseLogout,
  supabaseDeleteAccount,
  fetchPerfil,
  updatePerfil,
  detectarPaisUsuario,
  checkIsAnunciante,
  initSupabaseConfig,
  rpcIsAdmin,
  rpcBuscarReferido,
  rpcRegistrarReferido,
  fetchAppConfig,
  setSessionExpiredHandler,
  refreshAccessToken,
  decodeJwtExp,
  setTokenRefreshedHandler,
  REFRESH_TOKEN_KEY,
} from "@/lib/supabaseClient";
import { paisDesdeIso } from "@/lib/paisDetectado";

const LatamBucksContext = createContext(null);
const TOKEN_KEY = "lb_token";

export function LatamBucksProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAnunciante, setIsAnunciante] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);

  const refreshPerfil = useCallback(async (tkn, uid) => {
    try {
      const p = await fetchPerfil(tkn, uid);
      setPerfil(p || null);
      return p;
    } catch {
      setPerfil(null);
      return null;
    }
  }, []);

  // Relectura silenciosa del saldo: si falla (red, corte puntual) se conserva
  // el último saldo conocido en pantalla en vez de vaciarlo a 0.
  const refreshPerfilSilencioso = useCallback(async (tkn, uid) => {
    try {
      const p = await fetchPerfil(tkn, uid);
      if (p) setPerfil(p);
    } catch {
      /* se mantiene el último saldo conocido */
    }
  }, []);

  // País real del usuario: se detecta UNA sola vez por IP (al registrarse y
  // en el primer inicio de sesión de las cuentas viejas) y queda fijo en el
  // perfil, sin que el usuario tenga que elegirlo. El código ISO lo guarda la
  // Edge Function con service_role —el navegador no puede escribirlo— y acá
  // solo se traduce al nombre en español para mostrarlo en el perfil.
  const fijarPaisDetectado = useCallback(async (tkn, uid, actual) => {
    if (!tkn || !uid || actual?.pais_detectado) return actual;
    const det = await detectarPaisUsuario(tkn).catch(() => null);
    if (!det?.pais_detectado) return actual;
    const nombre = paisDesdeIso(det.pais_detectado);
    if (nombre && nombre !== actual?.pais) {
      await updatePerfil(tkn, uid, { pais: nombre }).catch(() => {});
    }
    return await refreshPerfil(tkn, uid);
  }, [refreshPerfil]);

  const checkAdmin = useCallback(async (tkn) => {
    try {
      const isAdmin = await rpcIsAdmin(tkn);
      setIsAdmin(isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const checkAnunciante = useCallback(async (tkn, email) => {
    try {
      const is = await checkIsAnunciante(tkn, email);
      setIsAnunciante(is);
    } catch {
      setIsAnunciante(false);
    }
  }, []);

  const fetchExchangeRate = useCallback(async (tkn) => {
    try {
      const value = await fetchAppConfig(tkn, "usd_to_ars_rate");
      setExchangeRate(value ? parseFloat(value) : 0);
    } catch {
      setExchangeRate(0);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      await initSupabaseConfig();
      let tkn = localStorage.getItem(TOKEN_KEY);
      if (!tkn) return;
      // 1) Validar la sesión PRIMERO. Si el JWT venció, parse() intenta
      //    refresh automáticamente; si lo logra, marca err.tokenRefreshed y
      //    el token nuevo ya está en localStorage. Reintentamos con ese.
      let u;
      try {
        u = await supabaseGetUser(tkn);
      } catch (err) {
        if (err?.tokenRefreshed) {
          tkn = localStorage.getItem(TOKEN_KEY);
          u = await supabaseGetUser(tkn);
        } else {
          throw err;
        }
      }
      setUser(u);
      setToken(tkn);
      // 2) Las cargas secundarias (perfil, admin, anunciante, exchange rate)
      //    se intentan por separado: si una falla (red, RLS, dato puntual),
      //    NO se tira la sesión ni se vacía el dashboard. Cada una reporta
      //    su propio estado en silencio.
      const p = await refreshPerfil(tkn, u.id).catch(() => null);
      await fijarPaisDetectado(tkn, u.id, p).catch(() => {});
      await checkAdmin(tkn).catch(() => {});
      await checkAnunciante(tkn, u.email).catch(() => {});
      await fetchExchangeRate(tkn).catch(() => {});
    } catch {
      // Solo llegamos acá si el token de Supabase fue rechazado (vencido/inválido)
      // o un error de red catastrófico. Limpiamos la sesión local.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      setPerfil(null);
      setIsAdmin(false);
      setIsAnunciante(false);
    } finally {
      setLoading(false);
    }
  }, [refreshPerfil, fijarPaisDetectado, checkAdmin, checkAnunciante, fetchExchangeRate]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // El saldo se acredita en el SERVIDOR (postback del proveedor) mientras el
  // usuario completa la oferta en otra pestaña, así que la copia en memoria
  // quedaba vieja hasta recargar la página. Se relee al volver a la pestaña
  // (focus / visibilitychange) y cada 30 s mientras esté visible, para TODAS
  // las pantallas: "Saldos y retiros", Perfil, Inicio, Encuestas, etc.
  useEffect(() => {
    if (!token || !user?.id) return;
    const revalidar = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        refreshPerfilSilencioso(token, user.id);
      }
    };
    document.addEventListener("visibilitychange", revalidar);
    window.addEventListener("focus", revalidar);
    const intervalo = setInterval(revalidar, 30000);
    return () => {
      document.removeEventListener("visibilitychange", revalidar);
      window.removeEventListener("focus", revalidar);
      clearInterval(intervalo);
    };
  }, [token, user?.id, refreshPerfilSilencioso]);

  const login = async (email, password) => {
    setAuthError("");
    await initSupabaseConfig();
    const data = await supabaseLogin(email, password);
    const tkn = data.access_token;
    localStorage.setItem(TOKEN_KEY, tkn);
    if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    setToken(tkn);
    setUser(data.user);
    const p = await refreshPerfil(tkn, data.user.id);
    // Detectar el país real por IP también al iniciar sesión: si el registro
    // quedó pendiente de confirmar el email (sin sesión), la detección no había
    // corrido nunca. No se espera: el login no debe demorar por la geolocalización.
    fijarPaisDetectado(tkn, data.user.id, p).catch(() => {});
    await checkAdmin(tkn);
    await checkAnunciante(tkn, data.user.email);
    await fetchExchangeRate(tkn);
  };

  const register = async (email, password, pais, refCode) => {
    setAuthError("");
    await initSupabaseConfig();
    const data = await supabaseSignup(email, password);
    const u = data.user;
    if (!u) throw new Error("No se pudo crear el usuario");
    const tkn = data.access_token;
    // Si el proyecto exige confirmar el email, Supabase NO devuelve sesión:
    // se avisa en pantalla en vez de devolver al usuario al login sin motivo.
    if (!tkn) {
      setUser(null);
      return { needsConfirmation: true };
    }
    localStorage.setItem(TOKEN_KEY, tkn);
    if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    setToken(tkn);
    setUser(u);
    // Persistir país + referido vía RPC SECURITY DEFINER. Ya NO usamos
    // insertPerfil: el signup de Supabase crea el perfil automáticamente
    // (referido_por NULL, país "Argentina", bono de bienvenida), así que un
    // INSERT chocaba con la PK y tanto el referido como el país se perdían.
    // La RPC hace UPDATE server-side y valida auth.uid().
    if (pais || refCode) {
      try {
        await rpcRegistrarReferido(tkn, refCode, pais);
      } catch {
        // si falla, no bloquea el alta de la cuenta
      }
    }
    const p = await refreshPerfil(tkn, u.id);
    await fijarPaisDetectado(tkn, u.id, p).catch(() => {});
    await checkAdmin(tkn);
    await checkAnunciante(tkn, u.email);
    await fetchExchangeRate(tkn);
    return { needsConfirmation: false };
  };

  const logout = async () => {
    if (token) {
      try { await supabaseLogout(token); } catch {}
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPerfil(null);
    setIsAdmin(false);
    setIsAnunciante(false);
  };

  // Elimina la cuenta en Supabase y limpia la sesión local. El backend exige
  // token válido y borra el usuario de auth; tras el éxito se cierra sesión.
  const deleteAccount = async () => {
    if (!token) throw new Error("Sesión no válida");
    await supabaseDeleteAccount(token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPerfil(null);
    setIsAdmin(false);
    setIsAnunciante(false);
  };

  // Cuando Supabase rechaza un token por vencimiento, limpiamos la sesión
  // local para que la app muestre el login limpio (sin mensajes técnicos
  // en rojo). Todo el resto de los flujos y llamadas siguen intactos.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (typeof window === "undefined") return;
      const tkn = localStorage.getItem(TOKEN_KEY);
      if (tkn) {
        try { supabaseLogout(tkn); } catch {}
        localStorage.removeItem(TOKEN_KEY);
      }
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      setPerfil(null);
      setIsAdmin(false);
      setIsAnunciante(false);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Cuando un refresh de token funciona (reactivo o proactivo), actualizamos
  // el estado de React para que todos los componentes usen el token nuevo.
  useEffect(() => {
    setTokenRefreshedHandler((newToken) => {
      setToken(newToken);
    });
    return () => setTokenRefreshedHandler(null);
  }, []);

  // Refresh proactivo: renueva el JWT ~5 min antes de que venza, así el
  // usuario nunca recibe un 401 por expiración mientras usa la app (incluso
  // si está completando una encuesta externa y la app está en segundo plano).
  useEffect(() => {
    if (!token) return;
    const exp = decodeJwtExp(token);
    if (!exp) return;
    const refreshAt = exp * 1000 - 5 * 60 * 1000; // 5 min antes de expirar
    const delay = refreshAt - Date.now();
    if (delay <= 0) {
      // Ya venció o está por vencer: refresh inmediato.
      refreshAccessToken().then(setToken).catch(() => {});
      return;
    }
    const timeoutId = setTimeout(() => {
      refreshAccessToken().then(setToken).catch(() => {});
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [token]);

  const value = {
    token,
    user,
    perfil,
    setPerfil,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    deleteAccount,
    refreshPerfil,
    isAdmin,
    isAnunciante,
    exchangeRate,
  };

  return React.createElement(
    LatamBucksContext.Provider,
    { value },
    children
  );
}

export function useLatamBucks() {
  const ctx = useContext(LatamBucksContext);
  if (!ctx) throw new Error("useLatamBucks must be used within LatamBucksProvider");
  return ctx;
}
