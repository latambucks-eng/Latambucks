import React from "react";
import surveys from "@/assets/icons3d/surveys.png";
import wheel from "@/assets/icons3d/wheel.png";
import referrals from "@/assets/icons3d/referrals.png";
import gift from "@/assets/icons3d/gift.png";
import apps from "@/assets/icons3d/apps.png";
import flame from "@/assets/icons3d/flame.png";
import trending from "@/assets/icons3d/trending.png";
import lock from "@/assets/icons3d/lock.png";
import history from "@/assets/icons3d/history.png";
import megaphone from "@/assets/icons3d/megaphone.png";
import shield from "@/assets/icons3d/shield.png";
import bell from "@/assets/icons3d/bell.png";
import trophy from "@/assets/icons3d/trophy.png";
import support from "@/assets/icons3d/support.png";
import wallet from "@/assets/icons3d/wallet.png";
import sparkle from "@/assets/icons3d/sparkle.png";
import coins from "@/assets/icons3d/coins.png";
import home from "@/assets/icons3d/home.png";
import user from "@/assets/icons3d/user.png";

// Set de iconos 3D empaquetado localmente (sin CDNs ni Base44): el build es
// 100% portable. Un mismo nombre se reutiliza en todas las pestañas.
export const ICON3D = {
  surveys,
  wheel,
  referrals,
  gift,
  apps,
  flame,
  trending,
  lock,
  history,
  megaphone,
  shield,
  bell,
  trophy,
  support,
  wallet,
  sparkle,
  coins,
  home,
  user,
};

export default function Icon3D({ name, className = "h-8 w-8", alt = "" }) {
  const src = ICON3D[name];
  if (!src) return null;
  return <img src={src} alt={alt} className={`shrink-0 rounded-lg ${className}`} />;
}