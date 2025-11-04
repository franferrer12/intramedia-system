-- Intra Media System - Database Schema
-- PostgreSQL 15+

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: DJs
CREATE TABLE djs (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255), -- Para login en el portal
    activo BOOLEAN DEFAULT true,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Clientes/Locales
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    ciudad VARCHAR(100),
    contacto VARCHAR(100),
    email VARCHAR(255),
    telefono VARCHAR(20),
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Categorías de Eventos
CREATE TABLE categorias_evento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) -- Hex color para UI
);

-- Insertar categorías del Excel
INSERT INTO categorias_evento (nombre, color) VALUES
('Discoteca', '#3B82F6'),
('Pub', '#10B981'),
('Cumpleaños', '#F59E0B'),
('Boda', '#EC4899'),
('Corporativo', '#8B5CF6'),
('Festival', '#EF4444'),
('Privado', '#6366F1'),
('Otro', '#6B7280');

-- Tabla: Eventos
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    mes VARCHAR(20) NOT NULL, -- ENERO, FEBRERO, etc.
    dj_id INTEGER REFERENCES djs(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    evento VARCHAR(200) NOT NULL, -- Nombre del evento
    ciudad_lugar VARCHAR(200),
    categoria_id INTEGER REFERENCES categorias_evento(id),

    -- Horarios
    horas DECIMAL(4,2),

    -- Financiero
    cache_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    parte_dj DECIMAL(10,2) NOT NULL DEFAULT 0,
    parte_agencia DECIMAL(10,2) NOT NULL DEFAULT 0,
    euro_hora_dj DECIMAL(10,2), -- Auto-calculado

    -- Reservas/Adelantos
    reserva DECIMAL(10,2) DEFAULT 0,

    -- Estados de pago
    cobrado_cliente BOOLEAN DEFAULT false,
    fecha_cobro_cliente DATE,
    pagado_dj BOOLEAN DEFAULT false,
    fecha_pago_dj DATE,

    -- Observaciones
    observaciones TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pagos a DJs (Histórico/Nóminas)
CREATE TABLE pagos_djs (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER REFERENCES djs(id) ON DELETE CASCADE,
    mes VARCHAR(20) NOT NULL,
    anio INTEGER NOT NULL,
    importe DECIMAL(10,2) NOT NULL,
    total_eventos INTEGER DEFAULT 0,
    media_por_evento DECIMAL(10,2),
    metodo_pago VARCHAR(50), -- Transferencia, Bizum, Efectivo
    fecha_pago DATE,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pagos de Clientes (Histórico)
CREATE TABLE pagos_clientes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    mes VARCHAR(20) NOT NULL,
    anio INTEGER NOT NULL,
    importe DECIMAL(10,2) NOT NULL,
    fecha_pago DATE,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado
    metodo_pago VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Usuarios del sistema (Admin)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    rol VARCHAR(20) DEFAULT 'admin', -- admin, manager
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Notificaciones
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- pago_pendiente, evento_proximo, etc.
    destinatario_tipo VARCHAR(20), -- dj, admin
    destinatario_id INTEGER,
    titulo VARCHAR(200),
    mensaje TEXT,
    leida BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_mes ON eventos(mes);
CREATE INDEX idx_eventos_dj ON eventos(dj_id);
CREATE INDEX idx_eventos_cliente ON eventos(cliente_id);
CREATE INDEX idx_pagos_djs_mes ON pagos_djs(mes, anio);
CREATE INDEX idx_pagos_clientes_estado ON pagos_clientes(estado);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_djs_updated_at BEFORE UPDATE ON djs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular €/h DJ automáticamente
CREATE OR REPLACE FUNCTION calcular_euro_hora_dj()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.horas > 0 THEN
        NEW.euro_hora_dj = NEW.parte_dj / NEW.horas;
    ELSE
        NEW.euro_hora_dj = 0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calcular_euro_hora BEFORE INSERT OR UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION calcular_euro_hora_dj();

-- Insertar usuario admin por defecto
-- Password: admin123 (cambiar en producción)
INSERT INTO usuarios (username, email, password_hash, nombre, rol) VALUES
('admin', 'admin@intramedia.com', '$2b$10$rZ8YvZ9C.vZ9C.vZ9C.vZ9C.vZ9C.vZ9C.vZ9C.vZ9C.vZ9C.vZ9C', 'Administrador', 'admin');

-- Comentarios
COMMENT ON TABLE eventos IS 'Registro completo de eventos/bolos de DJs';
COMMENT ON TABLE pagos_djs IS 'Histórico de pagos realizados a DJs (nóminas)';
COMMENT ON TABLE pagos_clientes IS 'Histórico de cobros de clientes';
COMMENT ON COLUMN eventos.euro_hora_dj IS 'Calculado automáticamente: parte_dj / horas';
