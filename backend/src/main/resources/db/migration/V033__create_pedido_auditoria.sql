-- Tabla de auditoría para pedidos
CREATE TABLE pedido_auditoria (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    usuario_id BIGINT,
    accion VARCHAR(50) NOT NULL, -- 'CREADO', 'MODIFICADO', 'CAMBIO_ESTADO', 'ELIMINADO'
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    observaciones TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pedido_auditoria_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_pedido_auditoria_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_pedido_auditoria_pedido_id ON pedido_auditoria(pedido_id);
CREATE INDEX idx_pedido_auditoria_fecha ON pedido_auditoria(fecha_cambio DESC);
CREATE INDEX idx_pedido_auditoria_usuario ON pedido_auditoria(usuario_id);
CREATE INDEX idx_pedido_auditoria_accion ON pedido_auditoria(accion);

-- Trigger para registrar automáticamente cambios de estado
CREATE OR REPLACE FUNCTION audit_pedido_cambio_estado()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado cambió
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO pedido_auditoria (
            pedido_id,
            usuario_id,
            accion,
            estado_anterior,
            estado_nuevo,
            observaciones,
            fecha_cambio
        ) VALUES (
            NEW.id,
            NEW.usuario_modificacion_id,
            'CAMBIO_ESTADO',
            OLD.estado,
            NEW.estado,
            'Cambio automático de estado',
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a la tabla pedidos
CREATE TRIGGER trigger_audit_pedido_estado
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION audit_pedido_cambio_estado();

-- Comentarios para documentación
COMMENT ON TABLE pedido_auditoria IS 'Registro de auditoría de cambios en pedidos';
COMMENT ON COLUMN pedido_auditoria.accion IS 'Tipo de acción: CREADO, MODIFICADO, CAMBIO_ESTADO, ELIMINADO';
COMMENT ON COLUMN pedido_auditoria.ip_address IS 'Dirección IP desde donde se realizó el cambio';
COMMENT ON COLUMN pedido_auditoria.user_agent IS 'Navegador/cliente que realizó el cambio';
