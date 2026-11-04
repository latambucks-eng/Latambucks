// CPAGrip (AdBlueMedia) Link Locker — se abre en nueva pestaña al invocarlo.
// Formato: https://ridefiles.net/1917071{tracking_id}
// tracking_id = user.id de Supabase para que el postback (cpagrip-postback)
// sepa a qué usuario acreditarle los puntos al completar el locker.
const CPAGRIP_LOCKER_URL = "https://ridefiles.net/1917071";

export function openCpagripLocker(user) {
  if (!user?.id) return;
  const url = `${CPAGRIP_LOCKER_URL}${encodeURIComponent(user.id)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}