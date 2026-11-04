import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Loader2, Search } from "lucide-react";
import { COUNTRIES_BY_CONTINENT, getCountryFlag } from "@/components/latambucks/countryFlags";
import { useI18n } from "@/lib/i18n/LanguageContext";

// Selector de país con banderas para la sección Perfil.
// Muestra el país actual con su bandera y un dropdown con todos los
// países del mundo agrupados por continente, con buscador integrado.
// Al seleccionar, llama onChange(countryName) que guarda el país en el
// perfil (perfiles.pais).
export default function LatamCountryPicker({ value, onChange, disabled }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const currentFlag = getCountryFlag(value);
  const isGeneric = !value || value === "Latam";

  // Cierra el dropdown al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Filtra los países por término de búsqueda (case-insensitive, sin acentos).
  const filtered = useMemo(() => {
    const norm = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const q = norm(query.trim());
    if (!q) return COUNTRIES_BY_CONTINENT;
    return COUNTRIES_BY_CONTINENT.map((grupo) => ({
      ...grupo,
      paises: grupo.paises.filter((p) => norm(p).includes(q)),
    })).filter((g) => g.paises.length > 0);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-border/80 disabled:opacity-60"
      >
        <span className="text-xl leading-none">{currentFlag}</span>
        <span className="flex-1 text-sm font-medium text-foreground">
          {isGeneric ? t("picker.seleccionar") : value}
        </span>
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/40">
          {/* Buscador */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("picker.buscar")}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              autoFocus
            />
          </div>

          {/* Lista de países agrupada por continente */}
          <div className="lb-menu-scroll max-h-72 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </p>
            )}
            {filtered.map((grupo) => (
              <div key={grupo.continente}>
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {grupo.continente}
                </p>
                {grupo.paises.map((country) => {
                  const active = value === country;
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        onChange(country);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        active
                          ? "bg-orange-500/15 text-orange-300"
                          : "text-foreground hover:bg-card/80"
                      }`}
                    >
                      <span className="text-lg leading-none">{getCountryFlag(country)}</span>
                      <span className="flex-1 text-sm font-medium">{country}</span>
                      {active && <Check className="h-4 w-4 text-orange-400" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}