import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLatamBucks } from "@/lib/latambucksStore";
import { useI18n } from "@/lib/i18n/LanguageContext";
import { updatePerfil } from "@/lib/supabaseClient";
import { readAvatarId, saveAvatarId } from "@/lib/avatars";
import { Mail, MapPin, Shield, Coins, Clock, Hash, Trash2, AlertTriangle, Loader2, Pencil } from "lucide-react";
import SoportePanel from "@/components/latambucks/SoportePanel";
import AvisosReversos from "@/components/latambucks/AvisosReversos";
import WhatsappChannelCard from "@/components/latambucks/WhatsappChannelCard";
import FunAvatar from "@/components/latambucks/FunAvatar";
import AvatarPicker from "@/components/latambucks/AvatarPicker";
import LatamCountryPicker from "@/components/latambucks/LatamCountryPicker";
import { getCountryFlag } from "@/components/latambucks/countryFlags";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ProfileTab() {
  const { t } = useI18n();
  const { user, perfil, deleteAccount, isAdmin, token, setPerfil } = useLatamBucks();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [savingPais, setSavingPais] = useState(false);
  const [paisErr, setPaisErr] = useState("");
  const [avatarId, setAvatarId] = useState(() => readAvatarId(user?.id));
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Al cambiar de cuenta (login/logout), se relee el avatar guardado.
  useEffect(() => {
    setAvatarId(readAvatarId(user?.id));
  }, [user?.id]);

  const chooseAvatar = (id) => {
    const next = id || "";
    setAvatarId(next);
    saveAvatarId(user?.id, next);
  };

  const handlePaisChange = async (newPais) => {
    if (!token || !user?.id || newPais === perfil?.pais) return;
    setSavingPais(true);
    setPaisErr("");
    try {
      await updatePerfil(token, user.id, { pais: newPais });
      // Forma funcional: evita pisar con una copia vieja el saldo que la
      // relectura automática del perfil pueda haber traído mientras guardaba.
      setPerfil((prev) => ({ ...(prev || perfil || {}), pais: newPais }));
    } catch (e) {
      setPaisErr(e.message || t("perfil.err.pais"));
    } finally {
      setSavingPais(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr("");
    try {
      await deleteAccount();
      // La sesión se limpia en el store; redirige al login (raíz de la app)
      navigate("/", { replace: true });
      window.location.reload();
    } catch (e) {
      setDeleteErr(e.message || t("perfil.err.delete"));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 px-4 pb-4">
      <header className="pt-1">
        <h2 className="font-display text-xl font-bold text-foreground">{t("tabs.perfil.title")}</h2>
      </header>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="relative shrink-0">
          <FunAvatar email={user?.email} avatarId={avatarId} />
          <button
            onClick={() => setAvatarOpen(true)}
            aria-label={t("perfil.avatar.cambiar")}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-orange-500/60 bg-orange-500 text-orange-950 shadow-lg shadow-black/40 transition hover:bg-orange-400"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{user?.email}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-sm leading-none">{getCountryFlag(perfil?.pais)}</span>
            {perfil?.pais && perfil.pais !== "Latam" ? perfil.pais : "Latam"}
          </p>
          <button
            onClick={() => setAvatarOpen(true)}
            className="mt-1 text-[11px] font-semibold text-orange-400 transition hover:text-orange-300"
          >
            {t("perfil.avatar.cambiar")}
          </button>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1 rounded-lg bg-violet-500/15 px-2 py-1 text-[11px] font-medium text-violet-400">
            <Shield className="h-3 w-3" /> Admin
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Row icon={Mail} label={t("perfil.email")} value={user?.email} />
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="mb-2 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t("perfil.pais")}</span>
          </div>
          <LatamCountryPicker
            value={perfil?.pais}
            onChange={handlePaisChange}
            disabled={savingPais}
          />
          {paisErr && (
            <p className="mt-2 text-xs text-rose-400">{paisErr}</p>
          )}
          {perfil?.pais === "Latam" && !paisErr && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("perfil.pais.hint")}
            </p>
          )}
        </div>
        <Row icon={Coins} label={t("perfil.saldoDisponible")} value={`${perfil?.saldo_disponible ?? 0} Pts`} />
        <Row icon={Clock} label={t("perfil.saldoPendiente")} value={`${perfil?.saldo_pendiente ?? 0} Pts`} />
        <Row icon={Hash} label={t("perfil.codigo")} value={perfil?.codigo_referido || "—"} />
      </div>

      <AvatarPicker
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        value={avatarId}
        onSelect={chooseAvatar}
        email={user?.email}
      />

      <WhatsappChannelCard />

      <AvisosReversos />

      <SoportePanel />

      {/* Eliminar cuenta — validación explícita antes de borrar */}
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-transparent py-2.5 text-xs font-medium text-red-500/70 transition hover:border-red-500/40 hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" /> {t("perfil.eliminar")}
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!deleting) setConfirmOpen(o); }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" /> {t("perfil.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                {t("perfil.delete.p1a")} <span className="font-semibold text-foreground">{t("perfil.delete.p1b")}</span>{t("perfil.delete.p1c")}
              </p>
              <p>{t("perfil.delete.p2")}</p>
              {deleteErr && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{deleteErr}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("perfil.cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("perfil.eliminando")}
                </span>
              ) : (
                t("perfil.delete.confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto max-w-[60%] truncate text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}