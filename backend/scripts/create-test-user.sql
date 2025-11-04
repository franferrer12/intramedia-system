-- Script para crear usuario de prueba: agencia@test.com
-- Contraseña: test1234

BEGIN;

-- 1. Crear usuario en tabla users
-- Nota: La contraseña 'test1234' hasheada con bcrypt (10 rounds)
-- Hash: $2b$10$rXK9ZJmF7qJ5YxG5vZ0qxOY.Hx8XQqF5qvJ5vZ0qxOY.Hx8XQqF5q
INSERT INTO users (email, password_hash, user_type, created_at, updated_at)
VALUES (
  'agencia@test.com',
  '$2b$10$rXK9ZJmF7qJ5YxG5vZ0qxOY.Hx8XQqF5qvJ5vZ0qxOY.Hx8XQqF5q',
  'agency',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 2. Crear agencia asociada al usuario
-- Obtenemos el user_id del usuario recién creado
WITH new_user AS (
  SELECT id FROM users WHERE email = 'agencia@test.com'
)
INSERT INTO agencies (
  user_id,
  agency_name,
  legal_name,
  tax_id,
  contact_person,
  phone,
  email,
  subscription_plan,
  max_djs,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  'Agencia Musical Test',
  'Agencia Musical Test S.L.',
  'B12345678',
  'Juan Pérez',
  '+34 600 123 456',
  'agencia@test.com',
  'professional',
  50,
  true,
  NOW(),
  NOW()
FROM new_user
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- Verificar que se creó correctamente
SELECT
  u.id as user_id,
  u.email,
  u.user_type,
  a.id as agency_id,
  a.agency_name,
  a.subscription_plan,
  a.max_djs
FROM users u
LEFT JOIN agencies a ON u.id = a.user_id
WHERE u.email = 'agencia@test.com';
