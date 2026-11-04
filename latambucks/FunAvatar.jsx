import React, { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { getAvatar } from "@/lib/avatars";
import { funAvatarImage } from "@/lib/localAssets";

// Avatar del perfil con el mismo formato exacto que el panda: ficha
// redondeada, fondo de color pleno y la ilustración 3D ocupando la ficha,
// con la inicial del email como insignia en la esquina.
// Si la ilustración no llegara a cargar, se muestra el emoji de respaldo
// sobre el mismo fondo, así la ficha nunca queda vacía.

const PANDA_URL = funAvatarImage;

// Pila de fuentes de emoji: solo se usa como respaldo del emoji.
const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", sans-serif';

const SIZES = {
  sm: { tile: "h-12 w-12", emoji: "1.4rem", badge: "h-4 w-4 text-[9px]" },
  md: { tile: "h-14 w-14", emoji: "1.6rem", badge: "h-5 w-5 text-[10px]" },
  lg: { tile: "h-20 w-20", emoji: "2.2rem", badge: "h-6 w-6 text-[11px]" },
};

export default function FunAvatar({
  email,
  avatarId,
  size = "md",
  className,
  showLetter = true,
}) {
  const letter = (email || "?")[0].toUpperCase();
  const avatar = getAvatar(avatarId);
  const dims = SIZES[size] || SIZES.md;
  const [imgFailed, setImgFailed] = useState(false);

  // Al cambiar de avatar se reintenta la ilustración del nuevo.
  useEffect(() => {
    setImgFailed(false);
  }, [avatarId]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-lg shadow-black/40 ${
        className || dims.tile
      }`}
    >
      {avatar ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundImage: avatar.bg }}
        >
          {imgFailed ? (
            <span
              aria-hidden="true"
              className="select-none"
              style={{ fontFamily: EMOJI_FONT, fontSize: dims.emoji, lineHeight: 1 }}
            >
              {avatar.emoji}
            </span>
          ) : (
            <img
              src={avatar.img}
              alt={avatar.label}
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-contain p-[8%]"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
            />
          )}
        </div>
      ) : (
        <Image
          src={PANDA_URL}
          alt=""
          aria-hidden="true"
          fittingType="fill"
          className="h-full w-full"
        />
      )}

      {/* Brillo superior: el mismo acabado de calcomanía del panda. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 70% at 30% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 62%)",
        }}
      />

      {showLetter && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0.5 right-0.5 flex items-center justify-center rounded-full bg-black/75 font-display font-bold text-white ring-1 ring-white/40 backdrop-blur-sm ${dims.badge}`}
        >
          {letter}
        </span>
      )}
    </div>
  );
}