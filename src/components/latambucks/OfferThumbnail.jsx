import React, { useEffect, useState } from "react";
import {
  Mail,
  Smartphone,
  Download,
  ClipboardList,
  Gamepad2,
  Play,
  Heart,
  DollarSign,
  ShoppingBag,
  Car,
  Utensils,
  GraduationCap,
  Plane,
  Home,
  Gift,
  Sparkles,
  Trophy,
  FileText,
  Music,
  Camera,
  Briefcase,
  Clover,
  Dices,
  Bitcoin,
  CreditCard,
  ShieldCheck,
  Tv,
  Ticket,
  KeyRound,
  Dumbbell,
  Coins,
  Shirt,
  PawPrint,
  Wrench,
  Calculator,
  Percent,
  Baby,
  Cpu,
} from "lucide-react";

// Imagen de cada oferta de CPAGrip.
// Se muestra la imagen real que entrega el feed (`offerphoto`). Si esa oferta
// no trae imagen o el archivo no carga, se usa un bloque de color con un ícono
// acorde al contenido de la oferta (WPS, goles, suerte, cripto, etc.), elegido
// por palabras clave del título y, en su defecto, por la categoría.
// Es puramente visual: no altera links, puntos ni estructura de la tarjeta.

// Reglas por título — se evalúan en orden, gana la primera coincidencia.
const TITLE_RULES = [
  { re: /wps|office|word|excel|powerpoint|pdf|document|office suite/i, Icon: FileText, gradient: "from-sky-500 to-blue-700" },
  { re: /antivirus|seguridad|security|vpn|protege|protect/i, Icon: ShieldCheck, gradient: "from-emerald-500 to-teal-700" },
  { re: /windows|pc|escritorio|desktop|laptop|computador/i, Icon: Cpu, gradient: "from-slate-500 to-slate-800" },
  { re: /gol|fútbol|futbol|soccer|football|penal|messi/i, Icon: Trophy, gradient: "from-lime-500 to-emerald-700" },
  { re: /apuesta|apostar|bet|betting|casino|slot|tragamoneda|ruleta/i, Icon: Dices, gradient: "from-fuchsia-500 to-purple-700" },
  { re: /suerte|loteria|lotería|lottery|sorteo|sweep|gana|premio|rifa/i, Icon: Clover, gradient: "from-emerald-500 to-green-700" },
  { re: /ejercicio|fitness|gym|entrena|workout|pesas/i, Icon: Dumbbell, gradient: "from-orange-500 to-red-700" },
  { re: /cripto|crypto|bitcoin|btc|ethereum|blockchain|binance/i, Icon: Bitcoin, gradient: "from-amber-500 to-orange-700" },
  { re: /tarjeta|credit|crédito|credito|préstamo|prestamo|loan|banco|bank|finanz/i, Icon: CreditCard, gradient: "from-teal-500 to-cyan-700" },
  { re: /inversi|invest|trading|bolsa|forex/i, Icon: Calculator, gradient: "from-green-500 to-emerald-700" },
  { re: /dinero|cash|pago|pay|usd|dólar|dolar|saldo/i, Icon: DollarSign, gradient: "from-emerald-500 to-green-700" },
  { re: /descuento|coupon|cupón|cupon|oferta|promo|%|rebaja/i, Icon: Percent, gradient: "from-rose-500 to-pink-700" },
  { re: /moneda|monedas|coin|recompensa|reward|puntos/i, Icon: Coins, gradient: "from-yellow-500 to-amber-700" },
  { re: /game|juego|gaming|arcade|jugá|jugar|match|puzzle/i, Icon: Gamepad2, gradient: "from-violet-500 to-indigo-700" },
  { re: /app|apk|install|instal|móvil|movil|celular|android|ios/i, Icon: Smartphone, gradient: "from-violet-500 to-fuchsia-700" },
  { re: /download|descarga|instalador/i, Icon: Download, gradient: "from-cyan-500 to-blue-700" },
  { re: /stream|película|pelicula|movie|serie|netflix|tv|video|canal/i, Icon: Tv, gradient: "from-rose-500 to-pink-700" },
  { re: /música|musica|music|song|spotify|radio/i, Icon: Music, gradient: "from-purple-500 to-violet-700" },
  { re: /suscrip|membership|premium|prueba gratis|free trial/i, Icon: Ticket, gradient: "from-indigo-500 to-blue-700" },
  { re: /shop|tienda|buy|compra|product|market/i, Icon: ShoppingBag, gradient: "from-orange-500 to-red-700" },
  { re: /ropa|moda|fashion|zapatilla|calzado|vestido|shirt/i, Icon: Shirt, gradient: "from-pink-500 to-rose-700" },
  { re: /comida|food|receta|recipe|delivery|hamburgues|pizza/i, Icon: Utensils, gradient: "from-yellow-500 to-orange-700" },
  { re: /viaje|travel|vuelo|flight|hotel|turismo|vacacion/i, Icon: Plane, gradient: "from-cyan-500 to-teal-700" },
  { re: /auto|carro|coche|vehíc|vehic|moto|seguro de auto/i, Icon: Car, gradient: "from-slate-500 to-zinc-700" },
  { re: /casa|hogar|home|mueble|decoraci/i, Icon: Home, gradient: "from-lime-500 to-green-700" },
  { re: /mascota|pet|perro|gato|dog|cat/i, Icon: PawPrint, gradient: "from-amber-500 to-orange-700" },
  { re: /bebé|bebe|baby|pañal|panal/i, Icon: Baby, gradient: "from-sky-400 to-indigo-600" },
  { re: /salud|health|belleza|beauty|piel|skincare|dental|farmacia/i, Icon: Heart, gradient: "from-pink-500 to-rose-700" },
  { re: /curso|course|study|estudi|escuela|school|universi|idioma/i, Icon: GraduationCap, gradient: "from-blue-500 to-cyan-700" },
  { re: /trabajo|empleo|job|business|negocio|marketing|empresa/i, Icon: Briefcase, gradient: "from-gray-500 to-slate-700" },
  { re: /encuesta|survey|question|opinión|opinion|estudio de mercado/i, Icon: ClipboardList, gradient: "from-amber-500 to-orange-700" },
  { re: /clave|password|login|cuenta|account|acceso/i, Icon: KeyRound, gradient: "from-slate-500 to-slate-800" },
  { re: /herramienta|tool|repara|fix|mantenimiento/i, Icon: Wrench, gradient: "from-zinc-500 to-slate-700" },
  { re: /foto|photo|camera|cámara|camara|imagen|edición/i, Icon: Camera, gradient: "from-indigo-500 to-blue-700" },
  { re: /regalo|gift|bonus|bono|sorpresa|premio/i, Icon: Gift, gradient: "from-fuchsia-500 to-pink-700" },
  { re: /email|correo|zip|formulario|form/i, Icon: Mail, gradient: "from-sky-500 to-indigo-600" },
];

// Respaldo por categoría del feed (cuando el título no dice nada).
const CATEGORY_STYLES = {
  "email/zip submit": { Icon: Mail, gradient: "from-sky-500 to-indigo-600" },
  "email submit": { Icon: Mail, gradient: "from-sky-500 to-indigo-600" },
  "zip submit": { Icon: Mail, gradient: "from-sky-500 to-indigo-600" },
  "mobile - app install": { Icon: Smartphone, gradient: "from-violet-500 to-fuchsia-600" },
  "app install": { Icon: Smartphone, gradient: "from-violet-500 to-fuchsia-600" },
  downloads: { Icon: Download, gradient: "from-cyan-500 to-blue-600" },
  surveys: { Icon: ClipboardList, gradient: "from-amber-500 to-orange-600" },
  games: { Icon: Gamepad2, gradient: "from-emerald-500 to-teal-600" },
  video: { Icon: Play, gradient: "from-rose-500 to-pink-600" },
  entertainment: { Icon: Play, gradient: "from-rose-500 to-pink-600" },
  "health & beauty": { Icon: Heart, gradient: "from-pink-500 to-rose-600" },
  finance: { Icon: DollarSign, gradient: "from-green-500 to-emerald-600" },
  shopping: { Icon: ShoppingBag, gradient: "from-orange-500 to-red-600" },
  automotive: { Icon: Car, gradient: "from-slate-500 to-zinc-700" },
  food: { Icon: Utensils, gradient: "from-yellow-500 to-orange-600" },
  education: { Icon: GraduationCap, gradient: "from-blue-500 to-cyan-600" },
  travel: { Icon: Plane, gradient: "from-teal-500 to-cyan-600" },
  home: { Icon: Home, gradient: "from-lime-500 to-green-600" },
  music: { Icon: Music, gradient: "from-purple-500 to-violet-600" },
  photography: { Icon: Camera, gradient: "from-indigo-500 to-blue-600" },
  business: { Icon: Briefcase, gradient: "from-gray-500 to-slate-700" },
};

const DEFAULT_GRADIENT = "from-violet-500 to-indigo-600";

function resolveStyle(category, title) {
  const t = title || "";
  const match = TITLE_RULES.find((rule) => rule.re.test(t));
  if (match) return { Icon: match.Icon, gradient: match.gradient };

  const cat = (category || "").toLowerCase().trim();
  if (CATEGORY_STYLES[cat]) return CATEGORY_STYLES[cat];

  return { Icon: Sparkles, gradient: DEFAULT_GRADIENT };
}

// "banner" llena el ancho de la tarjeta; el resto son miniaturas cuadradas.
const SIZES = {
  sm: { box: "h-12 w-12", icon: "h-5 w-5", rounded: "rounded-xl" },
  md: { box: "h-14 w-14", icon: "h-6 w-6", rounded: "rounded-xl" },
  lg: { box: "h-16 w-16", icon: "h-7 w-7", rounded: "rounded-xl" },
  banner: { box: "aspect-[2.4/1] w-full", icon: "h-9 w-9", rounded: "rounded-none" },
};

export default function OfferThumbnail({ offer, size = "md" }) {
  const { Icon, gradient } = resolveStyle(offer?.category, offer?.title);
  const dims = SIZES[size] || SIZES.md;
  const photo = offer?.offerphoto;
  const [photoFailed, setPhotoFailed] = useState(false);

  // Otra oferta (u otra URL de imagen) reinicia el intento de carga.
  useEffect(() => {
    setPhotoFailed(false);
  }, [photo]);

  return (
    <div
      className={`relative ${dims.box} ${dims.rounded} shrink-0 overflow-hidden bg-gradient-to-br ${gradient} shadow-md ring-1 ring-white/15`}
    >
      {photo && !photoFailed ? (
        <img
          src={photo}
          alt={offer?.title || "Oferta"}
          loading="lazy"
          decoding="async"
          onError={() => setPhotoFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          {/* Respaldo: bloque de color con ícono acorde a la oferta */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`${dims.icon} text-white drop-shadow-sm`} strokeWidth={2.2} />
          </div>
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white/30 blur-[2px]" />
        </>
      )}
    </div>
  );
}