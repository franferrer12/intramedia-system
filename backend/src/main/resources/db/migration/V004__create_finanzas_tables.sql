-- Tabla de Categorías de Transacción
CREATE TABLE categorias_transaccion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'GASTO')),
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para categorías
CREATE INDEX idx_categorias_transaccion_tipo ON categorias_transaccion(tipo);
CREATE INDEX idx_categorias_transaccion_activa ON categorias_transaccion(activa);

-- Tabla de Transacciones
CREATE TABLE transacciones (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'GASTO')),
    categoria_id BIGINT NOT NULL REFERENCES categorias_transaccion(id),
    evento_id BIGINT REFERENCES eventos(id),
    fecha DATE NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    metodo_pago VARCHAR(50),
    referencia VARCHAR(100),
    proveedor_id BIGINT REFERENCES proveedores(id),
    notas TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para transacciones
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX idx_transacciones_categoria ON transacciones(categoria_id);
CREATE INDEX idx_transacciones_evento ON transacciones(evento_id);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_transacciones_proveedor ON transacciones(proveedor_id);

-- Categorías por defecto para INGRESOS
INSERT INTO categorias_transaccion (nombre, tipo, descripcion) VALUES
('Venta de Entradas', 'INGRESO', 'Ingresos por venta de entradas'),
('Venta de Bebidas', 'INGRESO', 'Ingresos por venta de bebidas en barra'),
('Venta de Comida', 'INGRESO', 'Ingresos por venta de alimentos'),
('Reservas VIP', 'INGRESO', 'Ingresos por reservas de mesas VIP'),
('Guardarropa', 'INGRESO', 'Ingresos por servicio de guardarropa'),
('Merchandising', 'INGRESO', 'Venta de productos de la marca'),
('Eventos Privados', 'INGRESO', 'Ingresos por eventos privados'),
('Otros Ingresos', 'INGRESO', 'Otros ingresos varios');

-- Categorías por defecto para GASTOS
INSERT INTO categorias_transaccion (nombre, tipo, descripcion) VALUES
('Caché Artista', 'GASTO', 'Pago a artistas y DJs'),
('Compra de Bebidas', 'GASTO', 'Compra de stock de bebidas'),
('Compra de Comida', 'GASTO', 'Compra de stock de alimentos'),
('Alquiler Local', 'GASTO', 'Pago de alquiler del local'),
('Servicios Básicos', 'GASTO', 'Luz, agua, gas, internet'),
('Nóminas Personal', 'GASTO', 'Pago de salarios al personal'),
('Seguridad', 'GASTO', 'Servicio de seguridad'),
('Limpieza', 'GASTO', 'Servicio de limpieza'),
('Marketing', 'GASTO', 'Publicidad y promoción'),
('Mantenimiento', 'GASTO', 'Reparaciones y mantenimiento'),
('Equipamiento', 'GASTO', 'Compra de equipamiento técnico'),
('Licencias', 'GASTO', 'Licencias, permisos y tasas'),
('Seguros', 'GASTO', 'Seguros del local y responsabilidad civil'),
('Otros Gastos', 'GASTO', 'Otros gastos varios');

-- Transacciones de ejemplo
INSERT INTO transacciones (tipo, categoria_id, fecha, concepto, monto, metodo_pago) VALUES
('INGRESO', 1, CURRENT_DATE - INTERVAL '7 days', 'Venta de entradas evento fin de semana', 2500.00, 'Efectivo'),
('INGRESO', 2, CURRENT_DATE - INTERVAL '7 days', 'Venta de bebidas en barra', 1800.00, 'Mixto'),
('GASTO', 11, CURRENT_DATE - INTERVAL '10 days', 'Pago DJ residente', 500.00, 'Transferencia'),
('GASTO', 12, CURRENT_DATE - INTERVAL '5 days', 'Reposición stock bebidas', 800.00, 'Transferencia');
