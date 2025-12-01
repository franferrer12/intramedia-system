-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 015: Document Management System
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Purpose: Sistema completo de gestión de documentos
--          - Upload múltiple con categorías y tags
--          - Versionado de archivos con historial
--          - Permisos granulares y sharing
--          - Full-text search y metadata
-- Author: Claude Code
-- Date: 2025-12-01
-- Sprint: 4.3 - Document Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Estados del documento
CREATE TYPE document_status AS ENUM (
  'active',      -- Documento activo y accesible
  'archived',    -- Archivado pero accesible
  'deleted',     -- Soft deleted
  'processing'   -- En procesamiento (OCR, conversión, etc)
);

-- Categorías de documentos
CREATE TYPE document_category AS ENUM (
  'contract',       -- Contratos
  'invoice',        -- Facturas
  'receipt',        -- Recibos
  'agreement',      -- Acuerdos
  'legal',          -- Documentos legales
  'technical',      -- Documentos técnicos
  'marketing',      -- Material de marketing
  'rider',          -- Technical riders de eventos
  'payment_proof', -- Comprobantes de pago
  'identification', -- Documentos de identidad
  'license',        -- Licencias
  'insurance',      -- Seguros
  'other'           -- Otros
);

-- Niveles de acceso
CREATE TYPE access_level AS ENUM (
  'private',     -- Solo el creador
  'restricted',  -- Usuarios específicos
  'team',        -- Todo el equipo
  'public'       -- Acceso público (con autenticación)
);

COMMENT ON TYPE document_status IS 'Estados posibles de un documento';
COMMENT ON TYPE document_category IS 'Categorías de clasificación de documentos';
COMMENT ON TYPE access_level IS 'Niveles de acceso para documentos compartidos';

-- ============================================================================
-- TABLE: documents
-- ============================================================================

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,

  -- Información básica
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,

  -- Categorización
  category document_category NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',

  -- Archivo
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500),
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL, -- en bytes
  file_hash VARCHAR(64), -- SHA-256 para detección de duplicados

  -- Storage info
  storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 's3', 'gcs', etc
  storage_bucket VARCHAR(100),
  storage_key VARCHAR(500),

  -- Metadata
  metadata JSONB DEFAULT '{}', -- metadata adicional flexible
  ocr_text TEXT, -- texto extraído del documento (para PDFs/imágenes)
  page_count INT,

  -- Versionado
  version INT DEFAULT 1,
  parent_document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
  is_latest_version BOOLEAN DEFAULT true,

  -- Relaciones
  related_to_type VARCHAR(50), -- 'evento', 'dj', 'cliente', 'contract', etc
  related_to_id BIGINT,
  agency_id BIGINT REFERENCES agencies(id) ON DELETE CASCADE,

  -- Permisos y compartición
  access_level access_level DEFAULT 'private',
  owner_id BIGINT NOT NULL,
  shared_with_user_ids BIGINT[] DEFAULT '{}',
  shared_with_role_ids INT[] DEFAULT '{}',

  -- Links compartibles
  share_token VARCHAR(64) UNIQUE, -- token para links públicos compartibles
  share_token_expires_at TIMESTAMP WITH TIME ZONE,
  share_password_hash VARCHAR(255), -- opcional: proteger link con contraseña

  -- Estado
  status document_status DEFAULT 'active',

  -- Audit
  uploaded_by BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT,

  -- Indexes para búsqueda
  search_vector tsvector,

  CONSTRAINT valid_file_size CHECK (file_size > 0),
  CONSTRAINT valid_version CHECK (version > 0)
);

-- Comentarios
COMMENT ON TABLE documents IS 'Tabla principal de documentos con versionado y permisos';
COMMENT ON COLUMN documents.file_hash IS 'SHA-256 hash para detectar archivos duplicados';
COMMENT ON COLUMN documents.ocr_text IS 'Texto extraído del documento para búsqueda';
COMMENT ON COLUMN documents.parent_document_id IS 'Referencia al documento padre si es una versión';
COMMENT ON COLUMN documents.related_to_type IS 'Tipo de entidad relacionada (evento, dj, cliente, etc)';
COMMENT ON COLUMN documents.share_token IS 'Token único para compartir documento vía link público';
COMMENT ON COLUMN documents.search_vector IS 'Vector de búsqueda full-text';

-- Indexes
CREATE INDEX idx_documents_category ON documents(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_status ON documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_owner ON documents(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_agency ON documents(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_related ON documents(related_to_type, related_to_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_tags ON documents USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_share_token ON documents(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_documents_parent ON documents(parent_document_id) WHERE parent_document_id IS NOT NULL;
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);

-- Full-text search index
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION documents_search_vector_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.original_filename, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.ocr_text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description, original_filename, ocr_text
  ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_search_vector_trigger();

-- ============================================================================
-- TABLE: document_versions
-- ============================================================================

CREATE TABLE document_versions (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Version info
  version INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500),
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64),

  -- Changes tracking
  change_description TEXT,
  changed_by BIGINT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Storage
  storage_provider VARCHAR(50),
  storage_bucket VARCHAR(100),
  storage_key VARCHAR(500),

  UNIQUE (document_id, version),
  CONSTRAINT valid_version_number CHECK (version > 0)
);

COMMENT ON TABLE document_versions IS 'Historial de versiones de documentos';
COMMENT ON COLUMN document_versions.change_description IS 'Descripción de los cambios realizados en esta versión';

CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_changed_at ON document_versions(changed_at DESC);

-- ============================================================================
-- TABLE: document_access_logs
-- ============================================================================

CREATE TABLE document_access_logs (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Access info
  accessed_by BIGINT,
  access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'share', 'update', 'delete'
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Context
  ip_address INET,
  user_agent TEXT,
  share_token VARCHAR(64), -- si el acceso fue vía link compartido

  -- Result
  access_granted BOOLEAN DEFAULT true,
  denial_reason VARCHAR(255)
);

COMMENT ON TABLE document_access_logs IS 'Log de accesos a documentos para auditoría';
COMMENT ON COLUMN document_access_logs.access_type IS 'Tipo de acceso: view, download, share, update, delete';
COMMENT ON COLUMN document_access_logs.denial_reason IS 'Razón de denegación si access_granted es false';

CREATE INDEX idx_document_access_logs_document ON document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user ON document_access_logs(accessed_by);
CREATE INDEX idx_document_access_logs_accessed_at ON document_access_logs(accessed_at DESC);
CREATE INDEX idx_document_access_logs_token ON document_access_logs(share_token) WHERE share_token IS NOT NULL;

-- ============================================================================
-- TABLE: document_shares
-- ============================================================================

CREATE TABLE document_shares (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Compartido con
  shared_with_user_id BIGINT,
  shared_with_role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  shared_with_email VARCHAR(255), -- para compartir con usuarios externos

  -- Permisos
  can_view BOOLEAN DEFAULT true,
  can_download BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,

  -- Validez
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Audit
  shared_by BIGINT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Al menos uno de estos debe estar presente
  CONSTRAINT share_target_required CHECK (
    shared_with_user_id IS NOT NULL OR
    shared_with_role_id IS NOT NULL OR
    shared_with_email IS NOT NULL
  )
);

COMMENT ON TABLE document_shares IS 'Permisos de compartición de documentos';
COMMENT ON COLUMN document_shares.shared_with_email IS 'Email para compartir con usuarios externos (no registrados)';
COMMENT ON COLUMN document_shares.expires_at IS 'Fecha de expiración del acceso compartido';

CREATE INDEX idx_document_shares_document ON document_shares(document_id) WHERE is_active = true;
CREATE INDEX idx_document_shares_user ON document_shares(shared_with_user_id) WHERE is_active = true;
CREATE INDEX idx_document_shares_role ON document_shares(shared_with_role_id) WHERE is_active = true;
CREATE INDEX idx_document_shares_email ON document_shares(shared_with_email) WHERE is_active = true;

-- ============================================================================
-- TABLE: document_tags
-- ============================================================================

CREATE TABLE document_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category document_category,
  usage_count INT DEFAULT 0,
  agency_id BIGINT REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE document_tags IS 'Tags reutilizables para categorizar documentos';
COMMENT ON COLUMN document_tags.usage_count IS 'Contador de veces que se usa el tag';

CREATE INDEX idx_document_tags_name ON document_tags(name);
CREATE INDEX idx_document_tags_category ON document_tags(category);
CREATE INDEX idx_document_tags_agency ON document_tags(agency_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Vista de documentos con información completa
CREATE OR REPLACE VIEW documents_full AS
SELECT
  d.*,
  u.name as owner_name,
  u.email as owner_email,
  a.nombre as agency_name,
  (
    SELECT COUNT(*)
    FROM document_versions dv
    WHERE dv.document_id = d.id
  ) as version_count,
  (
    SELECT MAX(dal.accessed_at)
    FROM document_access_logs dal
    WHERE dal.document_id = d.id AND dal.access_type = 'view'
  ) as last_accessed_at,
  (
    SELECT COUNT(DISTINCT accessed_by)
    FROM document_access_logs dal
    WHERE dal.document_id = d.id
      AND dal.accessed_at > NOW() - INTERVAL '30 days'
  ) as views_last_30_days
FROM documents d
LEFT JOIN users u ON d.owner_id = u.id
LEFT JOIN agencies a ON d.agency_id = a.id
WHERE d.deleted_at IS NULL;

COMMENT ON VIEW documents_full IS 'Vista completa de documentos con información agregada';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Función para crear nueva versión de documento
CREATE OR REPLACE FUNCTION create_document_version(
  p_document_id BIGINT,
  p_new_file_path VARCHAR(500),
  p_new_file_size BIGINT,
  p_change_description TEXT,
  p_changed_by BIGINT
) RETURNS INT AS $$
DECLARE
  v_current_version INT;
  v_new_version INT;
  v_filename VARCHAR(255);
  v_file_hash VARCHAR(64);
BEGIN
  -- Obtener versión actual
  SELECT version, filename, file_hash
  INTO v_current_version, v_filename, v_file_hash
  FROM documents
  WHERE id = p_document_id;

  -- Guardar versión anterior en historial
  INSERT INTO document_versions (
    document_id, version, filename, file_path, file_size, file_hash,
    change_description, changed_by
  )
  SELECT
    id, version, filename, file_path, file_size, file_hash,
    p_change_description, p_changed_by
  FROM documents
  WHERE id = p_document_id;

  -- Incrementar versión
  v_new_version := v_current_version + 1;

  -- Actualizar documento principal
  UPDATE documents
  SET
    version = v_new_version,
    file_path = p_new_file_path,
    file_size = p_new_file_size,
    updated_at = NOW()
  WHERE id = p_document_id;

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_document_version IS 'Crea una nueva versión de un documento existente';

-- Función para rollback a versión anterior
CREATE OR REPLACE FUNCTION rollback_document_version(
  p_document_id BIGINT,
  p_target_version INT,
  p_user_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
  v_version_data RECORD;
BEGIN
  -- Obtener datos de la versión objetivo
  SELECT * INTO v_version_data
  FROM document_versions
  WHERE document_id = p_document_id AND version = p_target_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version % not found for document %', p_target_version, p_document_id;
  END IF;

  -- Crear nueva versión con los datos de la versión antigua
  PERFORM create_document_version(
    p_document_id,
    v_version_data.file_path,
    v_version_data.file_size,
    FORMAT('Rollback to version %s', p_target_version),
    p_user_id
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rollback_document_version IS 'Revierte un documento a una versión anterior';

-- Función para verificar acceso a documento
CREATE OR REPLACE FUNCTION can_access_document(
  p_document_id BIGINT,
  p_user_id BIGINT,
  p_access_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_document RECORD;
  v_has_access BOOLEAN := false;
BEGIN
  SELECT * INTO v_document FROM documents WHERE id = p_document_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Owner siempre tiene acceso
  IF v_document.owner_id = p_user_id THEN
    RETURN true;
  END IF;

  -- Verificar si usuario está en shared_with_user_ids
  IF p_user_id = ANY(v_document.shared_with_user_ids) THEN
    RETURN true;
  END IF;

  -- Verificar permisos por shares explícitos
  SELECT EXISTS(
    SELECT 1 FROM document_shares
    WHERE document_id = p_document_id
      AND shared_with_user_id = p_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        (p_access_type = 'view' AND can_view) OR
        (p_access_type = 'download' AND can_download) OR
        (p_access_type = 'edit' AND can_edit) OR
        (p_access_type = 'share' AND can_share)
      )
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_access_document IS 'Verifica si un usuario tiene acceso a un documento';

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Tags predefinidos comunes
INSERT INTO document_tags (name, category) VALUES
  ('Urgente', NULL),
  ('Confidencial', NULL),
  ('Firmado', 'contract'),
  ('Pagado', 'invoice'),
  ('Pendiente', 'invoice'),
  ('Verificado', NULL),
  ('Original', NULL),
  ('Copia', NULL)
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- Para revertir esta migración:
/*
BEGIN;

DROP VIEW IF EXISTS documents_full CASCADE;
DROP FUNCTION IF EXISTS can_access_document CASCADE;
DROP FUNCTION IF EXISTS rollback_document_version CASCADE;
DROP FUNCTION IF EXISTS create_document_version CASCADE;
DROP FUNCTION IF EXISTS documents_search_vector_trigger CASCADE;

DROP TABLE IF EXISTS document_shares CASCADE;
DROP TABLE IF EXISTS document_access_logs CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

DROP TYPE IF EXISTS access_level CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;

COMMIT;
*/
