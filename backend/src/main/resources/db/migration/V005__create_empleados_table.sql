-- Tabla de Empleados
CREATE TABLE empleados (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(50),
    fecha_alta DATE NOT NULL,
    fecha_baja DATE,
    salario_base DECIMAL(10, 2) NOT NULL CHECK (salario_base >= 0),
    tipo_contrato VARCHAR(50),
    num_seguridad_social VARCHAR(50),
    cuenta_bancaria VARCHAR(34),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    notas TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para empleados
CREATE INDEX idx_empleados_activo ON empleados(activo);
CREATE INDEX idx_empleados_cargo ON empleados(cargo);
CREATE INDEX idx_empleados_departamento ON empleados(departamento);
CREATE INDEX idx_empleados_dni ON empleados(dni);
CREATE INDEX idx_empleados_fecha_alta ON empleados(fecha_alta);

-- Empleados de ejemplo
INSERT INTO empleados (nombre, apellidos, dni, email, telefono, cargo, departamento, fecha_alta, salario_base, tipo_contrato, activo) VALUES
('Carlos', 'García López', '12345678A', 'carlos.garcia@club.com', '+34 600 111 222', 'Gerente', 'ADMINISTRACION', CURRENT_DATE - INTERVAL '2 years', 3500.00, 'INDEFINIDO', true),
('María', 'Fernández Ruiz', '87654321B', 'maria.fernandez@club.com', '+34 600 333 444', 'DJ Residente', 'ENTRETENIMIENTO', CURRENT_DATE - INTERVAL '1 year', 2000.00, 'INDEFINIDO', true),
('Juan', 'Martínez Sánchez', '11223344C', 'juan.martinez@club.com', '+34 600 555 666', 'Camarero', 'BARRA', CURRENT_DATE - INTERVAL '6 months', 1400.00, 'TEMPORAL', true),
('Laura', 'González Pérez', '44332211D', 'laura.gonzalez@club.com', '+34 600 777 888', 'Seguridad', 'SEGURIDAD', CURRENT_DATE - INTERVAL '8 months', 1600.00, 'INDEFINIDO', true),
('Pedro', 'López Díaz', '55667788E', 'pedro.lopez@club.com', '+34 600 999 000', 'Limpieza', 'LIMPIEZA', CURRENT_DATE - INTERVAL '3 months', 1200.00, 'TEMPORAL', true);
