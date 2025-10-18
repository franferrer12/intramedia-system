-- V032: Sistema de Pedidos a Proveedores
-- Fecha: 2025-01-18
-- Descripción: Tablas para gestión de pedidos y recepción automática de stock

-- Enum para estados de pedido
CREATE TYPE estado_pedido AS ENUM (
    'BORRADOR',       -- Pedido en creación
    'ENVIADO',        -- Enviado al proveedor
    'CONFIRMADO',     -- Confirmado por proveedor
    'EN_TRANSITO',    -- En camino
    'RECIBIDO',       -- Recibido y procesado
    'PARCIAL',        -- Recibido parcialmente
    'CANCELADO'       -- Cancelado
);

-- Tabla principal de pedidos
CREATE TABLE pedidos (
    id BIGSERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    proveedor_id BIGINT NOT NULL REFERENCES proveedores(id),
    estado estado_pedido NOT NULL DEFAULT 'BORRADOR',

    -- Fechas
    fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_esperada DATE,
    fecha_recepcion TIMESTAMP,

    -- Montos
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    impuestos DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Información adicional
    notas TEXT,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    recepcionado_por BIGINT REFERENCES usuarios(id),
    transaccion_id BIGINT REFERENCES transacciones(id),

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalle de pedidos
CREATE TABLE detalle_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id),

    -- Cantidades
    cantidad_pedida DECIMAL(10, 2) NOT NULL,
    cantidad_recibida DECIMAL(10, 2) DEFAULT 0,

    -- Precios
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,

    -- Información adicional
    notas TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT detalle_pedido_unique UNIQUE (pedido_id, producto_id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_pedidos_proveedor ON pedidos(proveedor_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha_pedido ON pedidos(fecha_pedido);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_detalle_pedido_pedido ON detalle_pedido(pedido_id);
CREATE INDEX idx_detalle_pedido_producto ON detalle_pedido(producto_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_pedidos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedidos_updated_at_trigger
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_pedidos_timestamp();

CREATE TRIGGER detalle_pedido_updated_at_trigger
    BEFORE UPDATE ON detalle_pedido
    FOR EACH ROW
    EXECUTE FUNCTION update_pedidos_timestamp();

-- Trigger para generar número de pedido automáticamente
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
    contador INT;
    fecha_actual VARCHAR(8);
BEGIN
    IF NEW.numero_pedido IS NULL THEN
        fecha_actual := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

        -- Contar pedidos del día
        SELECT COALESCE(COUNT(*) + 1, 1) INTO contador
        FROM pedidos
        WHERE numero_pedido LIKE 'PED-' || fecha_actual || '-%';

        -- Generar número: PED-YYYYMMDD-NNNN
        NEW.numero_pedido := 'PED-' || fecha_actual || '-' || LPAD(contador::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generar_numero_pedido_trigger
    BEFORE INSERT ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION generar_numero_pedido();

-- Comentarios para documentación
COMMENT ON TABLE pedidos IS 'Pedidos realizados a proveedores';
COMMENT ON TABLE detalle_pedido IS 'Detalle de productos en cada pedido';
COMMENT ON COLUMN pedidos.numero_pedido IS 'Número único de pedido formato PED-YYYYMMDD-NNNN';
COMMENT ON COLUMN pedidos.estado IS 'Estado actual del pedido en su ciclo de vida';
COMMENT ON COLUMN pedidos.transaccion_id IS 'Transacción financiera generada al recepcionar (gasto)';
COMMENT ON COLUMN detalle_pedido.cantidad_recibida IS 'Cantidad realmente recibida (puede diferir de la pedida)';
