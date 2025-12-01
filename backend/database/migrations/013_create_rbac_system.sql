-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 013: Sistema RBAC Completo (Role-Based Access Control)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Sistema completo de roles y permisos granulares
-- Fecha: 2025-12-01
-- Autor: IntraMedia Development Team
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: permissions
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Tabla: role_permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Tabla: user_roles (soporte multi-role)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÍNDICES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = true;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIONES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Función: user_has_permission
-- Verifica si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
        INNER JOIN permissions p ON rp.permission_id = p.id
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
          AND r.is_active = true
          AND p.resource = p_resource
          AND p.action = p_action
          AND p.is_active = true
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Función: get_user_permissions
-- Obtiene todos los permisos de un usuario
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE (
    permission_id INTEGER,
    resource VARCHAR,
    action VARCHAR,
    display_name VARCHAR,
    description TEXT,
    role_name VARCHAR,
    role_display_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id as permission_id,
        p.resource,
        p.action,
        p.display_name,
        p.description,
        r.name as role_name,
        r.display_name as role_display_name
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    INNER JOIN role_permissions rp ON r.id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      AND r.is_active = true
      AND p.is_active = true
    ORDER BY r.name, p.resource, p.action;
END;
$$ LANGUAGE plpgsql;

-- Función: get_user_roles
-- Obtiene todos los roles activos de un usuario
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id INTEGER)
RETURNS TABLE (
    role_id INTEGER,
    role_name VARCHAR,
    display_name VARCHAR,
    description TEXT,
    level INTEGER,
    assigned_at TIMESTAMP,
    expires_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as role_id,
        r.name as role_name,
        r.display_name,
        r.description,
        r.level,
        ur.assigned_at,
        ur.expires_at
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      AND r.is_active = true
    ORDER BY r.level DESC;
END;
$$ LANGUAGE plpgsql;

-- Función: user_has_role
-- Verifica si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION user_has_role(
    p_user_id INTEGER,
    p_role_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_role BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
          AND r.name = p_role_name
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
          AND r.is_active = true
    ) INTO has_role;

    RETURN has_role;
END;
$$ LANGUAGE plpgsql;

-- Función: get_role_permissions
-- Obtiene todos los permisos de un rol
CREATE OR REPLACE FUNCTION get_role_permissions(p_role_id INTEGER)
RETURNS TABLE (
    permission_id INTEGER,
    resource VARCHAR,
    action VARCHAR,
    display_name VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as permission_id,
        p.resource,
        p.action,
        p.display_name,
        p.description
    FROM role_permissions rp
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = p_role_id
      AND p.is_active = true
    ORDER BY p.resource, p.action;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger para updated_at en roles
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATOS INICIALES - ROLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO roles (name, display_name, description, level, is_system) VALUES
('super_admin', 'Super Administrador', 'Acceso completo al sistema sin restricciones', 100, true),
('admin', 'Administrador', 'Administración completa de agencias y usuarios', 90, true),
('manager', 'Manager', 'Gestión operativa y supervisión de equipos', 80, true),
('accountant', 'Contador', 'Gestión financiera y reportes contables', 60, true),
('sales', 'Ventas', 'Gestión de leads, clientes y cotizaciones', 50, true),
('dj', 'DJ/Artista', 'Acceso a eventos, disponibilidad y perfil', 40, true),
('client', 'Cliente', 'Vista de eventos contratados y pagos', 30, true),
('viewer', 'Visualizador', 'Solo lectura de información básica', 10, true)
ON CONFLICT (name) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATOS INICIALES - PERMISOS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Permisos de Eventos
INSERT INTO permissions (resource, action, display_name, description) VALUES
('eventos', 'create', 'Crear Eventos', 'Permite crear nuevos eventos'),
('eventos', 'read', 'Ver Eventos', 'Permite ver listado y detalles de eventos'),
('eventos', 'update', 'Editar Eventos', 'Permite modificar eventos existentes'),
('eventos', 'delete', 'Eliminar Eventos', 'Permite eliminar eventos'),
('eventos', 'manage_all', 'Gestionar Todos los Eventos', 'Acceso completo a todos los eventos'),

-- Permisos de DJs
('djs', 'create', 'Registrar DJs', 'Permite registrar nuevos DJs'),
('djs', 'read', 'Ver DJs', 'Permite ver listado y perfiles de DJs'),
('djs', 'update', 'Editar DJs', 'Permite modificar información de DJs'),
('djs', 'delete', 'Eliminar DJs', 'Permite eliminar registros de DJs'),
('djs', 'manage_availability', 'Gestionar Disponibilidad', 'Permite gestionar calendario de disponibilidad'),

-- Permisos de Clientes
('clientes', 'create', 'Registrar Clientes', 'Permite registrar nuevos clientes'),
('clientes', 'read', 'Ver Clientes', 'Permite ver listado de clientes'),
('clientes', 'update', 'Editar Clientes', 'Permite modificar información de clientes'),
('clientes', 'delete', 'Eliminar Clientes', 'Permite eliminar clientes'),

-- Permisos Financieros
('financial', 'read', 'Ver Finanzas', 'Permite ver información financiera'),
('financial', 'update', 'Gestionar Finanzas', 'Permite gestionar pagos y finanzas'),
('financial', 'reports', 'Reportes Financieros', 'Acceso a reportes y análisis financiero'),
('financial', 'profit_distribution', 'Distribución de Ganancias', 'Gestionar distribución de utilidades'),

-- Permisos de Cotizaciones
('quotations', 'create', 'Crear Cotizaciones', 'Permite crear cotizaciones'),
('quotations', 'read', 'Ver Cotizaciones', 'Permite ver cotizaciones'),
('quotations', 'update', 'Editar Cotizaciones', 'Permite modificar cotizaciones'),
('quotations', 'delete', 'Eliminar Cotizaciones', 'Permite eliminar cotizaciones'),
('quotations', 'send', 'Enviar Cotizaciones', 'Permite enviar cotizaciones a clientes'),

-- Permisos de Contratos
('contracts', 'create', 'Crear Contratos', 'Permite crear contratos'),
('contracts', 'read', 'Ver Contratos', 'Permite ver contratos'),
('contracts', 'update', 'Editar Contratos', 'Permite modificar contratos'),
('contracts', 'delete', 'Eliminar Contratos', 'Permite eliminar contratos'),
('contracts', 'sign', 'Firmar Contratos', 'Permite firmar contratos'),

-- Permisos de Leads
('leads', 'create', 'Registrar Leads', 'Permite registrar nuevos leads'),
('leads', 'read', 'Ver Leads', 'Permite ver leads'),
('leads', 'update', 'Gestionar Leads', 'Permite modificar y calificar leads'),
('leads', 'delete', 'Eliminar Leads', 'Permite eliminar leads'),
('leads', 'convert', 'Convertir Leads', 'Permite convertir leads a clientes'),

-- Permisos de Notificaciones
('notifications', 'create', 'Crear Notificaciones', 'Permite crear notificaciones'),
('notifications', 'read', 'Ver Notificaciones', 'Permite ver notificaciones'),
('notifications', 'manage_all', 'Gestionar Notificaciones', 'Gestión completa de notificaciones del sistema'),

-- Permisos de Usuarios
('users', 'create', 'Crear Usuarios', 'Permite crear nuevos usuarios'),
('users', 'read', 'Ver Usuarios', 'Permite ver listado de usuarios'),
('users', 'update', 'Editar Usuarios', 'Permite modificar usuarios'),
('users', 'delete', 'Eliminar Usuarios', 'Permite eliminar usuarios'),

-- Permisos de Roles
('roles', 'create', 'Crear Roles', 'Permite crear nuevos roles'),
('roles', 'read', 'Ver Roles', 'Permite ver roles y permisos'),
('roles', 'update', 'Editar Roles', 'Permite modificar roles y asignar permisos'),
('roles', 'delete', 'Eliminar Roles', 'Permite eliminar roles personalizados'),
('roles', 'assign', 'Asignar Roles', 'Permite asignar roles a usuarios'),

-- Permisos de Agencias
('agencies', 'create', 'Crear Agencias', 'Permite crear nuevas agencias'),
('agencies', 'read', 'Ver Agencias', 'Permite ver información de agencias'),
('agencies', 'update', 'Editar Agencias', 'Permite modificar agencias'),
('agencies', 'delete', 'Eliminar Agencias', 'Permite eliminar agencias'),

-- Permisos de Estadísticas
('statistics', 'read', 'Ver Estadísticas', 'Acceso a dashboards y estadísticas'),
('statistics', 'advanced', 'Estadísticas Avanzadas', 'Acceso a análisis avanzado y KPIs'),

-- Permisos del Sistema
('system', 'settings', 'Configuración del Sistema', 'Acceso a configuración general'),
('system', 'logs', 'Ver Logs del Sistema', 'Acceso a logs y auditoría'),
('system', 'maintenance', 'Mantenimiento', 'Acceso a herramientas de mantenimiento')

ON CONFLICT (resource, action) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ASIGNACIÓN DE PERMISOS A ROLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Super Admin: TODOS los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'super_admin'),
    id
FROM permissions
ON CONFLICT DO NOTHING;

-- Admin: Casi todos excepto sistema crítico
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
WHERE resource NOT IN ('system')
   OR (resource = 'system' AND action != 'maintenance')
ON CONFLICT DO NOTHING;

-- Manager: Operaciones del día a día
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'manager'),
    id
FROM permissions
WHERE resource IN ('eventos', 'djs', 'clientes', 'quotations', 'contracts', 'leads', 'statistics')
  AND action IN ('create', 'read', 'update', 'send', 'convert', 'manage_availability')
ON CONFLICT DO NOTHING;

-- Accountant: Solo finanzas y lectura
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'accountant'),
    id
FROM permissions
WHERE resource IN ('financial', 'quotations', 'contracts', 'eventos', 'statistics')
  AND action IN ('read', 'reports', 'profit_distribution')
ON CONFLICT DO NOTHING;

-- Sales: Leads, clientes, cotizaciones
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'sales'),
    id
FROM permissions
WHERE resource IN ('leads', 'clientes', 'quotations', 'eventos', 'statistics')
  AND action IN ('create', 'read', 'update', 'send', 'convert')
ON CONFLICT DO NOTHING;

-- DJ: Solo su perfil y eventos
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'dj'),
    id
FROM permissions
WHERE (resource = 'eventos' AND action = 'read')
   OR (resource = 'djs' AND action IN ('read', 'update', 'manage_availability'))
   OR (resource = 'financial' AND action = 'read')
   OR (resource = 'notifications' AND action = 'read')
ON CONFLICT DO NOTHING;

-- Client: Solo ver sus eventos y pagos
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'client'),
    id
FROM permissions
WHERE (resource = 'eventos' AND action = 'read')
   OR (resource = 'financial' AND action = 'read')
   OR (resource = 'notifications' AND action = 'read')
ON CONFLICT DO NOTHING;

-- Viewer: Solo lectura básica
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    id
FROM permissions
WHERE action = 'read'
  AND resource IN ('eventos', 'djs', 'statistics')
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VISTAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vista: role_permissions_summary
CREATE OR REPLACE VIEW role_permissions_summary AS
SELECT
    r.id as role_id,
    r.name as role_name,
    r.display_name,
    r.level,
    COUNT(rp.permission_id) as total_permissions,
    COUNT(DISTINCT p.resource) as total_resources,
    array_agg(DISTINCT p.resource ORDER BY p.resource) as resources
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.display_name, r.level
ORDER BY r.level DESC;

-- Vista: user_roles_summary
CREATE OR REPLACE VIEW user_roles_summary AS
SELECT
    u.id as user_id,
    u.email,
    array_agg(DISTINCT r.name ORDER BY r.name) as roles,
    array_agg(DISTINCT r.display_name ORDER BY r.display_name) as role_names,
    MAX(r.level) as max_level,
    COUNT(DISTINCT ur.role_id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
GROUP BY u.id, u.email;

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
