-- Tabla de productos
CREATE TABLE productos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    proveedor_id BIGINT,
    precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_actual DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_maximo DECIMAL(10, 2),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    perecedero BOOLEAN NOT NULL DEFAULT FALSE,
    dias_caducidad INTEGER,
    imagen_url VARCHAR(500),
    notas TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- Tabla de movimientos de stock
CREATE TABLE movimientos_stock (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    stock_anterior DECIMAL(10, 2) NOT NULL,
    stock_nuevo DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(10, 2),
    costo_total DECIMAL(10, 2),
    motivo VARCHAR(100),
    referencia VARCHAR(100),
    evento_id BIGINT,
    proveedor_id BIGINT,
    usuario_id BIGINT,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimiento_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL,
    CONSTRAINT fk_movimiento_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_tipo_movimiento CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'DEVOLUCION', 'TRASPASO', 'INVENTARIO'))
);

-- Tabla de inventarios (conteos físicos)
CREATE TABLE inventarios (
    id BIGSERIAL PRIMARY KEY,
    fecha_inventario DATE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    usuario_responsable_id BIGINT,
    fecha_cierre TIMESTAMP,
    observaciones TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventario_usuario FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_estado_inventario CHECK (estado IN ('ABIERTO', 'EN_PROCESO', 'CERRADO', 'CANCELADO'))
);

-- Tabla de detalles de inventario
CREATE TABLE detalles_inventario (
    id BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    stock_sistema DECIMAL(10, 2) NOT NULL,
    stock_fisico DECIMAL(10, 2),
    diferencia DECIMAL(10, 2),
    precio_unitario DECIMAL(10, 2),
    costo_diferencia DECIMAL(10, 2),
    observaciones TEXT,
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_inventario FOREIGN KEY (inventario_id) REFERENCES inventarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT uk_inventario_producto UNIQUE (inventario_id, producto_id)
);

-- Tabla de alertas de stock
CREATE TABLE alertas_stock (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    nivel VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_alerta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_lectura TIMESTAMP,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_alerta_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT chk_tipo_alerta CHECK (tipo_alerta IN ('STOCK_BAJO', 'STOCK_CRITICO', 'STOCK_CERO', 'PRODUCTO_CADUCADO', 'PRODUCTO_POR_CADUCAR')),
    CONSTRAINT chk_nivel_alerta CHECK (nivel IN ('INFO', 'WARNING', 'CRITICAL'))
);

-- Índices para optimizar consultas
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_stock ON productos(stock_actual);
CREATE INDEX idx_productos_codigo ON productos(codigo);

CREATE INDEX idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_tipo ON movimientos_stock(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON movimientos_stock(fecha_movimiento);
CREATE INDEX idx_movimientos_evento ON movimientos_stock(evento_id);
CREATE INDEX idx_movimientos_usuario ON movimientos_stock(usuario_id);

CREATE INDEX idx_inventarios_fecha ON inventarios(fecha_inventario);
CREATE INDEX idx_inventarios_estado ON inventarios(estado);
CREATE INDEX idx_inventarios_usuario ON inventarios(usuario_responsable_id);

CREATE INDEX idx_detalles_inventario ON detalles_inventario(inventario_id);
CREATE INDEX idx_detalles_producto ON detalles_inventario(producto_id);

CREATE INDEX idx_alertas_producto ON alertas_stock(producto_id);
CREATE INDEX idx_alertas_activa ON alertas_stock(activa);
CREATE INDEX idx_alertas_leida ON alertas_stock(leida);

-- Datos de ejemplo: Categorías de productos comunes en un club
COMMENT ON TABLE productos IS 'Productos del inventario del club (bebidas, alimentos, merchandising, etc)';
COMMENT ON TABLE movimientos_stock IS 'Historial de todos los movimientos de stock (entradas, salidas, ajustes, mermas)';
COMMENT ON TABLE inventarios IS 'Registros de inventarios físicos realizados';
COMMENT ON TABLE detalles_inventario IS 'Detalle de cada producto contado en un inventario';
COMMENT ON TABLE alertas_stock IS 'Alertas automáticas de stock bajo, productos caducados, etc';
