-- V007: Crear tabla de jornadas de trabajo
-- Fecha: 2025-01-06

CREATE TABLE jornadas_trabajo (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    horas_trabajadas DECIMAL(5, 2) NOT NULL CHECK (horas_trabajadas >= 0),
    precio_hora DECIMAL(10, 2) NOT NULL CHECK (precio_hora >= 0),
    total_pago DECIMAL(10, 2) NOT NULL CHECK (total_pago >= 0),
    pagado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_pago DATE,
    metodo_pago VARCHAR(50) DEFAULT 'EFECTIVO',
    evento_id BIGINT,
    notas TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jornada_empleado FOREIGN KEY (empleado_id)
        REFERENCES empleados(id) ON DELETE RESTRICT,
    CONSTRAINT fk_jornada_evento FOREIGN KEY (evento_id)
        REFERENCES eventos(id) ON DELETE SET NULL,
    CONSTRAINT chk_jornada_fecha_pago CHECK (fecha_pago IS NULL OR fecha_pago >= fecha)
);

-- Índices
CREATE INDEX idx_jornadas_empleado_id ON jornadas_trabajo(empleado_id);
CREATE INDEX idx_jornadas_fecha ON jornadas_trabajo(fecha);
CREATE INDEX idx_jornadas_pagado ON jornadas_trabajo(pagado);
CREATE INDEX idx_jornadas_empleado_fecha ON jornadas_trabajo(empleado_id, fecha);
CREATE INDEX idx_jornadas_fecha_rango ON jornadas_trabajo(fecha DESC);
CREATE INDEX idx_jornadas_evento_id ON jornadas_trabajo(evento_id);

-- Comentarios
COMMENT ON TABLE jornadas_trabajo IS 'Registro de turnos/jornadas trabajadas por empleados';
COMMENT ON COLUMN jornadas_trabajo.fecha IS 'Fecha de la jornada laboral';
COMMENT ON COLUMN jornadas_trabajo.hora_inicio IS 'Hora de inicio del turno';
COMMENT ON COLUMN jornadas_trabajo.hora_fin IS 'Hora de finalización del turno';
COMMENT ON COLUMN jornadas_trabajo.horas_trabajadas IS 'Total de horas trabajadas en la jornada';
COMMENT ON COLUMN jornadas_trabajo.precio_hora IS 'Precio por hora para esta jornada';
COMMENT ON COLUMN jornadas_trabajo.total_pago IS 'Total a pagar = horas_trabajadas * precio_hora';
COMMENT ON COLUMN jornadas_trabajo.pagado IS 'Indica si la jornada ya fue pagada';
COMMENT ON COLUMN jornadas_trabajo.fecha_pago IS 'Fecha en que se realizó el pago';
COMMENT ON COLUMN jornadas_trabajo.metodo_pago IS 'Método de pago (EFECTIVO, TRANSFERENCIA, etc.)';
COMMENT ON COLUMN jornadas_trabajo.evento_id IS 'Evento relacionado con la jornada (opcional)';

-- Insertar jornadas de ejemplo para enero 2025
INSERT INTO jornadas_trabajo (empleado_id, fecha, hora_inicio, hora_fin, horas_trabajadas,
                               precio_hora, total_pago, pagado, fecha_pago, metodo_pago, notas) VALUES
-- Jornadas de Ana Fernández (Camarera) - Semana 1
(4, '2025-01-03', '20:00:00', '03:00:00', 7.00, 12.00, 84.00, true, '2025-01-04', 'EFECTIVO', 'Turno viernes noche'),
(4, '2025-01-04', '20:00:00', '04:00:00', 8.00, 12.00, 96.00, true, '2025-01-05', 'EFECTIVO', 'Turno sábado noche'),
(4, '2025-01-05', '19:00:00', '02:00:00', 7.00, 12.00, 84.00, true, '2025-01-06', 'EFECTIVO', 'Turno domingo'),

-- Jornadas de María López (Jefa de Seguridad) - Semana 1
(2, '2025-01-03', '21:00:00', '05:00:00', 8.00, 20.00, 160.00, true, '2025-01-04', 'EFECTIVO', 'Supervisión viernes'),
(2, '2025-01-04', '21:00:00', '06:00:00', 9.00, 20.00, 180.00, true, '2025-01-05', 'EFECTIVO', 'Supervisión sábado'),
(2, '2025-01-05', '20:00:00', '04:00:00', 8.00, 20.00, 160.00, true, '2025-01-06', 'EFECTIVO', 'Supervisión domingo'),

-- Jornadas de Ana Fernández (Camarera) - Semana 2
(4, '2025-01-10', '20:00:00', '03:00:00', 7.00, 12.00, 84.00, true, '2025-01-11', 'EFECTIVO', 'Turno viernes noche'),
(4, '2025-01-11', '20:00:00', '04:00:00', 8.00, 12.00, 96.00, true, '2025-01-12', 'EFECTIVO', 'Turno sábado noche'),
(4, '2025-01-12', '19:00:00', '02:00:00', 7.00, 12.00, 84.00, true, '2025-01-13', 'EFECTIVO', 'Turno domingo'),

-- Jornadas de María López (Jefa de Seguridad) - Semana 2
(2, '2025-01-10', '21:00:00', '05:00:00', 8.00, 20.00, 160.00, true, '2025-01-11', 'EFECTIVO', 'Supervisión viernes'),
(2, '2025-01-11', '21:00:00', '06:00:00', 9.00, 20.00, 180.00, true, '2025-01-12', 'EFECTIVO', 'Supervisión sábado'),
(2, '2025-01-12', '20:00:00', '04:00:00', 8.00, 20.00, 160.00, true, '2025-01-13', 'EFECTIVO', 'Supervisión domingo'),

-- Jornadas pendientes de pago - Semana 3
(4, '2025-01-17', '20:00:00', '03:00:00', 7.00, 12.00, 84.00, false, NULL, 'EFECTIVO', 'Turno viernes noche - Pendiente'),
(4, '2025-01-18', '20:00:00', '04:00:00', 8.00, 12.00, 96.00, false, NULL, 'EFECTIVO', 'Turno sábado noche - Pendiente'),
(2, '2025-01-17', '21:00:00', '05:00:00', 8.00, 20.00, 160.00, false, NULL, 'EFECTIVO', 'Supervisión viernes - Pendiente'),
(2, '2025-01-18', '21:00:00', '06:00:00', 9.00, 20.00, 180.00, false, NULL, 'EFECTIVO', 'Supervisión sábado - Pendiente');
