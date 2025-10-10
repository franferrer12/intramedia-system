-- =====================================================
-- MIGRACIÓN V016: Sistema POS - Sesiones de Venta
-- =====================================================

CREATE TABLE sesiones_venta (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('ABIERTA', 'CERRADA', 'CANCELADA')),
    empleado_id BIGINT,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_items DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fecha_apertura TIMESTAMP NOT NULL,
    fecha_cierre TIMESTAMP,
    notas VARCHAR(500),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP,
    CONSTRAINT fk_sesion_empleado FOREIGN KEY (empleado_id)
        REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE INDEX idx_sesiones_codigo ON sesiones_venta(codigo);
CREATE INDEX idx_sesiones_estado ON sesiones_venta(estado);
CREATE INDEX idx_sesiones_empleado ON sesiones_venta(empleado_id);
CREATE INDEX idx_sesiones_fecha_apertura ON sesiones_venta(fecha_apertura);
CREATE INDEX idx_sesiones_fecha_cierre ON sesiones_venta(fecha_cierre);

CREATE TABLE consumos_sesion (
    id BIGSERIAL PRIMARY KEY,
    sesion_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    producto_nombre VARCHAR(100) NOT NULL,
    producto_categoria VARCHAR(50),
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tipo_venta VARCHAR(20),
    notas VARCHAR(500),
    fecha_consumo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registrado_por VARCHAR(50),
    CONSTRAINT fk_consumo_sesion FOREIGN KEY (sesion_id)
        REFERENCES sesiones_venta(id) ON DELETE CASCADE,
    CONSTRAINT fk_consumo_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT
);

CREATE INDEX idx_consumos_sesion ON consumos_sesion(sesion_id);
CREATE INDEX idx_consumos_producto ON consumos_sesion(producto_id);
CREATE INDEX idx_consumos_fecha ON consumos_sesion(fecha_consumo);
CREATE INDEX idx_consumos_registrado_por ON consumos_sesion(registrado_por);
