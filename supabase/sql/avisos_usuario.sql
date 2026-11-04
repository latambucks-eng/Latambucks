-- ============================================================
-- Tabla: avisos_usuario
-- Avisos individuales que el admin envía a un usuario específico.
-- Se muestran en el perfil del usuario (sección "Avisos").
-- ============================================================

CREATE TABLE IF NOT EXISTS avisos_usuario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL,
  titulo      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','success','warning','error')),
  leido       BOOLEAN NOT NULL DEFAULT false,
  creado_el   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para que el usuario busque sus avisos rápido
CREATE INDEX IF NOT EXISTS idx_avisos_usuario_usuario ON avisos_usuario (usuario_id, creado_el DESC);

-- RLS: cada usuario solo puede leer SUS avisos
ALTER TABLE avisos_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_leen_propios_avisos" ON avisos_usuario
  FOR SELECT TO authenticated
  USING (auth.uid()::text = usuario_id::text);

-- INSERT y DELETE: cualquier autenticado (la app restringe el formulario
-- y los botones al rol admin, igual que avisos_sistema)
CREATE POLICY "auth_insert_avisos" ON avisos_usuario
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_delete_avisos" ON avisos_usuario
  FOR DELETE TO authenticated USING (true);

-- No permitir UPDATE (los avisos son inmutables; si hay error, se borran)