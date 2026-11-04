// Catálogo de avatares de LatamBucks.
// Cada avatar conserva el formato exacto del panda del perfil: ficha
// redondeada con fondo de color pleno y una ilustración 3D en relieve
// ocupando la ficha, más la inicial del email como insignia.
//
// Las ilustraciones son los emojis 3D de Microsoft Fluent (licencia MIT),
// descargados a src/assets/avatars y empaquetados en el build: no hay
// llamadas a ningún CDN externo. El emoji de texto se conserva solo como
// respaldo si la imagen no carga.
//
// La elección se guarda por cuenta en este dispositivo (localStorage), así el
// cambio y el borrado nunca dependen de la red ni pueden fallar a mitad de
// camino. Sin columnas nuevas en la base ni llamadas al backend.

const AVATAR_IMAGES = import.meta.glob("../assets/avatars/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const IMG_BASE = "../assets/avatars/";

// URL local de la ilustración de un avatar (por su id).
const img = (id) => AVATAR_IMAGES[`${IMG_BASE}${id}.png`];

const grad = (from, to) => `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

export const AVATAR_CATEGORIES = [
  {
    id: "animales",
    label: "Animales",
    items: [
      { id: "animal-zorro", label: "Zorro", emoji: "🦊", bg: grad("#F59E0B", "#B45309"), img: img("animal-zorro") },
      { id: "animal-koala", label: "Koala", emoji: "🐨", bg: grad("#94A3B8", "#334155"), img: img("animal-koala") },
      { id: "animal-leon", label: "León", emoji: "🦁", bg: grad("#FBBF24", "#B45309"), img: img("animal-leon") },
      { id: "animal-tigre", label: "Tigre", emoji: "🐯", bg: grad("#F97316", "#9A3412"), img: img("animal-tigre") },
      { id: "animal-rana", label: "Rana", emoji: "🐸", bg: grad("#A3E635", "#15803D"), img: img("animal-rana") },
      { id: "animal-mono", label: "Mono", emoji: "🐵", bg: grad("#D97706", "#57534E"), img: img("animal-mono") },
      { id: "animal-buho", label: "Búho", emoji: "🦉", bg: grad("#818CF8", "#312E81"), img: img("animal-buho") },
      { id: "animal-pulpo", label: "Pulpo", emoji: "🐙", bg: grad("#FB7185", "#A21CAF"), img: img("animal-pulpo") },
    ],
  },
  {
    id: "robots",
    label: "Robots",
    items: [
      { id: "robot-clasico", label: "Robot", emoji: "🤖", bg: grad("#38BDF8", "#0E7490"), img: img("robot-clasico") },
      { id: "robot-invasor", label: "Invasor", emoji: "👾", bg: grad("#8B5CF6", "#4C1D95"), img: img("robot-invasor") },
      { id: "robot-brazo", label: "Brazo", emoji: "🦾", bg: grad("#A1A1AA", "#3F3F46"), img: img("robot-brazo") },
      { id: "robot-engranaje", label: "Engranaje", emoji: "⚙️", bg: grad("#94A3B8", "#475569"), img: img("robot-engranaje") },
      { id: "robot-chip", label: "Chip", emoji: "🧠", bg: grad("#22D3EE", "#1E40AF"), img: img("robot-chip") },
      { id: "robot-energia", label: "Energía", emoji: "🔌", bg: grad("#34D399", "#0F766E"), img: img("robot-energia") },
    ],
  },
  {
    id: "aliens",
    label: "Aliens",
    items: [
      { id: "alien-verde", label: "Alien", emoji: "👽", bg: grad("#A3E635", "#166534"), img: img("alien-verde") },
      { id: "alien-ovni", label: "Ovni", emoji: "🛸", bg: grad("#67E8F9", "#1E293B"), img: img("alien-ovni") },
      { id: "alien-planeta", label: "Planeta", emoji: "🪐", bg: grad("#FBBF24", "#3730A3"), img: img("alien-planeta") },
      { id: "alien-galaxia", label: "Galaxia", emoji: "🌌", bg: grad("#6366F1", "#4C1D95"), img: img("alien-galaxia") },
      { id: "alien-satelite", label: "Satélite", emoji: "🛰️", bg: grad("#CBD5E1", "#0C4A6E"), img: img("alien-satelite") },
      { id: "alien-cometa", label: "Cometa", emoji: "☄️", bg: grad("#FB923C", "#7F1D1D"), img: img("alien-cometa") },
    ],
  },
  {
    id: "princesas",
    label: "Príncipes y princesas",
    items: [
      { id: "princesa-rosa", label: "Princesa", emoji: "👸", bg: grad("#F472B6", "#9F1239"), img: img("princesa-rosa") },
      { id: "principe-azul", label: "Príncipe", emoji: "🤴", bg: grad("#38BDF8", "#1D4ED8"), img: img("principe-azul") },
      { id: "princesa-hada", label: "Hada", emoji: "🧚", bg: grad("#E879F9", "#6B21A8"), img: img("princesa-hada") },
      { id: "principe-genio", label: "Genio", emoji: "🧞", bg: grad("#22D3EE", "#3730A3"), img: img("principe-genio") },
      { id: "princesa-lazo", label: "Lazo", emoji: "🎀", bg: grad("#FDA4AF", "#BE185D"), img: img("princesa-lazo") },
      { id: "principe-castillo", label: "Castillo", emoji: "🏰", bg: grad("#A78BFA", "#334155"), img: img("principe-castillo") },
    ],
  },
  {
    id: "reyes",
    label: "Reyes y reinas",
    items: [
      { id: "rey-corona", label: "Corona", emoji: "👑", bg: grad("#FACC15", "#A16207"), img: img("rey-corona") },
      { id: "reina-diamante", label: "Diamante", emoji: "💎", bg: grad("#67E8F9", "#0F766E"), img: img("reina-diamante") },
      { id: "rey-flor", label: "Flor de lis", emoji: "⚜️", bg: grad("#FCD34D", "#A16207"), img: img("rey-flor") },
      { id: "reina-caliz", label: "Cáliz", emoji: "🏺", bg: grad("#EAB308", "#C2410C"), img: img("reina-caliz") },
      { id: "rey-monedas", label: "Tesoro", emoji: "🪙", bg: grad("#FBBF24", "#A16207"), img: img("rey-monedas") },
      { id: "reina-vela", label: "Velas", emoji: "🕯️", bg: grad("#FDBA74", "#44403C"), img: img("reina-vela") },
    ],
  },
  {
    id: "deportes",
    label: "Deportes",
    items: [
      { id: "deporte-futbol", label: "Fútbol", emoji: "⚽", bg: grad("#34D399", "#14532D"), img: img("deporte-futbol") },
      { id: "deporte-basquet", label: "Básquet", emoji: "🏀", bg: grad("#FB923C", "#7C2D12"), img: img("deporte-basquet") },
      { id: "deporte-tenis", label: "Tenis", emoji: "🎾", bg: grad("#BEF264", "#4D7C0F"), img: img("deporte-tenis") },
      { id: "deporte-trofeo", label: "Trofeo", emoji: "🏆", bg: grad("#FACC15", "#92400E"), img: img("deporte-trofeo") },
      { id: "deporte-medalla", label: "Medalla", emoji: "🥇", bg: grad("#FCD34D", "#A16207"), img: img("deporte-medalla") },
      { id: "deporte-ciclismo", label: "Ciclismo", emoji: "🚴", bg: grad("#2DD4BF", "#155E75"), img: img("deporte-ciclismo") },
      { id: "deporte-boxeo", label: "Boxeo", emoji: "🥊", bg: grad("#F87171", "#881337"), img: img("deporte-boxeo") },
      { id: "deporte-surf", label: "Surf", emoji: "🏄", bg: grad("#38BDF8", "#1D4ED8"), img: img("deporte-surf") },
    ],
  },
  {
    id: "musica",
    label: "Música",
    items: [
      { id: "musica-guitarra", label: "Guitarra", emoji: "🎸", bg: grad("#FB7185", "#9A3412"), img: img("musica-guitarra") },
      { id: "musica-auriculares", label: "Auriculares", emoji: "🎧", bg: grad("#818CF8", "#0F172A"), img: img("musica-auriculares") },
      { id: "musica-microfono", label: "Micrófono", emoji: "🎤", bg: grad("#A78BFA", "#581C87"), img: img("musica-microfono") },
      { id: "musica-piano", label: "Piano", emoji: "🎹", bg: grad("#D4D4D8", "#3F3F46"), img: img("musica-piano") },
      { id: "musica-bateria", label: "Batería", emoji: "🥁", bg: grad("#F87171", "#7F1D1D"), img: img("musica-bateria") },
      { id: "musica-trompeta", label: "Trompeta", emoji: "🎺", bg: grad("#FBBF24", "#B45309"), img: img("musica-trompeta") },
      { id: "musica-notas", label: "Notas", emoji: "🎼", bg: grad("#E879F9", "#312E81"), img: img("musica-notas") },
    ],
  },
];

const AVATARS_BY_ID = AVATAR_CATEGORIES.reduce((acc, cat) => {
  cat.items.forEach((item) => {
    acc[item.id] = item;
  });
  return acc;
}, {});

// Devuelve el avatar elegido o null cuando no hay elección (panda original).
export function getAvatar(avatarId) {
  if (!avatarId) return null;
  return AVATARS_BY_ID[avatarId] || null;
}

const storageKey = (userId) => `lb_avatar_${userId}`;

export function readAvatarId(userId) {
  if (!userId) return "";
  try {
    const saved = localStorage.getItem(storageKey(userId));
    return getAvatar(saved) ? saved : "";
  } catch {
    return "";
  }
}

// Guarda la elección; con id vacío la borra y vuelve al panda original.
export function saveAvatarId(userId, avatarId) {
  if (!userId) return;
  try {
    if (avatarId) localStorage.setItem(storageKey(userId), avatarId);
    else localStorage.removeItem(storageKey(userId));
  } catch {
    /* almacenamiento no disponible: se conserva la elección en memoria */
  }
}