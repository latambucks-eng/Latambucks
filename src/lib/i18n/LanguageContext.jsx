import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, DICTIONARY, LOCALES } from "./dictionary";

// Idioma global de la app.
// Guarda la elección en el dispositivo (localStorage), la restaura al volver a
// entrar y sincroniza el atributo lang del documento. Si no hay preferencia
// guardada, usa el idioma del navegador cuando es uno de los soportados.

const STORAGE_KEY = "lb_lang";

const isSupported = (id) => LOCALES.some((l) => l.id === id);

function readInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
    const browser = String(navigator.language || "").slice(0, 2).toLowerCase();
    if (isSupported(browser)) return browser;
  } catch {
    /* almacenamiento no disponible */
  }
  return DEFAULT_LOCALE;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento no disponible: el idioma sigue vivo en memoria */
    }
  }, [lang]);

  const setLang = useCallback((id) => {
    if (isSupported(id)) setLangState(id);
  }, []);

  // t("nav.ganar") → texto del idioma activo; si falta, cae al español.
  const t = useCallback(
    (key, vars) => {
      let text = DICTIONARY[lang]?.[key] ?? DICTIONARY[DEFAULT_LOCALE][key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.split(`{${name}}`).join(String(value));
        });
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, locales: LOCALES }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// Respaldo silencioso: un componente usado fuera del proveedor no rompe la
// pantalla, simplemente muestra español.
const FALLBACK = {
  lang: DEFAULT_LOCALE,
  setLang: () => {},
  t: (key) => DICTIONARY[DEFAULT_LOCALE][key] ?? key,
  locales: LOCALES,
};

export function useI18n() {
  return useContext(LanguageContext) || FALLBACK;
}