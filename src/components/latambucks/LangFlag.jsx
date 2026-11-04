import React from "react";

// Banderas dibujadas en SVG (España, Inglaterra y Brasil).
// Se dibujan en el propio componente para que se vean siempre iguales en
// cualquier dispositivo, sin depender de emojis ni de imágenes externas.

function Espana() {
  return (
    <>
      <rect width="24" height="16" fill="#C60B1E" />
      <rect y="4" width="24" height="8" fill="#FFC400" />
    </>
  );
}

function Inglaterra() {
  return (
    <>
      <rect width="24" height="16" fill="#FFFFFF" />
      <rect x="10" width="4" height="16" fill="#CE1124" />
      <rect y="6" width="24" height="4" fill="#CE1124" />
    </>
  );
}

function Brasil() {
  return (
    <>
      <rect width="24" height="16" fill="#009B3A" />
      <path d="M12 2.4 21.4 8 12 13.6 2.6 8Z" fill="#FFDF00" />
      <circle cx="12" cy="8" r="3.1" fill="#002776" />
    </>
  );
}

const FLAGS = { es: Espana, en: Inglaterra, pt: Brasil };

export default function LangFlag({ code, className = "" }) {
  const Flag = FLAGS[code] || Espana;
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <Flag />
    </svg>
  );
}