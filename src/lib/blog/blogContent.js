// ============================================================
//  Blog LatamBucks — contenido editorial.
//  Fuente de verdad del repo (GitHub). La tabla blog_articulos de Supabase
//  guarda la misma información y, si tiene filas, sus textos tienen
//  prioridad (ver mergeArticles). Las imágenes viven en src/assets/blog,
//  así que el blog funciona sin depender de Base44 ni de CDNs externos.
// ============================================================

import radiografiaImg from "@/assets/blog/radiografia.png";
import ganarAlMesImg from "@/assets/blog/ganar-al-mes.png";
import rutinaDiariaImg from "@/assets/blog/rutina-diaria.png";
import retirosImg from "@/assets/blog/retiros.png";
// Las traducciones viven en archivos aparte (blogContentEn / blogContentPt).
// Se cargan con glob para que el build no dependa de un nombre exacto de
// archivo: si uno falta, el blog sigue funcionando en español.
const ARCHIVOS_IDIOMA = import.meta.glob("./blogContent[EP]*.js", { eager: true });
const articulosDe = (clave) => {
  for (const mod of Object.values(ARCHIVOS_IDIOMA)) {
    if (Array.isArray(mod[clave])) return mod[clave];
  }
  return [];
};
const BLOG_ARTICLES_EN = articulosDe("BLOG_ARTICLES_EN");
const BLOG_ARTICLES_PT = articulosDe("BLOG_ARTICLES_PT");

export const BLOG_ARTICLES = [
  {
    slug: "radiografia-usuarios-latambucks",
    titulo: "Radiografía LatamBucks: quién gana puntos, desde dónde y a qué hora",
    extracto:
      "Los patrones reales de actividad de la comunidad: qué días hay más encuestas, a qué hora conviene entrar y por qué el hábito diario pesa más que las horas sueltas.",
    etiquetas: ["Estadísticas", "Comunidad", "Estrategia"],
    fecha: "2026-11-04",
    minutos: 6,
    autor: "Equipo LatamBucks",
    imagen: radiografiaImg,
    imagenAlt: "Panel con gráficos y monedas apiladas sobre fondo oscuro",
    metaTitulo: "Estadísticas LatamBucks: quién gana puntos y a qué hora",
    metaDescripcion:
      "Datos agregados de la comunidad LatamBucks: el 82% de las sesiones son desde el celular, la franja de 19 a 23 concentra las encuestas y el hábito diario rinde más que las maratones.",
    contenido: `
<p class="lb-lead">Cada semana miles de personas abren LatamBucks con la misma pregunta: ¿esto realmente sirve para sumar puntos? Después de un año observando la actividad de la comunidad aparecen patrones que se repiten con una claridad llamativa. No son promesas de marketing: son comportamientos agrupados de la plataforma, sin datos personales.</p>

<h2>Cómo leemos estos números</h2>
<p>Trabajamos con totales y promedios: cantidad de sesiones, franjas horarias, días de la semana y proporciones sobre el conjunto. Nunca miramos la actividad de una cuenta puntual para escribir una nota. Cuando decimos "ocho de cada diez sesiones", hablamos de proporciones de la comunidad, no de una persona en particular.</p>

<h2>1. El celular es la puerta de entrada</h2>
<p>Cerca del 82% de las sesiones llegan desde un teléfono. Tiene sentido: LatamBucks se usa en ratos muertos, en el colectivo, en la fila del banco, en los diez minutos antes de dormir. La consecuencia práctica es directa: quien espera tener una computadora y una hora libre para "trabajar" completa menos encuestas que quien resuelve dos o tres desde el celular mientras espera el café.</p>

<h2>2. La hora dorada: de 19 a 23</h2>
<p>La franja nocturna concentra el mayor volumen de encuestas completadas y también la mayor cantidad de estudios nuevos. Entre las 19 y las 23 los paneles de investigación publican más campañas, porque buscan respuestas de gente con tiempo y sin apuro. Si podés elegir cuándo entrar, esa es la ventana.</p>
<p>Hay un segundo pico más chico, entre las 12 y las 14, ideal para tareas cortas: videos, instalación de apps y microencuestas de dos o tres preguntas.</p>

<h2>3. Lunes y martes: más estudios disponibles</h2>
<p>El calendario de los anunciantes arranca la semana. Los lunes y martes suelen tener más encuestas nuevas y menos competencia por los cupos que el fin de semana, cuando la comunidad activa se duplica y los estudios se llenan rápido.</p>

<h2>4. El hábito pesa más que las horas</h2>
<p>Este es el dato que más nos sorprendió. Las cuentas que entran al menos cinco días por semana, aunque sea siete minutos, acumulan puntos a un ritmo notablemente mayor que quienes hacen una sesión larga los domingos. La razón es de diseño: el bonus diario, la racha del check-in y los objetivos semanales premian la frecuencia, no la resistencia física.</p>
<ul>
<li>La mayoría de las sesiones dura menos de 10 minutos.</li>
<li>Quien sostiene el check-in diario termina retirando más veces al año.</li>
<li>Los objetivos semanales se completan por repetición, casi nunca por maratón.</li>
</ul>

<h2>5. De dónde nos visitan</h2>
<p>La comunidad se reparte sobre todo entre Argentina, México, Colombia, Perú, Venezuela y Chile, con crecimiento en Ecuador, Bolivia y Centroamérica. Esto explica algo importante: la oferta de encuestas cambia según el país, porque los estudios buscan perfiles locales. Si un día tu pestaña está floja, probablemente no sea tu cuenta: es el mercado de tu región esa semana.</p>

<div class="lb-callout"><strong>Qué hacer con estos datos</strong><p>Entrá todos los días aunque sean cinco minutos. Dejá las encuestas largas para la noche. Revisá lunes y martes. Y no subestimes el bonus diario: es la parte más rentable de la app y la que casi nadie aprovecha al cien por ciento.</p></div>

<h2>Una aclaración honesta</h2>
<p>Los patrones ayudan, pero no son una fórmula mágica. LatamBucks paga por tareas reales completadas —encuestas, apps, videos y ofertas de nuestros socios—, así que entender el ritmo de la plataforma te hace más eficiente, no te garantiza un ingreso fijo. Con esa expectativa clara, los números se vuelven mucho más amables.</p>
`,
  },
  {
    slug: "cuanto-se-puede-ganar-al-mes",
    titulo: "¿Cuánto se puede ganar al mes en LatamBucks? Tres perfiles, números honestos",
    extracto:
      "Sin sueldos soñados: tres ritmos de uso reales con puntos estimados, su equivalente en dólares y cuánto tarda cada perfil en llegar a su primer retiro.",
    etiquetas: ["Ingresos", "Encuestas", "Principiantes"],
    fecha: "2026-11-06",
    minutos: 7,
    autor: "Equipo LatamBucks",
    imagen: ganarAlMesImg,
    imagenAlt: "Persona usando el celular de noche en una mesa con una libreta",
    metaTitulo: "Cuánto se gana por mes en LatamBucks: tres perfiles con números",
    metaDescripcion:
      "De 10 minutos al día a dos horas con referidos: cuántos puntos se juntan por mes en LatamBucks, a cuánto equivalen en dólares y cuándo llega el primer retiro.",
    contenido: `
<p class="lb-lead">La pregunta más repetida en los comentarios y en el canal de WhatsApp es también la más difícil de responder sin caer en promesas vacías: ¿cuánto se junta por mes? Acá no hay sueldos soñados. Hay tres ritmos de uso reales, con puntos estimados, su equivalente en dólares y el tiempo que tarda cada perfil en llegar a su primer retiro.</p>

<h2>Las dos reglas que ordenan todo</h2>
<p>Primera: en LatamBucks <strong>1.000 puntos equivalen a 1 dólar</strong>. Segunda: el retiro mínimo depende de tu país y del método: <strong>3.000 puntos</strong> (3 dólares) por Binance USDT en la mayoría de los países y <strong>5.000 puntos</strong> (5 dólares) por PayPal o si estás en Estados Unidos, Canadá o Europa. Todo lo demás sale de esas cifras y de cuántas tareas reales completes.</p>

<h2>Perfil 1 — El curioso: 10 minutos al día</h2>
<p>Entra tres o cuatro veces por semana, hace una encuesta corta, mira un video y cobra el bonus diario cuando se acuerda. Cierra el mes con algo así como <strong>600 a 1.200 puntos</strong>, o sea entre 0,60 y 1,20 dólares.</p>
<p>¿Sirve? Sí, para entender cómo funciona la plataforma sin invertir tiempo. No alcanza para retirar: a este ritmo el primer pago llega en varios meses. Es el perfil que se aburre antes de ver resultados, y casi siempre el problema es la frecuencia, no la app.</p>

<h2>Perfil 2 — El constante: 40 a 60 minutos al día</h2>
<p>Entra casi todos los días, cobra el check-in, completa dos o tres encuestas en la franja nocturna y suma alguna oferta de fin de semana. Este perfil suele cerrar el mes entre <strong>6.000 y 10.000 puntos</strong>: 6 a 10 dólares.</p>
<p>Con ese ritmo, el primer retiro llega en tres o cuatro semanas y después se repite cada dos o tres. No es dinero para vivir, es un ingreso de bolsillo razonable: la carga del transporte, un delivery, una recarga de saldo.</p>

<h2>Perfil 3 — El intensivo con referidos: 2 horas y una red</h2>
<p>Le dedica una hora y media o dos por día, tiene el perfil de encuestas completo y, sobre todo, invita gente. Acá aparecen <strong>15.000 a 25.000 puntos</strong> al mes (15 a 25 dólares), con mucha más variación que en los otros perfiles: dependen de lo que pague cada campaña y de cuánto avance su red.</p>
<p>Ojo con lo obvio: dos horas diarias son 60 horas al mes. Ese tiempo vale mucho más en un trabajo formal. LatamBucks funciona como complemento de ratos libres, no como reemplazo de un sueldo.</p>

<h2>Qué mueve la aguja de verdad</h2>
<ul>
<li><strong>Frecuencia antes que duración:</strong> cinco días de diez minutos rinden más que un domingo de dos horas.</li>
<li><strong>Perfil de encuestas completo:</strong> cuando el panel conoce tus datos te envía estudios mejor pagos y te descarta menos a mitad de camino.</li>
<li><strong>Encuestas sin abandonar:</strong> dejar una encuesta por la mitad molesta al proveedor y te resta acceso a las mejores campañas.</li>
<li><strong>Referidos activos:</strong> suman un porcentaje de lo que ganan tus invitados cada mes, sin que tengas que repetir la tarea.</li>
</ul>

<h2>Lo que no cambia por más horas que le pongas</h2>
<p>El país. La oferta de encuestas depende del mercado local de cada panel y eso no se arregla con constancia. Si tu región está floja esa semana, el muro de ofertas y las encuestas flash son la mejor alternativa. Usar VPN para "cambiar de país" es el camino más rápido a un bloqueo y a perder los puntos acumulados: no lo hagas.</p>

<div class="lb-callout"><strong>Resumen en una línea</strong><p>Diez minutos diarios sirven para probar. Cuarenta minutos diarios, con hábito y paciencia, convierten a LatamBucks en un ingreso de bolsillo real cada pocas semanas.</p></div>
`,
  },
  {
    slug: "rutina-diaria-cinco-minutos",
    titulo: "Cinco minutos al día: la rutina que convierte constancia en retiros",
    extracto:
      "El plan exacto que usan las cuentas que más retiran: qué hacer al abrir la app, en qué orden y qué evitar para no perder puntos por apuro.",
    etiquetas: ["Rutina", "Productividad", "Estrategia"],
    fecha: "2026-11-08",
    minutos: 5,
    autor: "Equipo LatamBucks",
    imagen: rutinaDiariaImg,
    imagenAlt: "Manos sosteniendo un celular sobre una mesa de cocina por la mañana",
    metaTitulo: "Rutina de 5 minutos al día para ganar puntos en LatamBucks",
    metaDescripcion:
      "Check-in, encuesta corta, una oferta nueva y cierre: la rutina de cinco minutos que usan las cuentas de LatamBucks que retiran más seguido.",
    contenido: `
<p class="lb-lead">Las cuentas que más retiran no son las que más horas pasan: son las que repiten un mismo ritual corto todos los días. Esta es la rutina de cinco minutos que usan los usuarios constantes, en orden y sin pasos de más.</p>

<h2>Minuto 0 — Cobrá el check-in antes de mirar otra cosa</h2>
<p>El bonus diario es lo primero que hay que cobrar al abrir la app. Es gratis, no compite con nada y su valor sube con la racha. Si sos de los que entran directo a las encuestas, estás dejando sobre la mesa la parte más rentable del sistema.</p>

<h2>Minuto 1 — Revisá saldo, avisos y reversos</h2>
<p>Un vistazo rápido al saldo y a la campana de avisos evita la confusión más común: "me faltan puntos". Casi siempre hay un ajuste de un proveedor o un retiro en proceso que el usuario no recordaba. Verlo a diario es mejor que descubrirlo el día del pago.</p>

<h2>Minuto 2 — Una encuesta corta, siempre completa</h2>
<p>Empezá por la encuesta más breve disponible. Terminarla entera vale más que arrancar tres: los paneles registran los abandonos y con el tiempo te ofrecen menos estudios. Si una encuesta es larguísima y no tenés diez minutos, no la abras todavía: dejála para la noche.</p>

<h2>Minuto 3 — Una tarea de treinta segundos</h2>
<p>El muro de ofertas es para los huecos: abrir una app, ver un video de quince segundos, responder dos preguntas. No pagan fortunas, pero sostienen el promedio diario y evitan los días en cero, que son los que rompen la racha.</p>

<h2>Minuto 4 — Cerrá con una oferta nueva</h2>
<p>Antes de salir, mirá las ofertas destacadas. Las campañas recién publicadas tienen más cupo, se aprueban más rápido y no están saturadas. Cinco segundos de scrolling pueden valer más que diez minutos buscando en la lista completa.</p>

<h2>El domingo: diez minutos de estrategia</h2>
<ul>
<li>Revisá el historial para saber qué proveedor te está pagando mejor.</li>
<li>Fijate cuántos puntos te faltan para el retiro y dividí entre los días que quedan.</li>
<li>Si tenés referidos, verificá que hayan activado su cuenta: un invitado inactivo no suma nada.</li>
<li>Dejá el saldo listo antes del corte semanal, no diez minutos antes.</li>
</ul>

<h2>Los cuatro errores que arruinan una buena racha</h2>
<p><strong>Abandonar encuestas a la mitad.</strong> El panel lo registra y te clasifica como respuesta de baja calidad.</p>
<p><strong>Instalar y desinstalar apps en segundos.</strong> Muchos anunciantes verifican que la app siga instalada; si la borrás, la tarea se revierte.</p>
<p><strong>Abrir dos cuentas o usar VPN.</strong> Es el camino directo al bloqueo y a la pérdida de todo lo acumulado.</p>
<p><strong>Jugar el multiplicador con lo que necesitás para retirar.</strong> La ruleta es un extra con riesgo: usá solo puntos que estés dispuesto a perder. No es una estrategia de ahorro.</p>

<div class="lb-callout"><strong>La regla de oro</strong><p>Cinco minutos, todos los días, en el mismo horario. La constancia le gana al entusiasmo de una tarde libre.</p></div>
`,
  },
  {
    slug: "de-puntos-a-dinero-retiros",
    titulo: "De puntos a dinero: tarjetas fijas, mínimos por país y cuándo se paga",
    extracto:
      "Elegís una tarjeta fija de PayPal o de Binance USDT, con mínimos según tu país y pago los viernes. Montos, datos que necesitás y por qué se frena un canje.",
    etiquetas: ["Retiros", "Pagos", "Seguridad"],
    fecha: "2026-11-13",
    minutos: 6,
    autor: "Equipo LatamBucks",
    imagen: retirosImg,
    imagenAlt: "Mano sosteniendo una tarjeta junto a un celular sobre un escritorio oscuro",
    metaTitulo: "Cómo canjear tus puntos en LatamBucks: tarjetas de PayPal y Binance",
    metaDescripcion:
      "Métodos, montos y mínimos de retiro en LatamBucks: tarjetas fijas de PayPal desde 5 USD y de Binance USDT desde 3 USD, corte los jueves y pago los viernes.",
    contenido: `
<p class="lb-lead">El sistema de retiros cambió. Ya no se pide un monto libre y Payoneer y Airtm quedaron atrás: ahora elegís una <strong>tarjeta fija</strong>, indicás a qué cuenta de PayPal o Binance querés cobrar y el pedido queda pendiente hasta el pago del viernes. Esta guía explica montos, mínimos por país y qué frena un canje.</p>

<h2>Cómo funciona el canje hoy</h2>
<p>En Retiros ves tu saldo disponible y una grilla de tarjetas. Elegís método y monto, confirmás los datos de cobro y el pedido se registra en el historial como <strong>pendiente</strong>. Cuando se paga pasa a <strong>procesado</strong>; si no se puede pagar queda <strong>rechazado</strong> y el saldo vuelve a tu cuenta.</p>
<p>La conversión no cambió: <strong>1.000 puntos = 1 dólar</strong>. Lo que cambió es que el monto lo define la tarjeta y no un formulario abierto.</p>

<h2>PayPal: tarjetas de 5 a 100 dólares</h2>
<ul>
<li>Montos: <strong>5, 10, 20, 25, 50 y 100 USD</strong>.</li>
<li>Necesitás el <strong>correo de tu cuenta PayPal</strong> y el <strong>nombre del titular</strong>, igual que figura en PayPal.</li>
<li>PayPal puede aplicar su propia comisión al recibir: lo que te llega puede ser algo menos que el monto de la tarjeta.</li>
</ul>

<h2>Binance USDT: desde 3 dólares</h2>
<ul>
<li>Montos: <strong>3, 5, 10, 20, 50 y 100 USD</strong>, acreditados en USDT.</li>
<li>Necesitás tu <strong>Binance ID (UID)</strong> o el correo vinculado a la cuenta.</li>
<li>El pago llega a tu billetera de Binance: no pasa por un correo ni por un banco.</li>
</ul>

<h2>Mínimos según tu país</h2>
<p>El mínimo depende del país que la plataforma detectó en tu cuenta y del método elegido:</p>
<ul>
<li><strong>Estados Unidos, Canadá, Reino Unido, Alemania, Australia, Francia, Italia, Países Bajos, Suecia, Suiza, Noruega y Dinamarca:</strong> <strong>5.000 puntos</strong> (5 USD).</li>
<li><strong>Resto de los países:</strong> <strong>3.000 puntos</strong> (3 USD) por Binance USDT y <strong>5.000 puntos</strong> por PayPal.</li>
</ul>
<p>El mínimo vigente aparece siempre escrito arriba de las tarjetas. Si tu saldo no alcanza, la tarjeta se ve atenuada y te indica cuántos puntos faltan.</p>

<h2>Cuándo se paga</h2>
<p>Los pedidos hechos <strong>antes del jueves a las 16:00 (hora de Argentina)</strong> se pagan el <strong>viernes</strong>. Un canje pedido un sábado no se pierde: entra al corte siguiente. Mientras espera, figura como pendiente en el historial.</p>

<h2>El bono de bienvenida tiene tope</h2>
<p>Del bono de bienvenida podés usar hasta <strong>500 puntos</strong> en un retiro. El resto tiene que venir de encuestas, ofertas o la ruleta. Si tu saldo está armado casi entero con bono, el sistema te pide ganar esa diferencia antes de canjear.</p>

<h2>Los cuatro motivos que frenan un retiro</h2>
<ul>
<li><strong>Datos que no coinciden.</strong> En PayPal el nombre del titular tiene que ser el de la cuenta: un apellido mal escrito hace que el pago se rechace.</li>
<li><strong>País que no coincide.</strong> Si el país detectado en tu conexión no es el de tu perfil, el retiro se bloquea hasta que escribas a soporte. Por eso las VPN juegan en contra.</li>
<li><strong>Reversos de proveedores.</strong> Si una encuesta u oferta se invalida después de acreditarse, el sistema descuenta esos puntos. Si ya los habías canjeado, el ajuste se aplica al saldo siguiente.</li>
<li><strong>Revisión de seguridad o cuenta bloqueada.</strong> Cuentas nuevas con canjes altos o accesos desde varias ubicaciones pasan por revisión manual, y una cuenta bloqueada no puede canjear hasta que soporte la revise.</li>
</ul>

<h2>Pagos retenidos: el interruptor que frena todo</h2>
<p>En Retiros existe la opción de <strong>retener pagos</strong>. Sirve si preferís acumular, pero mientras esté activa el canje se rechaza con un aviso. Si no recordás haberla activado, revisala antes de escribir a soporte.</p>

<h2>Cómo pedir el retiro, paso a paso</h2>
<ul>
<li>Entrá a la pestaña Retiros y mirá tu saldo y el mínimo de tu país.</li>
<li>Elegí PayPal o Binance USDT y tocá la tarjeta del monto.</li>
<li>Completá los datos de cobro: correo y titular en PayPal, UID o correo en Binance.</li>
<li>Confirmá el canje. El monto se descuenta y el pedido aparece como pendiente.</li>
<li>Cargá los datos en tu billetera antes del jueves 16:00 para entrar en el pago del viernes.</li>
</ul>

<h2>Si el pago demora o vuelve rechazado</h2>
<p>Revisá el estado en el historial: pendiente significa que está en la fila del pago; rechazado indica que no pudo procesarse y el saldo ya volvió a tu cuenta. Si figura como procesado y no lo ves, revisá el correo asociado a la billetera antes de escribir. Para pedir ayuda, mandá un solo mensaje con tu correo de cuenta, el monto y la fecha del canje: los tickets duplicados hacen más lento el proceso.</p>

<div class="lb-callout"><strong>Antes de canjear</strong><p>Método correcto, una tarjeta que exista y datos exactos de la cuenta. Casi todos los retiros detenidos empiezan con un dato mal cargado.</p></div>
`,
  },
];

// Idioma del blog = idioma elegido en el sitio. El español es la fuente de
// verdad; inglés y portugués viven en sus propios archivos con los mismos slugs.
const POR_IDIOMA = { es: BLOG_ARTICLES, en: BLOG_ARTICLES_EN, pt: BLOG_ARTICLES_PT };
const LOCALE_FECHA = { es: "es-AR", en: "en-US", pt: "pt-BR" };

export function getBlogArticles(lang = "es") {
  const base = BLOG_ARTICLES;
  const lista = POR_IDIOMA[lang] || base;
  // Las imágenes son locales y las aporta el archivo en español.
  const imagenes = new Map(base.map((a) => [a.slug, a]));
  return lista.map((art) => {
    const es = imagenes.get(art.slug);
    return {
      ...art,
      imagen: es?.imagen,
      imagenAlt: art.imagenAlt || es?.imagenAlt,
    };
  });
}

// Da formato legible a la fecha ISO del artículo ("4 de noviembre de 2026").
export function formatFecha(iso, lang = "es") {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(LOCALE_FECHA[lang] || LOCALE_FECHA.es, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Si Supabase devuelve filas, sus textos mandan; si una columna viene vacía se
// conserva el contenido del repo. Las imágenes siempre son las locales.
export function mergeArticles(locales, filas) {
  const porSlug = new Map((filas || []).map((f) => [f.slug, f]));
  return locales.map((art) => {
    const fila = porSlug.get(art.slug);
    if (!fila) return art;
    return {
      ...art,
      titulo: fila.titulo || art.titulo,
      extracto: fila.extracto || art.extracto,
      contenido: fila.contenido || art.contenido,
      etiquetas: Array.isArray(fila.etiquetas) && fila.etiquetas.length ? fila.etiquetas : art.etiquetas,
      autor: fila.autor || art.autor,
      minutos: fila.minutos_lectura || art.minutos,
    };
  });
}
