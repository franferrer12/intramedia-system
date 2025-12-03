-- Tabla de plantillas de pedidos
CREATE TABLE plantillas_pedido (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    proveedor_id BIGINT NOT NULL,

    -- Detalles de la plantilla en JSON (array de productos con cantidades)
    detalles JSONB NOT NULL,

    -- Observaciones por defecto para pedidos generados
    observaciones TEXT,

    -- Configuración
    activa BOOLEAN NOT NULL DEFAULT true,
    creado_por_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_plantilla_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE CASCADE,
    CONSTRAINT fk_plantilla_usuario FOREIGN KEY (creado_por_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de pedidos recurrentes (programados)
CREATE TABLE pedidos_recurrentes (
    id BIGSERIAL PRIMARY KEY,
    plantilla_id BIGINT NOT NULL,

    -- Frecuencia de repetición
    frecuencia VARCHAR(20) NOT NULL, -- 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL'

    -- Configuración específica según frecuencia
    -- Para SEMANAL: día de la semana (1=Lunes, 7=Domingo)
    -- Para QUINCENAL: días del mes (ej: "1,15")
    -- Para MENSUAL: día del mes (1-31)
    -- Para TRIMESTRAL: día del trimestre
    dia_ejecucion INTEGER,
    dias_ejecucion VARCHAR(50), -- Para frecuencias que requieren múltiples días

    -- Hora de generación del pedido (formato HH:mm)
    hora_ejecucion TIME NOT NULL DEFAULT '09:00:00',

    -- Control de ejecución
    proxima_ejecucion TIMESTAMP NOT NULL,
    ultima_ejecucion TIMESTAMP,

    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,

    -- Notificaciones
    notificar_antes_horas INTEGER DEFAULT 24, -- Horas antes de generar para notificar
    emails_notificacion TEXT, -- Emails separados por comas

    -- Auditoría
    creado_por_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recurrente_plantilla FOREIGN KEY (plantilla_id)
        REFERENCES plantillas_pedido(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurrente_usuario FOREIGN KEY (creado_por_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de historial de ejecuciones de pedidos recurrentes
CREATE TABLE ejecuciones_pedido_recurrente (
    id BIGSERIAL PRIMARY KEY,
    pedido_recurrente_id BIGINT NOT NULL,
    pedido_generado_id BIGINT, -- NULL si falló la generación

    fecha_ejecucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exitoso BOOLEAN NOT NULL DEFAULT true,
    mensaje_error TEXT,

    CONSTRAINT fk_ejecucion_recurrente FOREIGN KEY (pedido_recurrente_id)
        REFERENCES pedidos_recurrentes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ejecucion_pedido FOREIGN KEY (pedido_generado_id)
        REFERENCES pedidos(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_plantillas_proveedor ON plantillas_pedido(proveedor_id);
CREATE INDEX idx_plantillas_activa ON plantillas_pedido(activa);
CREATE INDEX idx_plantillas_creador ON plantillas_pedido(creado_por_id);

CREATE INDEX idx_recurrentes_plantilla ON pedidos_recurrentes(plantilla_id);
CREATE INDEX idx_recurrentes_activo ON pedidos_recurrentes(activo);
CREATE INDEX idx_recurrentes_proxima_ejecucion ON pedidos_recurrentes(proxima_ejecucion);
CREATE INDEX idx_recurrentes_frecuencia ON pedidos_recurrentes(frecuencia);

CREATE INDEX idx_ejecuciones_recurrente ON ejecuciones_pedido_recurrente(pedido_recurrente_id);
CREATE INDEX idx_ejecuciones_fecha ON ejecuciones_pedido_recurrente(fecha_ejecucion);
CREATE INDEX idx_ejecuciones_exitoso ON ejecuciones_pedido_recurrente(exitoso);

-- Comentarios para documentación
COMMENT ON TABLE plantillas_pedido IS 'Plantillas reutilizables para crear pedidos rápidamente';
COMMENT ON COLUMN plantillas_pedido.detalles IS 'Array JSON de productos: [{"productoId": 1, "cantidad": 10, "precioUnitario": 5.50}]';
COMMENT ON COLUMN plantillas_pedido.activa IS 'Si está activa, puede ser usada para crear pedidos o programar recurrencias';

COMMENT ON TABLE pedidos_recurrentes IS 'Configuración de pedidos que se generan automáticamente con una frecuencia';
COMMENT ON COLUMN pedidos_recurrentes.frecuencia IS 'SEMANAL, QUINCENAL, MENSUAL, TRIMESTRAL';
COMMENT ON COLUMN pedidos_recurrentes.proxima_ejecucion IS 'Fecha y hora de la próxima generación automática del pedido';
COMMENT ON COLUMN pedidos_recurrentes.notificar_antes_horas IS 'Horas antes de generar para enviar notificación de recordatorio';

COMMENT ON TABLE ejecuciones_pedido_recurrente IS 'Historial de ejecuciones de pedidos recurrentes para auditoría';

-- Función para calcular la próxima ejecución
CREATE OR REPLACE FUNCTION calcular_proxima_ejecucion(
    p_frecuencia VARCHAR,
    p_dia_ejecucion INTEGER,
    p_dias_ejecucion VARCHAR,
    p_hora_ejecucion TIME,
    p_desde TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) RETURNS TIMESTAMP AS $$
DECLARE
    v_proxima TIMESTAMP;
    v_fecha_base DATE;
    v_hora TIME;
BEGIN
    v_fecha_base := p_desde::DATE;
    v_hora := p_hora_ejecucion;

    CASE p_frecuencia
        WHEN 'SEMANAL' THEN
            -- Próximo día de la semana especificado
            v_proxima := v_fecha_base + ((p_dia_ejecucion - EXTRACT(ISODOW FROM v_fecha_base)::INTEGER + 7) % 7) * INTERVAL '1 day';
            IF v_proxima <= p_desde THEN
                v_proxima := v_proxima + INTERVAL '7 days';
            END IF;

        WHEN 'QUINCENAL' THEN
            -- Próximo día 1 o 15 del mes
            IF EXTRACT(DAY FROM v_fecha_base) < 15 THEN
                v_proxima := DATE_TRUNC('month', v_fecha_base) + INTERVAL '14 days';
            ELSE
                v_proxima := DATE_TRUNC('month', v_fecha_base) + INTERVAL '1 month';
            END IF;

        WHEN 'MENSUAL' THEN
            -- Próximo día del mes especificado
            v_proxima := DATE_TRUNC('month', v_fecha_base) + (p_dia_ejecucion - 1) * INTERVAL '1 day';
            IF v_proxima <= p_desde THEN
                v_proxima := DATE_TRUNC('month', v_fecha_base) + INTERVAL '1 month' + (p_dia_ejecucion - 1) * INTERVAL '1 day';
            END IF;

        WHEN 'TRIMESTRAL' THEN
            -- Cada 3 meses en el día especificado
            v_proxima := DATE_TRUNC('month', v_fecha_base) + (p_dia_ejecucion - 1) * INTERVAL '1 day';
            IF v_proxima <= p_desde THEN
                v_proxima := DATE_TRUNC('month', v_fecha_base) + INTERVAL '3 months' + (p_dia_ejecucion - 1) * INTERVAL '1 day';
            END IF;

        ELSE
            RAISE EXCEPTION 'Frecuencia no válida: %', p_frecuencia;
    END CASE;

    -- Combinar fecha con hora
    v_proxima := v_proxima::DATE + v_hora;

    RETURN v_proxima;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_modificacion automáticamente
CREATE OR REPLACE FUNCTION update_plantilla_pedido_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plantilla_timestamp
    BEFORE UPDATE ON plantillas_pedido
    FOR EACH ROW
    EXECUTE FUNCTION update_plantilla_pedido_timestamp();

CREATE TRIGGER trigger_update_recurrente_timestamp
    BEFORE UPDATE ON pedidos_recurrentes
    FOR EACH ROW
    EXECUTE FUNCTION update_plantilla_pedido_timestamp();
