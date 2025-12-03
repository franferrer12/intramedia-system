-- ============================================
-- MIGRACIÓN V021: Sistema de Dispositivos POS
-- Fecha: 12 Octubre 2025
-- Descripción: Tabla para gestionar terminales POS independientes
-- ============================================

-- Tabla principal de dispositivos
CREATE TABLE dispositivos_pos (
    id BIGSERIAL PRIMARY KEY,

    -- Identificación
    uuid VARCHAR(36) NOT NULL UNIQUE, -- UUID generado automáticamente
    nombre VARCHAR(100) NOT NULL, -- "Caja 1", "Barra Principal"
    descripcion TEXT,

    -- Tipo y ubicación
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CAJA', 'BARRA', 'MOVIL')),
    ubicacion VARCHAR(100), -- "Entrada", "Barra VIP", "Terraza"

    -- Configuración
    empleado_asignado_id BIGINT REFERENCES empleados(id) ON DELETE SET NULL,
    pin_rapido VARCHAR(255) NOT NULL, -- PIN cifrado con BCrypt
    categorias_predeterminadas TEXT[], -- Array de categorías a mostrar

    -- Hardware
    config_impresora JSONB, -- {tipo: 'termica', ip: '192.168.1.100', modelo: 'EPSON TM-T20'}
    tiene_lector_barras BOOLEAN DEFAULT false,
    tiene_cajon_dinero BOOLEAN DEFAULT false,
    tiene_pantalla_cliente BOOLEAN DEFAULT false,

    -- Permisos
    permisos JSONB, -- {puede_descuentos: false, puede_cancelar: false, max_descuento: 10}

    -- Estado
    activo BOOLEAN DEFAULT true,
    modo_offline_habilitado BOOLEAN DEFAULT true,

    -- Tracking
    ultima_conexion TIMESTAMP,
    ultima_sincronizacion TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES usuarios(id)
);

-- Índices para performance
CREATE INDEX idx_dispositivos_pos_tipo ON dispositivos_pos(tipo);
CREATE INDEX idx_dispositivos_pos_activo ON dispositivos_pos(activo);
CREATE INDEX idx_dispositivos_pos_empleado ON dispositivos_pos(empleado_asignado_id);
CREATE INDEX idx_dispositivos_pos_uuid ON dispositivos_pos(uuid);
CREATE INDEX idx_dispositivos_pos_ultima_conexion ON dispositivos_pos(ultima_conexion DESC);

-- Tabla de ventas pendientes (modo offline)
CREATE TABLE ventas_pendientes_sync (
    id BIGSERIAL PRIMARY KEY,

    -- Relaciones
    dispositivo_id BIGINT NOT NULL REFERENCES dispositivos_pos(id) ON DELETE CASCADE,
    sesion_caja_id BIGINT REFERENCES sesiones_venta(id) ON DELETE SET NULL,

    -- Datos de la venta
    datos_venta JSONB NOT NULL, -- JSON completo de VentaRequest
    uuid_venta VARCHAR(36) NOT NULL UNIQUE, -- Para evitar duplicados

    -- Estado de sincronización
    sincronizada BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_sincronizacion TIMESTAMP,

    -- Retry logic
    intentos_sincronizacion INT DEFAULT 0,
    ultimo_intento TIMESTAMP,
    proximo_intento TIMESTAMP,
    error_sincronizacion TEXT,

    -- Resultado
    venta_id BIGINT, -- ID de la venta creada tras sincronizar

    -- Constraints
    CONSTRAINT max_intentos CHECK (intentos_sincronizacion <= 10)
);

-- Índices
CREATE INDEX idx_ventas_pendientes_dispositivo ON ventas_pendientes_sync(dispositivo_id);
CREATE INDEX idx_ventas_pendientes_sincronizada ON ventas_pendientes_sync(sincronizada);
CREATE INDEX idx_ventas_pendientes_proximo_intento ON ventas_pendientes_sync(proximo_intento);
CREATE INDEX idx_ventas_pendientes_uuid ON ventas_pendientes_sync(uuid_venta);

-- Tabla de logs de actividad por dispositivo
CREATE TABLE dispositivos_pos_logs (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL REFERENCES dispositivos_pos(id) ON DELETE CASCADE,

    -- Evento
    tipo_evento VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'VENTA', 'ERROR', 'SINCRONIZACION'
    descripcion TEXT,
    metadata JSONB, -- Datos adicionales del evento

    -- Contexto
    empleado_id BIGINT REFERENCES empleados(id),
    ip_address VARCHAR(45),

    -- Timestamp
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_dispositivos_logs_dispositivo ON dispositivos_pos_logs(dispositivo_id);
CREATE INDEX idx_dispositivos_logs_fecha ON dispositivos_pos_logs(fecha DESC);
CREATE INDEX idx_dispositivos_logs_tipo ON dispositivos_pos_logs(tipo_evento);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_dispositivos_pos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_dispositivos_pos_updated_at
BEFORE UPDATE ON dispositivos_pos
FOR EACH ROW
EXECUTE FUNCTION update_dispositivos_pos_updated_at();

-- Función para registrar log automáticamente
CREATE OR REPLACE FUNCTION log_dispositivo_actividad()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dispositivos_pos_logs (dispositivo_id, tipo_evento, descripcion, metadata)
    VALUES (
        NEW.id,
        'ACTUALIZACION',
        'Dispositivo actualizado',
        jsonb_build_object(
            'cambios', to_jsonb(NEW) - to_jsonb(OLD),
            'anterior', to_jsonb(OLD)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging
CREATE TRIGGER trigger_dispositivos_pos_log
AFTER UPDATE ON dispositivos_pos
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION log_dispositivo_actividad();

-- Comentarios de documentación
COMMENT ON TABLE dispositivos_pos IS 'Terminales POS registrados en el sistema';
COMMENT ON COLUMN dispositivos_pos.uuid IS 'Identificador único del dispositivo generado automáticamente';
COMMENT ON COLUMN dispositivos_pos.pin_rapido IS 'PIN cifrado con BCrypt para login rápido en el terminal';
COMMENT ON COLUMN dispositivos_pos.categorias_predeterminadas IS 'Categorías de productos que se mostrarán en este terminal';
COMMENT ON COLUMN dispositivos_pos.config_impresora IS 'Configuración de impresora térmica en formato JSON';

COMMENT ON TABLE ventas_pendientes_sync IS 'Cola de ventas realizadas offline pendientes de sincronización';
COMMENT ON COLUMN ventas_pendientes_sync.uuid_venta IS 'UUID único para evitar duplicados al sincronizar';
COMMENT ON COLUMN ventas_pendientes_sync.intentos_sincronizacion IS 'Número de intentos de sincronización (máximo 10)';

COMMENT ON TABLE dispositivos_pos_logs IS 'Registro de auditoría de actividad por dispositivo POS';
