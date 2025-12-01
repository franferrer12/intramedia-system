-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 013b: Asignar Roles Iniciales a Usuarios Existentes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Asignar roles del nuevo sistema RBAC a usuarios existentes
-- Fecha: 2025-12-01
-- Autor: IntraMedia Development Team
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ASIGNACIÓN DE ROLES A USUARIOS EXISTENTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Asignar super_admin al primer usuario (típicamente el admin principal)
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT
    u.id,
    r.id,
    NULL, -- Sistema
    true
FROM users u
CROSS JOIN roles r
WHERE u.id = 1
  AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO UPDATE
SET is_active = true,
    assigned_at = CURRENT_TIMESTAMP;

-- Asignar admin a otros usuarios con role='admin' en la tabla users
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT
    u.id,
    r.id,
    1, -- Asignado por super_admin
    true
FROM users u
CROSS JOIN roles r
WHERE u.role = 'admin'
  AND u.id != 1
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO UPDATE
SET is_active = true,
    assigned_at = CURRENT_TIMESTAMP;

-- Asignar rol 'dj' a usuarios con role='dj' y dj_id presente
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT
    u.id,
    r.id,
    1, -- Asignado por super_admin
    true
FROM users u
CROSS JOIN roles r
WHERE u.role = 'dj'
  AND u.dj_id IS NOT NULL
  AND r.name = 'dj'
ON CONFLICT (user_id, role_id) DO UPDATE
SET is_active = true,
    assigned_at = CURRENT_TIMESTAMP;

-- Asignar rol 'staff' existente al rol 'manager' del nuevo sistema
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT
    u.id,
    r.id,
    1, -- Asignado por super_admin
    true
FROM users u
CROSS JOIN roles r
WHERE u.role = 'staff'
  AND r.name = 'manager'
ON CONFLICT (user_id, role_id) DO UPDATE
SET is_active = true,
    assigned_at = CURRENT_TIMESTAMP;

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICACIÓN
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Mostrar usuarios con sus roles asignados
SELECT
    u.id,
    u.email,
    u.role as old_role,
    r.name as new_role,
    r.display_name,
    ur.assigned_at
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
WHERE ur.is_active = true
ORDER BY u.id;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
