import React, { useState, useEffect, useCallback } from "react";
import { useLatamBucks } from "@/lib/latambucksStore";
import {
  searchUsuariosByEmail,
  fetchAllAvisosUsuario,
  createAvisoUsuario,
  deleteAvisoUsuario,
} from "@/lib/supabaseClient";
import { Send, Loader2, Inbox, Search, Trash2, Mail, UserCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageContext";

const TIPOS = [
  { value: "info", color: "text-sky-400", ring: "ring-sky-500/30", bg: "bg-sky-500/10" },
  { value: "success", color: "text-emerald-400", ring: "ring-emerald-500/30", bg: "bg-emerald-500/10" },
  { value: "warning", color: "text-amber-400", ring: "ring-amber-500/30", bg: "bg-amber-500/10" },
  { value: "error", color: "text-rose-400", ring: "ring-rose-500/30", bg: "bg-rose-500/10" },
];

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function AdminAvisosUsuario() {
  const { t } = useI18n();
  const { token } = useLatamBucks();
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ titulo: "", mensaje: "", tipo: "info" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [sentList, setSentList] = useState([]);
  const [sentLoading, setSentLoading] = useState(true);

  const loadSent = useCallback(async () => {
    if (!token) return;
    setSentLoading(true);
    try {
      const avisos = await fetchAllAvisosUsuario(token);
      setSentList(Array.isArray(avisos) ? avisos : []);
    } catch {
      setSentList([]);
    } finally {
      setSentLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSent();
  }, [loadSent]);

  const doSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setErr("");
    try {
      const resultados = await searchUsuariosByEmail(token, searchText.trim());
      setUsers(Array.isArray(resultados) ? resultados : []);
    } catch (e) {
      setErr(e.message || t("admavusr.err.search"));
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const send = async () => {
    if (!selectedUser) { setErr(t("admavusr.err.selectUser")); return; }
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setErr(t("admavusr.required"));
      return;
    }
    setSending(true);
    setErr("");
    setOk("");
    try {
      await createAvisoUsuario(token, {
        usuario_id: selectedUser.id,
        titulo: form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        tipo: form.tipo,
      });
      setOk(t("admavusr.sent", { email: selectedUser.email }));
      setForm({ titulo: "", mensaje: "", tipo: "info" });
      setSelectedUser(null);
      setUsers([]);
      setSearchText("");
      await loadSent();
    } catch (e) {
      setErr(e.message || t("admavusr.err.send"));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    if (!confirm(t("admavusr.confirmDelete"))) return;
    try {
      const borrado = await deleteAvisoUsuario(token, id);
      if (!borrado) throw new Error(t("admavusr.err.deleteItem"));
      setSentList((s) => s.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e.message || t("admavusr.err.delete"));
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-amber-400" />
        <h3 className="font-display text-sm font-semibold text-foreground">
          {t("admavusr.title")}
        </h3>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t("admavusr.subtitle")}
      </p>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}
      {ok && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{ok}</p>}

      {/* Buscar usuario */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder={t("admavusr.searchPh")}
            className="lb-input pl-9"
          />
        </div>
        <button
          onClick={doSearch}
          disabled={searching || !searchText.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-500/25 disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          {t("admavusr.search")}
        </button>
      </div>

      {/* Resultados de búsqueda */}
      {users.length > 0 && !selectedUser && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            {t("admavusr.pickHint")}
          </p>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-amber-500/40"
            >
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{u.email}</p>
                <p className="text-[11px] text-muted-foreground">{u.pais || "Latam"}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!searching && users.length === 0 && !selectedUser && searchText.trim() && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-6 text-center">
          <Search className="h-5 w-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {t("admavusr.noResults")}
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            {t("admavusr.noResultsHint")}
          </p>
        </div>
      )}

      {/* Usuario seleccionado + formulario */}
      {selectedUser && (
        <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-400" />
              <span className="truncate text-sm font-semibold text-foreground">{selectedUser.email}</span>
            </div>
            <button
              onClick={() => { setSelectedUser(null); setUsers([]); }}
              className="text-xs text-muted-foreground underline"
            >
              {t("admavusr.change")}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">{t("admav.fieldTitle")}</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              maxLength={120}
              placeholder={t("admavusr.fieldTitlePh")}
              className="lb-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">{t("admav.fieldMessage")}</label>
            <textarea
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              maxLength={1000}
              rows={3}
              placeholder={t("admavusr.fieldMessagePh")}
              className="lb-input resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">{t("admav.fieldType")}</label>
            <div className="flex gap-2">
              {TIPOS.map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setForm({ ...form, tipo: tipo.value })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    form.tipo === tipo.value
                      ? `border-current ${tipo.color} bg-card`
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t(`avisos.tipo.${tipo.value}`)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={send}
            disabled={sending}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-amber-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t("admavusr.send")}
          </button>
        </div>
      )}

      {/* Lista de avisos enviados */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground">{t("admavusr.sentList")}</p>
        {sentLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sentList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-6 text-center">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t("admavusr.emptySent")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sentList.map((a) => {
              const tipo = TIPOS.find((t) => t.value === a.tipo) || TIPOS[0];
              return (
                <div key={a.id} className={`rounded-xl border ${tipo.ring} ${tipo.bg} p-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${tipo.color}`}>{t(`avisos.tipo.${tipo.value}`)}</span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {a.email || "—"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-foreground">{a.titulo}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {a.mensaje}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{formatDate(a.creado_el)}</p>
                    </div>
                    <button
                      onClick={() => remove(a.id)}
                      className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 transition hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}