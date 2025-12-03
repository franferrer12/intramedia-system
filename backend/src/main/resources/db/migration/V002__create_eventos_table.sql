-- ============================================================================
-- Migración V002: Tabla de eventos
-- ============================================================================
-- Descripción: Crea la tabla de eventos para gestionar fiestas/conciertos
-- Autor: Club Management System
-- Fecha: 2025-01-06
-- ============================================================================

-- Tabla de eventos
CREATE TABLE eventos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    tipo VARCHAR(50) NOT NULL,
    aforo_esperado INTEGER,
    aforo_real INTEGER,
    estado VARCHAR(50) NOT NULL DEFAULT 'PLANIFICADO',
    artista VARCHAR(255),
    cache_artista DECIMAL(10, 2),
    ingresos_estimados DECIMAL(10, 2),
    gastos_estimados DECIMAL(10, 2),
    ingresos_reales DECIMAL(10, 2) DEFAULT 0,
    gastos_reales DECIMAL(10, 2) DEFAULT 0,
    descripcion VARCHAR(1000),
    notas VARCHAR(500),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE eventos IS 'Eventos/fiestas organizados en la discoteca';
COMMENT ON COLUMN eventos.tipo IS 'Tipo de evento: REGULAR, ESPECIAL, CONCIERTO, PRIVADO, TEMATICO';
COMMENT ON COLUMN eventos.estado IS 'Estado: PLANIFICADO, CONFIRMADO, EN_CURSO, FINALIZADO, CANCELADO';

-- Índices para optimizar búsquedas
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_estado ON eventos(estado);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
CREATE INDEX idx_eventos_fecha_estado ON eventos(fecha, estado);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar automáticamente actualizado_en
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de prueba (eventos de ejemplo)
INSERT INTO eventos (nombre, fecha, hora_inicio, hora_fin, tipo, aforo_esperado, estado, descripcion) VALUES
    ('Viernes de Apertura', '2025-01-10', '23:00', '05:00', 'REGULAR', 300, 'CONFIRMADO', 'Evento de apertura de año'),
    ('Noche Electrónica', '2025-01-17', '23:30', '06:00', 'CONCIERTO', 400, 'PLANIFICADO', 'DJ internacional'),
    ('Sábado Temático - 80s', '2025-01-25', '22:00', '05:00', 'TEMATICO', 350, 'PLANIFICADO', 'Fiesta temática años 80');

COMMENT ON TABLE eventos IS 'Eventos creados con datos de ejemplo para testing';
