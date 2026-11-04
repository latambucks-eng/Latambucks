-- ============================================================
-- MIGRACIÓN: Comprobante de pago en campañas locales
-- ============================================================
-- 1. Agrega la columna comprobante_pago_url a campanas_locales
-- 2. Crea el bucket público "comprobantes-pagos" en Supabase Storage
-- 3. Configura RLS para el bucket (upload propio, lectura pública)
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase (Dashboard).
-- Idempotente: se puede ejecutar múltiples veces sin error.
-- ============================================================

-- 1) Columna para guardar la URL del comprobante de pago subido
ALTER TABLE public.campanas_locales
  ADD COLUMN IF NOT EXISTS comprobante_pago_url text;

COMMENT ON COLUMN public.campanas_locales.comprobante_pago_url IS 'URL pública del comprobante de pago subido por el anunciante';

-- 2) Crear el bucket público "comprobantes-pagos" (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-pagos', 'comprobantes-pagos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS para el bucket "comprobantes-pagos"
-- Habilitar RLS en storage.objects (no-op si ya está habilitada)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política INSERT: usuarios autenticados pueden subir a su propia carpeta
-- Mismo patrón que el bucket capturas-tareas (split_part).
DROP POLICY IF EXISTS "comprobantes_upload_own" ON storage.objects;
CREATE POLICY "comprobantes_upload_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comprobantes-pagos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- Política UPDATE: usuarios pueden actualizar sus propios archivos
DROP POLICY IF EXISTS "comprobantes_update_own" ON storage.objects;
CREATE POLICY "comprobantes_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'comprobantes-pagos'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'comprobantes-pagos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- Política DELETE: usuarios pueden eliminar sus propios archivos
DROP POLICY IF EXISTS "comprobantes_delete_own" ON storage.objects;
CREATE POLICY "comprobantes_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'comprobantes-pagos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- Nota: la lectura (SELECT) es pública automáticamente porque el bucket
-- fue creado con public=true. No se necesita policy de SELECT.