-- Tabla de logs del sistema para auditoría general
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    nivel VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'ERROR', 'DEBUG'
    modulo VARCHAR(100) NOT NULL, -- 'PEDIDOS', 'VENTAS', 'USUARIOS', 'SISTEMA', etc.
    accion VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    detalles JSONB,
    usuario_id BIGINT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    stack_trace TEXT,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_log_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_system_logs_fecha ON system_logs(fecha_hora DESC);
CREATE INDEX idx_system_logs_nivel ON system_logs(nivel);
CREATE INDEX idx_system_logs_modulo ON system_logs(modulo);
CREATE INDEX idx_system_logs_usuario ON system_logs(usuario_id);
CREATE INDEX idx_system_logs_accion ON system_logs(accion);

-- Tabla de configuración del sistema
CREATE TABLE configuracion_sistema (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
    categoria VARCHAR(50) NOT NULL, -- 'GENERAL', 'SEGURIDAD', 'EMAIL', 'NOTIFICACIONES', etc.
    descripcion TEXT,
    modificado_por_id BIGINT,
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_config_usuario FOREIGN KEY (modificado_por_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_config_categoria ON configuracion_sistema(categoria);
CREATE INDEX idx_config_clave ON configuracion_sistema(clave);

-- Insertar configuraciones por defecto
INSERT INTO configuracion_sistema (clave, valor, tipo, categoria, descripcion) VALUES
    ('max_file_size_mb', '10', 'NUMBER', 'GENERAL', 'Tamaño máximo de archivos adjuntos en MB'),
    ('session_timeout_minutes', '1440', 'NUMBER', 'SEGURIDAD', 'Tiempo de expiración de sesión en minutos (24 horas)'),
    ('enable_email_notifications', 'false', 'BOOLEAN', 'NOTIFICACIONES', 'Habilitar notificaciones por email'),
    ('email_from', 'noreply@clubmanagement.com', 'STRING', 'EMAIL', 'Email remitente del sistema'),
    ('max_login_attempts', '5', 'NUMBER', 'SEGURIDAD', 'Intentos máximos de login antes de bloqueo'),
    ('backup_enabled', 'true', 'BOOLEAN', 'GENERAL', 'Habilitar copias de seguridad automáticas'),
    ('backup_frequency_hours', '24', 'NUMBER', 'GENERAL', 'Frecuencia de copias de seguridad en horas'),
    ('low_stock_threshold_percent', '20', 'NUMBER', 'INVENTARIO', 'Porcentaje de stock para generar alerta de stock bajo'),
    ('currency_symbol', '€', 'STRING', 'GENERAL', 'Símbolo de moneda del sistema'),
    ('timezone', 'Europe/Madrid', 'STRING', 'GENERAL', 'Zona horaria del sistema');

-- Comentarios para documentación
COMMENT ON TABLE system_logs IS 'Registro de eventos y errores del sistema para auditoría';
COMMENT ON COLUMN system_logs.nivel IS 'Nivel de log: INFO, WARNING, ERROR, DEBUG';
COMMENT ON COLUMN system_logs.modulo IS 'Módulo del sistema que generó el log';
COMMENT ON COLUMN system_logs.detalles IS 'Información adicional en formato JSON';

COMMENT ON TABLE configuracion_sistema IS 'Configuración global del sistema';
COMMENT ON COLUMN configuracion_sistema.tipo IS 'Tipo de dato: STRING, NUMBER, BOOLEAN, JSON';
COMMENT ON COLUMN configuracion_sistema.categoria IS 'Categoría de configuración para organización';
