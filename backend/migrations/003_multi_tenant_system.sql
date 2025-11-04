-- Migration 003: Multi-Tenant System (Agencias + DJs Individuales)
-- Ejecutar este script en PostgreSQL para habilitar el sistema multi-tenant

-- ========================================
-- 1. TABLA DE USUARIOS (Autenticación)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('agency', 'individual_dj', 'admin')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- ========================================
-- 2. TABLA DE AGENCIAS
-- ========================================
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  tax_id VARCHAR(50), -- NIF/CIF
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  logo_url VARCHAR(500),
  subscription_plan VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
  max_djs INTEGER DEFAULT 10, -- Límite de DJs que puede gestionar
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agencies_user ON agencies(user_id);
CREATE INDEX idx_agencies_active ON agencies(active);

-- ========================================
-- 3. MODIFICAR TABLA DJS (Agregar relación con agencias)
-- ========================================
-- Añadir columnas a la tabla existente de DJs
ALTER TABLE djs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE djs ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;
ALTER TABLE djs ADD COLUMN IF NOT EXISTS managed_by VARCHAR(20) DEFAULT 'self' CHECK (managed_by IN ('self', 'agency'));
ALTER TABLE djs ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_djs_user ON djs(user_id);
CREATE INDEX IF NOT EXISTS idx_djs_agency ON djs(agency_id);
CREATE INDEX IF NOT EXISTS idx_djs_managed_by ON djs(managed_by);

-- ========================================
-- 4. TABLA DE PERMISOS Y ROLES
-- ========================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50), -- 'dj', 'event', 'client', etc.
  resource_id INTEGER, -- ID específico del recurso (opcional)
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permissions_resource ON user_permissions(resource_type, resource_id);

-- ========================================
-- 5. TABLA DE RELACIONES AGENCIA-DJ
-- ========================================
CREATE TABLE IF NOT EXISTS agency_dj_relations (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'managed', -- managed, partner, freelance
  commission_rate DECIMAL(5,2), -- Porcentaje de comisión
  contract_start_date DATE,
  contract_end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agency_id, dj_id)
);

CREATE INDEX idx_agency_dj_agency ON agency_dj_relations(agency_id);
CREATE INDEX idx_agency_dj_dj ON agency_dj_relations(dj_id);

-- ========================================
-- 6. TABLA DE SESIONES (Para autenticación)
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ========================================
-- 7. TABLA DE AUDIT LOG (Registro de acciones)
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ========================================
-- 8. VISTAS ÚTILES
-- ========================================

-- Vista: Agencias con conteo de DJs
CREATE OR REPLACE VIEW agency_stats AS
SELECT
  a.id as agency_id,
  a.agency_name,
  a.user_id,
  u.email,
  COUNT(DISTINCT r.dj_id) as total_djs,
  COUNT(DISTINCT CASE WHEN r.active = true THEN r.dj_id END) as active_djs,
  a.max_djs,
  a.subscription_plan,
  a.created_at
FROM agencies a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN agency_dj_relations r ON a.id = r.agency_id
GROUP BY a.id, a.agency_name, a.user_id, u.email, a.max_djs, a.subscription_plan, a.created_at;

-- Vista: DJs con su información de gestión
CREATE OR REPLACE VIEW djs_management_view AS
SELECT
  d.id as dj_id,
  d.nombre,
  d.email,
  d.managed_by,
  d.active,
  u.id as user_id,
  u.email as user_email,
  a.id as agency_id,
  a.agency_name,
  r.role as agency_role,
  r.commission_rate,
  d.created_at
FROM djs d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN agency_dj_relations r ON d.id = r.dj_id AND r.active = true
LEFT JOIN agencies a ON r.agency_id = a.id;

-- ========================================
-- 9. FUNCIONES ÚTILES
-- ========================================

-- Función: Verificar si un usuario tiene permiso
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id INTEGER,
  p_permission VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_type VARCHAR(20);
  v_has_permission BOOLEAN;
BEGIN
  -- Admin tiene todos los permisos
  SELECT user_type INTO v_user_type FROM users WHERE id = p_user_id;
  IF v_user_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Verificar permiso específico
  IF p_resource_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_permissions
      WHERE user_id = p_user_id
        AND permission = p_permission
        AND resource_type = p_resource_type
        AND (resource_id = p_resource_id OR resource_id IS NULL)
    ) INTO v_has_permission;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM user_permissions
      WHERE user_id = p_user_id
        AND permission = p_permission
        AND (resource_type = p_resource_type OR resource_type IS NULL)
    ) INTO v_has_permission;
  END IF;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener DJs de una agencia
CREATE OR REPLACE FUNCTION get_agency_djs(p_agency_id INTEGER)
RETURNS TABLE (
  dj_id INTEGER,
  dj_name VARCHAR,
  dj_email VARCHAR,
  role VARCHAR,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.nombre,
    d.email,
    r.role,
    r.active
  FROM djs d
  INNER JOIN agency_dj_relations r ON d.id = r.dj_id
  WHERE r.agency_id = p_agency_id
  ORDER BY d.nombre;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. TRIGGERS
-- ========================================

-- Trigger: Actualizar updated_at en agencies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 11. DATOS DE EJEMPLO (Opcional - comentar si no se desea)
-- ========================================

-- Usuario Admin por defecto
INSERT INTO users (email, password_hash, user_type)
VALUES ('admin@intramedia.com', '$2b$10$X0X0X0X0X0X0X0X0X0X0X0', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Agencia de ejemplo
INSERT INTO users (email, password_hash, user_type)
VALUES ('agency@example.com', '$2b$10$Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1', 'agency')
ON CONFLICT (email) DO NOTHING;

INSERT INTO agencies (user_id, agency_name, legal_name, subscription_plan)
SELECT u.id, 'Demo Agency', 'Demo Agency S.L.', 'pro'
FROM users u WHERE u.email = 'agency@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- DJ Individual de ejemplo
INSERT INTO users (email, password_hash, user_type)
VALUES ('dj@example.com', '$2b$10$Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2', 'individual_dj')
ON CONFLICT (email) DO NOTHING;

-- Vincular DJ existente con usuario individual
UPDATE djs
SET user_id = (SELECT id FROM users WHERE email = 'dj@example.com' LIMIT 1),
    managed_by = 'self'
WHERE id = 1
  AND user_id IS NULL;

-- ========================================
-- COMENTARIOS FINALES
-- ========================================

COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación';
COMMENT ON TABLE agencies IS 'Agencias que gestionan múltiples DJs';
COMMENT ON TABLE agency_dj_relations IS 'Relación entre agencias y DJs que gestionan';
COMMENT ON TABLE user_permissions IS 'Permisos granulares por usuario';
COMMENT ON TABLE user_sessions IS 'Sesiones activas de usuarios';
COMMENT ON TABLE audit_log IS 'Log de auditoría de todas las acciones';

COMMENT ON COLUMN users.user_type IS 'Tipo de usuario: agency, individual_dj, admin';
COMMENT ON COLUMN djs.managed_by IS 'Gestión: self (DJ individual) o agency (gestionado por agencia)';
COMMENT ON COLUMN agencies.max_djs IS 'Límite de DJs que la agencia puede gestionar según su plan';
