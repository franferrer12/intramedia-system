-- Tabla de adjuntos para pedidos
CREATE TABLE adjuntos_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    nombre_archivo VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(100) NOT NULL, -- 'FACTURA', 'ALBARAN', 'CONTRATO', 'OTRO'
    mime_type VARCHAR(100) NOT NULL,
    tamanio_bytes BIGINT NOT NULL,
    ruta_archivo VARCHAR(1000) NOT NULL,
    descripcion TEXT,
    subido_por_id BIGINT,
    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adjunto_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_adjunto_usuario FOREIGN KEY (subido_por_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_adjuntos_pedido_pedido_id ON adjuntos_pedido(pedido_id);
CREATE INDEX idx_adjuntos_pedido_tipo ON adjuntos_pedido(tipo_archivo);
CREATE INDEX idx_adjuntos_pedido_fecha ON adjuntos_pedido(fecha_subida DESC);

-- Comentarios para documentación
COMMENT ON TABLE adjuntos_pedido IS 'Archivos adjuntos a pedidos (facturas, albaranes, contratos, etc.)';
COMMENT ON COLUMN adjuntos_pedido.nombre_archivo IS 'Nombre único del archivo en el sistema de almacenamiento';
COMMENT ON COLUMN adjuntos_pedido.nombre_original IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN adjuntos_pedido.tipo_archivo IS 'Tipo de documento: FACTURA, ALBARAN, CONTRATO, OTRO';
COMMENT ON COLUMN adjuntos_pedido.tamanio_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN adjuntos_pedido.ruta_archivo IS 'Ruta completa del archivo en el sistema de archivos o storage';
