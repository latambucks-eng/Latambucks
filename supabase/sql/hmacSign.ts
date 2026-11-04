// Helper compartido para firmar URLs con HMAC-SHA1 (base64-url-safe).
// Usado por TheoremReach offerwall y Surveys API.
// El digest debe ser RAW/binary (no hex) antes de base64-encodear.

export async function hmacSha1Base64Url(secretKey: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .replace(/\n/g, "");
}

// Extrae la IP real del cliente de los headers de la petición.
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}