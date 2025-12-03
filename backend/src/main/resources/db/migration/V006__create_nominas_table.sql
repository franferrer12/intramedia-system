-- V006: Crear tabla de nóminas
-- Fecha: 2025-01-06

CREATE TABLE nominas (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT NOT NULL,
    periodo VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    fecha_pago DATE NOT NULL,
    salario_base DECIMAL(10, 2) NOT NULL,
    horas_extra DECIMAL(5, 2) DEFAULT 0,
    precio_hora_extra DECIMAL(10, 2) DEFAULT 0,
    bonificaciones DECIMAL(10, 2) DEFAULT 0,
    deducciones DECIMAL(10, 2) DEFAULT 0,
    salario_bruto DECIMAL(10, 2) NOT NULL,
    seguridad_social DECIMAL(10, 2) NOT NULL,
    irpf DECIMAL(10, 2) NOT NULL,
    otras_retenciones DECIMAL(10, 2) DEFAULT 0,
    salario_neto DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADA, CANCELADA
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),
    notas TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_nomina_empleado FOREIGN KEY (empleado_id)
        REFERENCES empleados(id) ON DELETE RESTRICT,
    CONSTRAINT chk_nomina_periodo CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT chk_nomina_salarios CHECK (salario_base >= 0 AND salario_bruto >= 0 AND salario_neto >= 0),
    CONSTRAINT chk_nomina_estado CHECK (estado IN ('PENDIENTE', 'PAGADA', 'CANCELADA')),
    CONSTRAINT uk_nomina_empleado_periodo UNIQUE (empleado_id, periodo)
);

-- Índices
CREATE INDEX idx_nominas_empleado_id ON nominas(empleado_id);
CREATE INDEX idx_nominas_periodo ON nominas(periodo);
CREATE INDEX idx_nominas_fecha_pago ON nominas(fecha_pago);
CREATE INDEX idx_nominas_estado ON nominas(estado);
CREATE INDEX idx_nominas_empleado_periodo ON nominas(empleado_id, periodo);

-- Comentarios
COMMENT ON TABLE nominas IS 'Registro de nóminas mensuales de empleados';
COMMENT ON COLUMN nominas.periodo IS 'Periodo de la nómina en formato YYYY-MM';
COMMENT ON COLUMN nominas.salario_base IS 'Salario base del empleado para ese mes';
COMMENT ON COLUMN nominas.horas_extra IS 'Número de horas extra trabajadas';
COMMENT ON COLUMN nominas.precio_hora_extra IS 'Precio por hora extra';
COMMENT ON COLUMN nominas.bonificaciones IS 'Bonificaciones adicionales (rendimiento, asistencia, etc.)';
COMMENT ON COLUMN nominas.deducciones IS 'Deducciones adicionales (anticipos, sanciones, etc.)';
COMMENT ON COLUMN nominas.salario_bruto IS 'Salario bruto = base + extras + bonificaciones - deducciones';
COMMENT ON COLUMN nominas.seguridad_social IS 'Retención por Seguridad Social (ejemplo: 6.35%)';
COMMENT ON COLUMN nominas.irpf IS 'Retención IRPF (ejemplo: 15%)';
COMMENT ON COLUMN nominas.salario_neto IS 'Salario neto = bruto - SS - IRPF - otras retenciones';

-- Insertar nóminas de ejemplo para enero 2025
INSERT INTO nominas (empleado_id, periodo, fecha_pago, salario_base, horas_extra, precio_hora_extra,
                     bonificaciones, deducciones, salario_bruto, seguridad_social, irpf,
                     otras_retenciones, salario_neto, estado, metodo_pago, notas) VALUES
-- Nómina 1: Carlos García (Gerente)
(1, '2025-01', '2025-01-31', 3500.00, 0, 0, 200.00, 0, 3700.00, 234.95, 555.00, 0, 2910.05, 'PAGADA', 'TRANSFERENCIA', 'Bonificación por cumplimiento de objetivos'),

-- Nómina 2: María López (Jefa de Seguridad)
(2, '2025-01', '2025-01-31', 2800.00, 10, 20.00, 0, 0, 3000.00, 190.50, 450.00, 0, 2359.50, 'PAGADA', 'TRANSFERENCIA', 'Horas extra durante eventos especiales'),

-- Nómina 3: Juan Martínez (Barman)
(3, '2025-01', '2025-01-31', 1800.00, 15, 15.00, 100.00, 0, 2125.00, 134.94, 318.75, 0, 1671.31, 'PAGADA', 'TRANSFERENCIA', 'Bonificación por evaluación del mes'),

-- Nómina 4: Ana Fernández (Camarera)
(4, '2025-01', '2025-01-31', 1500.00, 12, 12.00, 0, 50.00, 1594.00, 101.22, 239.10, 0, 1253.68, 'PAGADA', 'TRANSFERENCIA', 'Deducción por anticipo'),

-- Nómina 5: Pedro Sánchez (DJ)
(5, '2025-01', '2025-01-31', 2200.00, 8, 25.00, 150.00, 0, 2550.00, 161.93, 382.50, 0, 2005.57, 'PAGADA', 'TRANSFERENCIA', 'Bonificación por evento especial');
