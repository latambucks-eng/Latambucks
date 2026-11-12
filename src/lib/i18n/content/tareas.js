// Textos de la pestaña Microtareas (títulos de sección + muro de TimeWall).
// Mismo patrón que guia.js / soporte.js: cada idioma es un objeto y el
// componente elige por `lang`; si falta un idioma, cae a español.

export const TAREAS = {
  es: {
    proveedores: {
      title: "Microtareas de proveedores externos",
      sub: "Del muro de TimeWall. Se acreditan solas al completarlas.",
    },
    latambucks: {
      title: "Microtareas de LatamBucks",
      sub: "De anunciantes de la plataforma. Subís la captura y se acreditan al aprobarla.",
    },
    timewall: {
      sub: "Completá las tareas del muro y los puntos se acreditan en tu saldo",
      open: "Abrir",
      loading: "Cargando el muro de TimeWall…",
      signin: "Iniciá sesión para cargar el muro de TimeWall.",
      frameTitle: "TimeWall — muro de ofertas",
      notice:
        "Los puntos se acreditan automáticamente al completar cada tarea. Si el muro no carga en la app, usá el botón Abrir para verlo en una pestaña nueva.",
    },
  },
  en: {
    proveedores: {
      title: "Microtasks from external providers",
      sub: "From the TimeWall wall. Points are credited automatically when you finish them.",
    },
    latambucks: {
      title: "LatamBucks microtasks",
      sub: "From advertisers on the platform. Upload your screenshot and points are credited once approved.",
    },
    timewall: {
      sub: "Complete tasks on the wall and the points land in your balance",
      open: "Open",
      loading: "Loading the TimeWall wall…",
      signin: "Sign in to load the TimeWall wall.",
      frameTitle: "TimeWall — offer wall",
      notice:
        "Points are credited automatically when you complete each task. If the wall doesn't load in the app, use the Open button to view it in a new tab.",
    },
  },
  pt: {
    proveedores: {
      title: "Microtarefas de provedores externos",
      sub: "Do mural do TimeWall. São creditadas automaticamente ao concluí-las.",
    },
    latambucks: {
      title: "Microtarefas do LatamBucks",
      sub: "De anunciantes da plataforma. Envie o print e os pontos são creditados após a aprovação.",
    },
    timewall: {
      sub: "Complete as tarefas do mural e os pontos entram no seu saldo",
      open: "Abrir",
      loading: "Carregando o mural do TimeWall…",
      signin: "Entre na sua conta para carregar o mural do TimeWall.",
      frameTitle: "TimeWall — mural de ofertas",
      notice:
        "Os pontos são creditados automaticamente ao concluir cada tarefa. Se o mural não carregar no app, use o botão Abrir para vê-lo em uma nova aba.",
    },
  },
};

export function tareasText(lang) {
  return TAREAS[lang] || TAREAS.es;
}