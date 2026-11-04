// Compresión de imágenes en el frontend (cliente) antes del upload a Supabase Storage.
// Usa browser-image-compression — sin Edge Functions ni Image Transformations de Supabase.
// Convierte a WebP, máximo 1200px de ancho, objetivo 150-200 KB.

import imageCompression from "browser-image-compression";

/**
 * Comprime una imagen antes de subirla a Supabase Storage.
 * - Convierte a WebP (formato ligero)
 * - Redimensiona a máximo 1200px de ancho
 * - Objetivo de tamaño: 150 KB (0.15 MB)
 *
 * @param {File} file — archivo de imagen original
 * @returns {Promise<File>} — archivo comprimido en formato WebP
 */
export async function compressImage(file) {
  if (!file) return file;

  // Si ya es pequeño (< 200 KB) y es webp, no comprimir
  if (file.size < 200 * 1024 && file.type === "image/webp") {
    return file;
  }

  const options = {
    maxSizeMB: 0.15, // 150 KB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.8,
  };

  try {
    const compressed = await imageCompression(file, options);
    // Generar nombre .webp
    const baseName = (file.name || "imagen").replace(/\.[^/.]+$/, "");
    return new File([compressed], `${baseName}.webp`, {
      type: "image/webp",
    });
  } catch (e) {
    console.error("Error comprimiendo imagen:", e);
    // Si falla la compresión, devolver el original
    return file;
  }
}