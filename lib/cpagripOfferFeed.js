// CPAGrip Offer Feed — integración client-side (JSONP).
// ------------------------------------------------------------
// Credenciales públicas (user_id + pubkey) son seguras en el cliente según
// la documentación de CPAGrip ("Necesario para la integración en el lado del
// cliente"). La clave PRIVADA NO se usa acá: nunca se expone en el cliente.
//
// El feed se pide desde el navegador (JSONP vía parámetro `callback`) para que
// CPAGrip detecte automáticamente la IP y el User-Agent reales del usuario y
// muestre ofertas adecuadas a su país y dispositivo (web/móvil). Si se pidiera
// desde un backend, la detección de móvil/pais se rompería (UA del servidor).
//
// Tracking: se pasa tracking_id = user.id de Supabase. CPAGrip lo incrusta en
// cada offerlink y lo devuelve en el postback para acreditar los puntos.

const CPAGRIP_USER_ID = "2559836";
const CPAGRIP_PUBKEY = "3931886c60a3e33413942ba8a8a00b63";
const CPAGRIP_FEED_URL = "https://www.cpagrip.com/common/offer_feed_json.php";

// Dominio de tracking personalizado para los enlaces de oferta (igual que el
// locker). Reemplaza www.cpagrip.com en offerlink para URLs más limpias.
const CPAGRIP_TRACKING_DOMAIN = "ridefiles.net";

let jsonpCounter = 0;

// Carga el feed de ofertas vía JSONP. Resuelve con el objeto completo del feed
// ({ general, offers }) o rechaza con Error.
export function fetchCpagripOffers(trackingId, { timeout = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `__cpagrip_cb_${Date.now()}_${jsonpCounter++}`;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Tiempo agotado al cargar las ofertas"));
    }, timeout);

    window[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Error de red al cargar las ofertas"));
    };

    const params = new URLSearchParams({
      user_id: CPAGRIP_USER_ID,
      pubkey: CPAGRIP_PUBKEY,
      callback: callbackName,
    });
    if (trackingId) params.set("tracking_id", trackingId);

    script.src = `${CPAGRIP_FEED_URL}?${params.toString()}`;
    document.body.appendChild(script);
  });
}

// Convierte el payout (USD) a puntos. Tasa universal: 1000 pts = 1 USD
// (igual que el postback cpagrip-postback, que usa USD_TO_ARS_RATE=1000).
export function payoutToPoints(payoutUsd) {
  const usd = Number(payoutUsd);
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.ceil(usd * 1000);
}

// Reemplaza el dominio del offerlink por el dominio de tracking personalizado.
export function withTrackingDomain(offerlink) {
  if (!offerlink) return offerlink;
  return offerlink.replace("www.cpagrip.com", CPAGRIP_TRACKING_DOMAIN);
}