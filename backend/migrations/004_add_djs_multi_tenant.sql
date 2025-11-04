-- Migración para agregar columnas multi-tenant a tabla djs
-- Este script es seguro de ejecutar múltiples veces

BEGIN;

-- 1. Agregar columna user_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE djs ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Columna user_id agregada a djs';
  ELSE
    RAISE NOTICE 'Columna user_id ya existe en djs';
  END IF;
END $$;

-- 2. Agregar columna managed_by si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'managed_by'
  ) THEN
    ALTER TABLE djs ADD COLUMN managed_by VARCHAR(20);
    RAISE NOTICE 'Columna managed_by agregada a djs';
  ELSE
    RAISE NOTICE 'Columna managed_by ya existe en djs';
  END IF;
END $$;

-- 3. Agregar columna active si no existe (alias de activo para compatibilidad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'active'
  ) THEN
    ALTER TABLE djs ADD COLUMN active BOOLEAN DEFAULT true;
    -- Sincronizar con activo si existe
    UPDATE djs SET active = activo WHERE activo IS NOT NULL;
    RAISE NOTICE 'Columna active agregada a djs';
  ELSE
    RAISE NOTICE 'Columna active ya existe en djs';
  END IF;
END $$;

-- 4. Crear índice en user_id si no existe
CREATE INDEX IF NOT EXISTS idx_djs_user_id ON djs(user_id);

-- 5. Crear índice en managed_by si no existe
CREATE INDEX IF NOT EXISTS idx_djs_managed_by ON djs(managed_by);

COMMIT;

-- Mostrar resultado
SELECT
  'djs' as tabla,
  COUNT(*) as total_registros,
  COUNT(user_id) as con_user_id,
  COUNT(managed_by) as con_managed_by
FROM djs;
