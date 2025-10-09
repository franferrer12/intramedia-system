-- ============================================================================
-- Migración V001: Tablas base del sistema
-- ============================================================================
-- Descripción: Crea las tablas fundamentales (usuarios, categorías, proveedores)
-- Autor: Club Management System
-- Fecha: 2025-01-06
-- ============================================================================

-- Tabla de categorías de producto
CREATE TABLE categorias_producto (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categorias_producto IS 'Categorías para clasificar productos del inventario';
COMMENT ON COLUMN categorias_producto.nombre IS 'Nombre único de la categoría (ej: Whisky, Vodka, Refrescos)';

-- Tabla de proveedores
CREATE TABLE proveedores (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    cif VARCHAR(20) UNIQUE,
    categoria VARCHAR(50),
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    condiciones_pago TEXT,
    plazo_entrega_dias INTEGER,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE proveedores IS 'Proveedores de productos y servicios';
COMMENT ON COLUMN proveedores.categoria IS 'Categoría del proveedor: BEBIDAS, CONSUMIBLES, SERVICIOS, LIMPIEZA, TECNICO, MARKETING';

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con sus roles y permisos';
COMMENT ON COLUMN usuarios.rol IS 'Rol del usuario: ADMIN, GERENTE, ENCARGADO, RRHH, LECTURA';
COMMENT ON COLUMN usuarios.password IS 'Contraseña hasheada con BCrypt';

-- Índices para optimizar búsquedas
CREATE INDEX idx_categorias_activo ON categorias_producto(activo);
CREATE INDEX idx_proveedores_activo ON proveedores(activo);
CREATE INDEX idx_proveedores_categoria ON proveedores(categoria);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Datos iniciales: Categorías de producto comunes
INSERT INTO categorias_producto (nombre, descripcion) VALUES
    ('Whisky', 'Whisky y bourbon'),
    ('Vodka', 'Vodkas nacionales e importados'),
    ('Ron', 'Rones blancos y oscuros'),
    ('Ginebra', 'Ginebras premium y estándar'),
    ('Tequila', 'Tequilas y mezcales'),
    ('Licores', 'Licores diversos'),
    ('Cerveza', 'Cervezas nacionales e importadas'),
    ('Vino', 'Vinos tintos, blancos y rosados'),
    ('Champagne', 'Champagne y espumosos'),
    ('Refrescos', 'Refrescos y bebidas sin alcohol'),
    ('Energéticas', 'Bebidas energéticas'),
    ('Agua', 'Agua mineral y con gas'),
    ('Jugos', 'Jugos y néctares'),
    ('Hielo', 'Hielo en bolsas'),
    ('Consumibles', 'Vasos, pajitas, servilletas, etc.');

-- Usuario administrador por defecto (password: password)
-- Contraseña hasheada con BCrypt strength 10
INSERT INTO usuarios (username, password, email, rol) VALUES
    ('admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'admin@clubmanagement.com', 'ADMIN');

COMMENT ON TABLE usuarios IS 'Usuario inicial: admin / admin123 (CAMBIAR PASSWORD EN PRODUCCIÓN)';
