import React, { useState, useEffect, useCallback } from "react";
import { fetchAvisosSistema, createAvisoSistema, updateAvisoSistema, deleteAvisoSistema } from "@/lib/supabaseClient";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { Megaphone, Plus, Pencil, Trash2, X, Check, Loader2, Inbox } from "lucide-react";

const TIPOS = [
  { value: "info", color: "text-sky-400" },
  { value: "success", color: "text-emerald-400" },
  { value: "warning", color: "text-amber-400" },
  { value: "error", color: "text-rose-400" },
];

const IDIOMAS = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
];

const EMPTY = {
  titulo: "",
  mensaje: "",
  tipo: "info",
  activo: true,
  titulo_en: "",
  mensaje_en: "",
  titulo_pt: "",
  mensaje_pt: "",
};

export default function AdminAvisos() {
  const { t } = useI18n();
  const { token } = useLatamBucks();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // aviso being edited or null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const avisosList = await fetchAvisosSistema(token);
      setAvisos(Array.isArray(avisosList) ? avisosList : []);
    } catch {
      setAvisos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, token]);

  const startCreate = () => {
    setEditing("new");
    setForm(EMPTY);
    setErr("");
  };

  const startEdit = (aviso) => {
    setEditing(aviso.id);
    setForm({
      titulo: aviso.titulo || "",
      mensaje: aviso.mensaje || "",
      tipo: aviso.tipo || "info",
      activo: aviso.activo !== false,
      titulo_en: aviso.titulo_en || "",
      mensaje_en: aviso.mensaje_en || "",
      titulo_pt: aviso.titulo_pt || "",
      mensaje_pt: aviso.mensaje_pt || "",
    });
    setErr("");
  };

  const cancel = () => {
    setEditing(null);
    setForm(EMPTY);
    setErr("");
  };

  const save = async () => {
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setErr(t("admav.required"));
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (editing === "new") {
        await createAvisoSistema(token, form);
      } else {
        await updateAvisoSistema(token, editing, form);
      }
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (e) {
      setErr(e.message || t("admav.err.save"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm(t("admav.confirmDelete"))) return;
    try {
      await deleteAvisoSistema(token, id);
      setAvisos((a) => a.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e.message || t("admav.err.delete"));
    }
  };

  const toggleActivo = async (aviso) => {
    try {
      await updateAvisoSistema(token, aviso.id, { activo: !aviso.activo });
      setAvisos((a) => a.map((x) => (x.id === aviso.id ? { ...x, activo: !x.activo } : x)));
    } catch (e) {
      setErr(e.message || t("admav.err.toggle"));
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-violet-400" />
          <h3 className="font-display text-sm font-semibold text-foreground">{t("admav.title")}</h3>
        </div>
        {editing === null && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1 rounded-lg bg-violet-500/15 px-2.5 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-500/25"
          >
            <Plus className="h-3.5 w-3.5" /> {t("admav.new")}
          </button>
        )}
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}

      {/* Formulario crear/editar */}
      {editing !== null && (
        <div className="space-y-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
          <p className="text-xs font-semibold text-violet-400">
            {editing === "new" ? t("admav.createTitle") : t("admav.editTitle")}
          </p>
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">{t("admav.fieldTitle")}</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              maxLength={120}
              placeholder={t("admav.fieldTitlePh")}
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
              placeholder={t("admav.fieldMessagePh")}
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
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-violet-500"
            />
            {t("admav.active")}
          </label>

          {/* Versiones en otros idiomas: se escriben a mano y son opcionales. */}
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <div>
              <p className="text-[11px] font-semibold text-foreground">{t("admav.otherLangs")}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {t("admav.optionalHint")}
              </p>
            </div>
            {IDIOMAS.map(({ code, label }) => (
              <div key={code} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {label}
                </p>
                <input
                  value={form[`titulo_${code}`]}
                  onChange={(e) => setForm({ ...form, [`titulo_${code}`]: e.target.value })}
                  maxLength={120}
                  placeholder={t("admav.fieldTitlePh")}
                  className="lb-input"
                />
                <textarea
                  value={form[`mensaje_${code}`]}
                  onChange={(e) => setForm({ ...form, [`mensaje_${code}`]: e.target.value })}
                  maxLength={1000}
                  rows={2}
                  placeholder={t("admav.fieldMessagePh")}
                  className="lb-input resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t("admav.save")}
            </button>
            <button
              onClick={cancel}
              className="rounded-xl border border-border px-4 text-sm text-muted-foreground"
            >
              {t("admav.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Lista de avisos */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : avisos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-8 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{t("admav.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {avisos.map((a) => {
            const tipo = TIPOS.find((t) => t.value === a.tipo) || TIPOS[0];
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${tipo.color}`}>{t(`avisos.tipo.${tipo.value}`)}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          a.activo
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.activo ? t("admav.activeShort") : t("admav.inactiveShort")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">{a.titulo}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {a.mensaje}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" /> {t("admav.edit")}
                  </button>
                  <button
                    onClick={() => toggleActivo(a)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
                  >
                    {a.activo ? t("admav.deactivate") : t("admav.activate")}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-400 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3 w-3" /> {t("admav.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
