-- =====================================================
-- Migración V021: Crear tabla botellas_abiertas
-- =====================================================
-- Fecha: 11 Octubre 2025
-- Descripción: Tabla para tracking de botellas abiertas en barra
--              con control de copas servidas y restantes
-- =====================================================

CREATE TABLE IF NOT EXISTS botellas_abiertas (
    id BIGSERIAL PRIMARY KEY,

    -- Relaciones
    producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    sesion_caja_id BIGINT REFERENCES sesiones_caja(id) ON DELETE SET NULL,

    -- Ubicación física
    ubicacion VARCHAR(100) NOT NULL,

    -- Capacidad y tracking de copas
    copas_totales INTEGER NOT NULL,
    copas_servidas INTEGER DEFAULT 0 NOT NULL,
    copas_restantes INTEGER NOT NULL,

    -- Control temporal
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,

    -- Estado
    estado VARCHAR(20) DEFAULT 'ABIERTA' NOT NULL,

    -- Auditoría
    abierta_por BIGINT REFERENCES empleados(id) ON DELETE SET NULL,
    cerrada_por BIGINT REFERENCES empleados(id) ON DELETE SET NULL,

    -- Metadatos
    notas TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_estado_botella CHECK (estado IN ('ABIERTA', 'CERRADA', 'DESPERDICIADA')),
    CONSTRAINT chk_copas_restantes_positivas CHECK (copas_restantes >= 0),
    CONSTRAINT chk_copas_servidas_positivas CHECK (copas_servidas >= 0),
    CONSTRAINT chk_copas_coherentes CHECK (copas_servidas + copas_restantes = copas_totales),
    CONSTRAINT chk_fecha_cierre_posterior CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_apertura)
);

-- Comentarios para documentación
COMMENT ON TABLE botellas_abiertas IS 'Tracking de botellas abiertas en barra con control de copas servidas';
COMMENT ON COLUMN botellas_abiertas.ubicacion IS 'Ubicación física: BARRA_PRINCIPAL, BARRA_VIP, COCTELERIA, etc.';
COMMENT ON COLUMN botellas_abiertas.copas_totales IS 'Número total de copas que tiene la botella al abrirse';
COMMENT ON COLUMN botellas_abiertas.copas_servidas IS 'Número de copas ya servidas de esta botella';
COMMENT ON COLUMN botellas_abiertas.copas_restantes IS 'Número de copas que aún quedan en la botella';
COMMENT ON COLUMN botellas_abiertas.estado IS 'ABIERTA: en uso | CERRADA: terminada | DESPERDICIADA: rota o desperdiciada';

-- Índices para optimizar queries
CREATE INDEX idx_botellas_abiertas_estado ON botellas_abiertas(estado);
CREATE INDEX idx_botellas_abiertas_producto ON botellas_abiertas(producto_id);
CREATE INDEX idx_botellas_abiertas_sesion ON botellas_abiertas(sesion_caja_id);
CREATE INDEX idx_botellas_abiertas_ubicacion ON botellas_abiertas(ubicacion);
CREATE INDEX idx_botellas_abiertas_fecha_apertura ON botellas_abiertas(fecha_apertura DESC);

-- Índice compuesto para búsquedas frecuentes (botellas abiertas activas por producto)
CREATE INDEX idx_botellas_activas_producto ON botellas_abiertas(producto_id, estado)
    WHERE estado = 'ABIERTA';

-- Índice para botellas casi vacías (alertas)
CREATE INDEX idx_botellas_casi_vacias ON botellas_abiertas(producto_id, copas_restantes)
    WHERE estado = 'ABIERTA' AND copas_restantes <= 5;

-- =====================================================
-- Trigger: Actualizar timestamp al modificar
-- =====================================================

CREATE OR REPLACE FUNCTION update_botellas_abiertas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_botellas_abiertas_timestamp
    BEFORE UPDATE ON botellas_abiertas
    FOR EACH ROW
    EXECUTE FUNCTION update_botellas_abiertas_timestamp();

-- =====================================================
-- Trigger: Auto-cerrar botella cuando se vacía
-- =====================================================

CREATE OR REPLACE FUNCTION auto_cerrar_botella_vacia()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la botella quedó sin copas y está abierta, cerrarla automáticamente
    IF NEW.copas_restantes = 0 AND NEW.estado = 'ABIERTA' THEN
        NEW.estado = 'CERRADA';
        NEW.fecha_cierre = NOW();
        RAISE NOTICE 'Botella ID % cerrada automáticamente (vacía)', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_cerrar_botella_vacia
    BEFORE UPDATE ON botellas_abiertas
    FOR EACH ROW
    WHEN (OLD.copas_restantes > 0 AND NEW.copas_restantes = 0)
    EXECUTE FUNCTION auto_cerrar_botella_vacia();

-- =====================================================
-- Función auxiliar: Obtener copas disponibles por producto
-- =====================================================

CREATE OR REPLACE FUNCTION get_copas_disponibles(p_producto_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    total_copas INTEGER;
BEGIN
    SELECT COALESCE(SUM(copas_restantes), 0)
    INTO total_copas
    FROM botellas_abiertas
    WHERE producto_id = p_producto_id
      AND estado = 'ABIERTA';

    RETURN total_copas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_copas_disponibles IS 'Devuelve el número total de copas disponibles de un producto en todas las botellas abiertas';

-- =====================================================
-- Función auxiliar: Obtener equivalente en botellas del stock abierto
-- =====================================================

CREATE OR REPLACE FUNCTION get_equivalente_botellas_abiertas(p_producto_id BIGINT)
RETURNS DECIMAL AS $$
DECLARE
    copas_totales INTEGER;
    copas_por_botella INTEGER;
    equivalente DECIMAL;
BEGIN
    -- Obtener copas disponibles
    SELECT get_copas_disponibles(p_producto_id) INTO copas_totales;

    -- Obtener copas por botella del producto
    SELECT productos.copas_por_botella INTO copas_por_botella
    FROM productos
    WHERE id = p_producto_id;

    -- Calcular equivalente
    IF copas_por_botella > 0 THEN
        equivalente = copas_totales::DECIMAL / copas_por_botella;
    ELSE
        equivalente = 0;
    END IF;

    RETURN ROUND(equivalente, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_equivalente_botellas_abiertas IS 'Devuelve el equivalente en botellas del stock de copas disponibles';

-- =====================================================
-- Vista: Resumen de botellas abiertas por producto
-- =====================================================

CREATE OR REPLACE VIEW v_botellas_abiertas_resumen AS
SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.categoria,
    COUNT(ba.id) AS total_botellas_abiertas,
    SUM(ba.copas_servidas) AS total_copas_servidas,
    SUM(ba.copas_restantes) AS total_copas_disponibles,
    ROUND(SUM(ba.copas_restantes)::DECIMAL / NULLIF(p.copas_por_botella, 0), 2) AS equivalente_botellas,
    ARRAY_AGG(ba.ubicacion) FILTER (WHERE ba.estado = 'ABIERTA') AS ubicaciones,
    MIN(ba.fecha_apertura) AS botella_mas_antigua,
    MAX(ba.fecha_apertura) AS botella_mas_reciente
FROM productos p
LEFT JOIN botellas_abiertas ba ON ba.producto_id = p.id AND ba.estado = 'ABIERTA'
WHERE p.es_botella = TRUE
GROUP BY p.id, p.nombre, p.categoria, p.copas_por_botella;

COMMENT ON VIEW v_botellas_abiertas_resumen IS 'Vista resumida de todas las botellas abiertas agrupadas por producto';

-- =====================================================
-- Verificación de la migración
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migración V021 completada: Tabla botellas_abiertas creada con 2 triggers y 2 funciones auxiliares';
    RAISE NOTICE 'Vista v_botellas_abiertas_resumen disponible para consultas';
END $$;
