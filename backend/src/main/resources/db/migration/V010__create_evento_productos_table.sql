-- ============================================================================
-- Migración V010: Tabla de productos para eventos
-- ============================================================================
-- Descripción: Vincula productos con eventos para gestión de inventario automática
-- Autor: Club Management System
-- Fecha: 2025-01-09
-- ============================================================================

CREATE TABLE evento_productos (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad_planificada DECIMAL(10, 2) NOT NULL,
    cantidad_consumida DECIMAL(10, 2) DEFAULT 0.00,
    movimiento_generado BOOLEAN DEFAULT FALSE NOT NULL
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_evento_productos_evento ON evento_productos(evento_id);
CREATE INDEX idx_evento_productos_producto ON evento_productos(producto_id);
CREATE INDEX idx_evento_productos_movimiento ON evento_productos(movimiento_generado);

-- Restricción única para evitar duplicados
CREATE UNIQUE INDEX idx_evento_productos_unique ON evento_productos(evento_id, producto_id);

COMMENT ON TABLE evento_productos IS 'Productos planificados/consumidos por evento';
COMMENT ON COLUMN evento_productos.cantidad_planificada IS 'Cantidad estimada a consumir';
COMMENT ON COLUMN evento_productos.cantidad_consumida IS 'Cantidad realmente consumida';
COMMENT ON COLUMN evento_productos.movimiento_generado IS 'Indica si ya se generó el movimiento de stock';
