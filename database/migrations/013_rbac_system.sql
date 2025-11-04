-- Migration: RBAC System (Role-Based Access Control)
-- Description: Sistema de roles y permisos
-- Version: 013
-- Date: 2025-10-28

-- ==================== ROLES TABLE ====================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    nivel_acceso INTEGER NOT NULL DEFAULT 0, -- 0=básico, 50=medio, 100=completo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles predefinidos
INSERT INTO roles (nombre, descripcion, nivel_acceso) VALUES
('admin', 'Administrador del sistema con acceso completo', 100),
('manager', 'Manager con acceso a gestión y reportes', 75),
('dj', 'DJ con acceso a sus eventos y perfil', 25),
('viewer', 'Usuario solo lectura para reportes', 10)
ON CONFLICT (nombre) DO NOTHING;

-- ==================== PERMISSIONS TABLE ====================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    recurso VARCHAR(50) NOT NULL, -- Ej: 'eventos', 'djs', 'clientes'
    accion VARCHAR(20) NOT NULL, -- Ej: 'create', 'read', 'update', 'delete'
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recurso, accion)
);

-- Permisos básicos
INSERT INTO permissions (recurso, accion, descripcion) VALUES
-- Eventos
('eventos', 'create', 'Crear eventos'),
('eventos', 'read', 'Ver eventos'),
('eventos', 'update', 'Actualizar eventos'),
('eventos', 'delete', 'Eliminar eventos'),
-- DJs
('djs', 'create', 'Crear DJs'),
('djs', 'read', 'Ver DJs'),
('djs', 'update', 'Actualizar DJs'),
('djs', 'delete', 'Eliminar DJs'),
-- Clientes
('clientes', 'create', 'Crear clientes'),
('clientes', 'read', 'Ver clientes'),
('clientes', 'update', 'Actualizar clientes'),
('clientes', 'delete', 'Eliminar clientes'),
-- Socios
('socios', 'create', 'Crear socios'),
('socios', 'read', 'Ver socios'),
('socios', 'update', 'Actualizar socios'),
('socios', 'delete', 'Eliminar socios'),
-- Financial
('financial', 'read', 'Ver información financiera'),
('financial', 'update', 'Actualizar información financiera'),
-- Leads
('leads', 'create', 'Crear leads'),
('leads', 'read', 'Ver leads'),
('leads', 'update', 'Actualizar leads'),
('leads', 'delete', 'Eliminar leads'),
-- Requests
('requests', 'create', 'Crear solicitudes'),
('requests', 'read', 'Ver solicitudes'),
('requests', 'update', 'Actualizar solicitudes'),
('requests', 'delete', 'Eliminar solicitudes')
ON CONFLICT (recurso, accion) DO NOTHING;

-- ==================== ROLE_PERMISSIONS TABLE ====================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Asignar permisos a roles

-- Admin: TODOS los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.nombre = 'admin'
ON CONFLICT DO NOTHING;

-- Manager: Todo excepto eliminar socios
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.nombre = 'manager'
  AND NOT (p.recurso = 'socios' AND p.accion = 'delete')
ON CONFLICT DO NOTHING;

-- DJ: Solo leer y actualizar sus datos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.nombre = 'dj'
  AND (
    (p.recurso = 'eventos' AND p.accion IN ('read', 'update'))
    OR (p.recurso = 'djs' AND p.accion IN ('read', 'update'))
  )
ON CONFLICT DO NOTHING;

-- Viewer: Solo lectura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.nombre = 'viewer'
  AND p.accion = 'read'
ON CONFLICT DO NOTHING;

-- ==================== USER_ROLES TABLE ====================
-- Añadir role_id a la tabla users/djs
ALTER TABLE djs ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) DEFAULT 3; -- Default: DJ role

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_djs_role ON djs(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions ON role_permissions(role_id, permission_id);

-- ==================== FUNCTIONS ====================

-- Función para verificar si un usuario tiene un permiso
CREATE OR REPLACE FUNCTION user_has_permission(
    user_id INTEGER,
    recurso_name VARCHAR(50),
    accion_name VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM djs d
        INNER JOIN role_permissions rp ON d.role_id = rp.role_id
        INNER JOIN permissions p ON rp.permission_id = p.id
        WHERE d.id = user_id
          AND p.recurso = recurso_name
          AND p.accion = accion_name
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener todos los permisos de un usuario
CREATE OR REPLACE FUNCTION get_user_permissions(user_id INTEGER)
RETURNS TABLE (
    recurso VARCHAR(50),
    accion VARCHAR(20),
    descripcion TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.recurso, p.accion, p.descripcion
    FROM djs d
    INNER JOIN role_permissions rp ON d.role_id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE d.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== VIEWS ====================

-- Vista de usuarios con sus roles
CREATE OR REPLACE VIEW vw_users_with_roles AS
SELECT
    d.id as user_id,
    d.nombre as user_nombre,
    d.email,
    r.id as role_id,
    r.nombre as role_nombre,
    r.nivel_acceso,
    d.activo
FROM djs d
LEFT JOIN roles r ON d.role_id = r.id;

-- Vista de roles con conteo de permisos
CREATE OR REPLACE VIEW vw_roles_with_permission_count AS
SELECT
    r.id,
    r.nombre,
    r.descripcion,
    r.nivel_acceso,
    COUNT(rp.permission_id) as num_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.nombre, r.descripcion, r.nivel_acceso;

-- Comments
COMMENT ON TABLE roles IS 'Roles del sistema para control de acceso';
COMMENT ON TABLE permissions IS 'Permisos granulares por recurso y acción';
COMMENT ON TABLE role_permissions IS 'Relación muchos a muchos entre roles y permisos';
COMMENT ON FUNCTION user_has_permission IS 'Verifica si un usuario tiene un permiso específico';
COMMENT ON FUNCTION get_user_permissions IS 'Obtiene todos los permisos de un usuario';

-- Update statistics
ANALYZE roles;
ANALYZE permissions;
ANALYZE role_permissions;
