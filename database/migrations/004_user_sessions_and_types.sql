-- Parche para agregar columnas multi-tenant a tabla users existente
-- Este script es seguro de ejecutar múltiples veces

BEGIN;

-- 1. Agregar columna user_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users ADD COLUMN user_type VARCHAR(20);
    RAISE NOTICE 'Columna user_type agregada';
  ELSE
    RAISE NOTICE 'Columna user_type ya existe';
  END IF;
END $$;

-- 2. Actualizar valores NULL a 'admin' (para usuarios existentes)
UPDATE users SET user_type = 'admin' WHERE user_type IS NULL;

-- 3. Agregar constraint después de actualizar valores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'users' AND constraint_name = 'users_user_type_check'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('agency', 'individual_dj', 'admin'));
    RAISE NOTICE 'Constraint user_type agregado';
  END IF;
END $$;

-- 4. Hacer NOT NULL después de tener valores
ALTER TABLE users ALTER COLUMN user_type SET NOT NULL;

-- 5. Crear tabla agencies si no existe
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  tax_id VARCHAR(50),
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'España',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  max_djs INTEGER DEFAULT 10,
  total_djs INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Crear tabla sessions si no existe
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- 7. Crear tabla audit_logs si no existe
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

COMMIT;

-- Mostrar resultado
SELECT
  'users' as tabla,
  COUNT(*) as registros
FROM users
UNION ALL
SELECT
  'agencies' as tabla,
  COUNT(*) as registros
FROM agencies
UNION ALL
SELECT
  'sessions' as tabla,
  COUNT(*) as registros
FROM sessions;
