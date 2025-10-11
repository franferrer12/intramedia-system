-- =====================================================
-- Migración V022: Actualizar detalle_venta para Botellas VIP
-- =====================================================
-- Fecha: 11 Octubre 2025
-- Descripción: Agrega campos a detalle_venta para soportar
--              venta de botellas completas, copas individuales
--              y tracking de botellas abiertas
-- =====================================================

-- Agregar nuevas columnas a la tabla detalle_venta
ALTER TABLE detalle_venta
    ADD COLUMN IF NOT EXISTS tipo_venta VARCHAR(20) DEFAULT 'NORMAL',
    ADD COLUMN IF NOT EXISTS es_copa_individual BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS botella_abierta_id BIGINT REFERENCES botellas_abiertas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS copas_vendidas INTEGER,
    ADD COLUMN IF NOT EXISTS descuento_pack_vip DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notas_venta TEXT;

-- Agregar comentarios para documentación
COMMENT ON COLUMN detalle_venta.tipo_venta IS 'Tipo de venta: NORMAL, BOTELLA_COMPLETA, COPA_INDIVIDUAL, PACK_VIP';
COMMENT ON COLUMN detalle_venta.es_copa_individual IS 'Indica si la venta es de copas individuales de una botella abierta';
COMMENT ON COLUMN detalle_venta.botella_abierta_id IS 'Referencia a la botella abierta de donde se sirvió (si aplica)';
COMMENT ON COLUMN detalle_venta.copas_vendidas IS 'Número de copas vendidas de una botella abierta';
COMMENT ON COLUMN detalle_venta.descuento_pack_vip IS 'Descuento aplicado en packs VIP';
COMMENT ON COLUMN detalle_venta.notas_venta IS 'Notas adicionales sobre la venta (ej: ubicación VIP, mesa especial, etc.)';

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_detalle_venta_tipo_venta ON detalle_venta(tipo_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_botella_abierta ON detalle_venta(botella_abierta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_copas ON detalle_venta(es_copa_individual)
    WHERE es_copa_individual = TRUE;

-- Agregar constraint para validar tipo de venta
ALTER TABLE detalle_venta
    ADD CONSTRAINT chk_tipo_venta
    CHECK (tipo_venta IN ('NORMAL', 'BOTELLA_COMPLETA', 'COPA_INDIVIDUAL', 'PACK_VIP'));

-- Validación: Si es copa individual, debe tener botella_abierta_id y copas_vendidas
ALTER TABLE detalle_venta
    ADD CONSTRAINT chk_copa_individual_config
    CHECK (
        (es_copa_individual = FALSE) OR
        (es_copa_individual = TRUE AND botella_abierta_id IS NOT NULL AND copas_vendidas > 0)
    );

-- Validación: copas_vendidas debe ser positivo si está presente
ALTER TABLE detalle_venta
    ADD CONSTRAINT chk_copas_vendidas_positivas
    CHECK (copas_vendidas IS NULL OR copas_vendidas > 0);

-- =====================================================
-- Trigger: Actualizar copas servidas en botella abierta
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_copas_servidas_botella()
RETURNS TRIGGER AS $$
DECLARE
    botella_record RECORD;
BEGIN
    -- Solo procesar si es venta de copas individuales
    IF NEW.es_copa_individual = TRUE AND NEW.botella_abierta_id IS NOT NULL THEN

        -- Obtener estado actual de la botella
        SELECT * INTO botella_record
        FROM botellas_abiertas
        WHERE id = NEW.botella_abierta_id;

        -- Verificar que la botella existe y está abierta
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Botella abierta ID % no existe', NEW.botella_abierta_id;
        END IF;

        IF botella_record.estado != 'ABIERTA' THEN
            RAISE EXCEPTION 'Botella ID % no está abierta (estado: %)', NEW.botella_abierta_id, botella_record.estado;
        END IF;

        -- Verificar que hay suficientes copas disponibles
        IF botella_record.copas_restantes < NEW.copas_vendidas THEN
            RAISE EXCEPTION 'Botella ID % solo tiene % copas disponibles, pero se intentan vender %',
                NEW.botella_abierta_id, botella_record.copas_restantes, NEW.copas_vendidas;
        END IF;

        -- Actualizar copas servidas y restantes en la botella
        UPDATE botellas_abiertas
        SET copas_servidas = copas_servidas + NEW.copas_vendidas,
            copas_restantes = copas_restantes - NEW.copas_vendidas
        WHERE id = NEW.botella_abierta_id;

        RAISE NOTICE 'Botella ID %: Servidas % copas. Restantes: %',
            NEW.botella_abierta_id, NEW.copas_vendidas, (botella_record.copas_restantes - NEW.copas_vendidas);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_copas_servidas
    AFTER INSERT ON detalle_venta
    FOR EACH ROW
    WHEN (NEW.es_copa_individual = TRUE AND NEW.botella_abierta_id IS NOT NULL)
    EXECUTE FUNCTION actualizar_copas_servidas_botella();

-- =====================================================
-- Trigger: Descontar stock al vender botella completa
-- =====================================================

CREATE OR REPLACE FUNCTION descontar_stock_botella_completa()
RETURNS TRIGGER AS $$
DECLARE
    producto_record RECORD;
    stock_actual INTEGER;
BEGIN
    -- Solo procesar si es venta de botella completa
    IF NEW.tipo_venta = 'BOTELLA_COMPLETA' OR NEW.tipo_venta = 'PACK_VIP' THEN

        -- Obtener información del producto
        SELECT * INTO producto_record
        FROM productos
        WHERE id = NEW.producto_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto ID % no existe', NEW.producto_id;
        END IF;

        -- Verificar que es un producto tipo botella
        IF producto_record.es_botella = FALSE THEN
            RAISE EXCEPTION 'Producto ID % no es una botella', NEW.producto_id;
        END IF;

        -- Obtener stock actual
        SELECT stock INTO stock_actual FROM productos WHERE id = NEW.producto_id;

        -- Verificar que hay suficiente stock
        IF stock_actual < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para producto ID %. Stock actual: %, solicitado: %',
                NEW.producto_id, stock_actual, NEW.cantidad;
        END IF;

        -- Descontar stock de botellas cerradas
        UPDATE productos
        SET stock = stock - NEW.cantidad
        WHERE id = NEW.producto_id;

        -- Registrar movimiento de stock
        INSERT INTO movimientos_stock (
            producto_id,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_nuevo,
            motivo,
            referencia_id,
            referencia_tipo
        ) VALUES (
            NEW.producto_id,
            'SALIDA',
            NEW.cantidad,
            stock_actual,
            stock_actual - NEW.cantidad,
            CASE
                WHEN NEW.tipo_venta = 'PACK_VIP' THEN 'Venta Pack VIP'
                ELSE 'Venta Botella Completa'
            END,
            NEW.id,
            'DETALLE_VENTA'
        );

        RAISE NOTICE 'Producto ID %: Descontadas % botellas. Stock nuevo: %',
            NEW.producto_id, NEW.cantidad, (stock_actual - NEW.cantidad);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_descontar_stock_botella_completa
    AFTER INSERT ON detalle_venta
    FOR EACH ROW
    WHEN (NEW.tipo_venta IN ('BOTELLA_COMPLETA', 'PACK_VIP'))
    EXECUTE FUNCTION descontar_stock_botella_completa();

-- =====================================================
-- Vista: Resumen de ventas por tipo
-- =====================================================

CREATE OR REPLACE VIEW v_ventas_botellas_resumen AS
SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.categoria,
    COUNT(DISTINCT CASE WHEN dv.tipo_venta = 'BOTELLA_COMPLETA' THEN dv.id END) AS total_botellas_completas,
    COUNT(DISTINCT CASE WHEN dv.tipo_venta = 'PACK_VIP' THEN dv.id END) AS total_packs_vip,
    COUNT(DISTINCT CASE WHEN dv.es_copa_individual = TRUE THEN dv.id END) AS total_copas_individuales,
    SUM(CASE WHEN dv.es_copa_individual = TRUE THEN dv.copas_vendidas ELSE 0 END) AS copas_vendidas_total,
    SUM(CASE WHEN dv.tipo_venta = 'BOTELLA_COMPLETA' THEN dv.precio_unitario * dv.cantidad ELSE 0 END) AS ingresos_botellas,
    SUM(CASE WHEN dv.tipo_venta = 'PACK_VIP' THEN dv.precio_unitario * dv.cantidad ELSE 0 END) AS ingresos_vip,
    SUM(CASE WHEN dv.es_copa_individual = TRUE THEN dv.precio_unitario * dv.cantidad ELSE 0 END) AS ingresos_copas,
    SUM(CASE WHEN dv.tipo_venta IN ('PACK_VIP') THEN dv.descuento_pack_vip ELSE 0 END) AS descuentos_vip_total
FROM productos p
LEFT JOIN detalle_venta dv ON dv.producto_id = p.id
WHERE p.es_botella = TRUE
GROUP BY p.id, p.nombre, p.categoria;

COMMENT ON VIEW v_ventas_botellas_resumen IS 'Vista resumida de ventas de botellas por tipo (completas, packs VIP, copas)';

-- =====================================================
-- Vista: Análisis de rentabilidad por tipo de venta
-- =====================================================

CREATE OR REPLACE VIEW v_rentabilidad_botellas AS
SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.precio_botella_vip AS precio_pack_vip,
    p.precio_copa AS precio_copa_individual,
    p.copas_por_botella,
    (p.precio_copa * p.copas_por_botella) AS ingreso_potencial_copas,
    p.precio_botella_vip AS ingreso_pack_vip,
    ((p.precio_copa * p.copas_por_botella) - p.precio_botella_vip) AS diferencia_copas_vs_pack,
    ROUND(
        (((p.precio_copa * p.copas_por_botella) - p.precio_botella_vip) / NULLIF(p.precio_copa * p.copas_por_botella, 0)) * 100,
        2
    ) AS porcentaje_descuento_pack
FROM productos p
WHERE p.es_botella = TRUE
  AND p.precio_copa IS NOT NULL
  AND p.precio_botella_vip IS NOT NULL;

COMMENT ON VIEW v_rentabilidad_botellas IS 'Análisis de rentabilidad comparando venta por copas vs pack VIP';

-- =====================================================
-- Función auxiliar: Calcular precio óptimo de venta
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_precio_venta_botella(
    p_producto_id BIGINT,
    p_tipo_venta VARCHAR(20)
)
RETURNS DECIMAL AS $$
DECLARE
    producto_record RECORD;
    precio_final DECIMAL;
BEGIN
    -- Obtener información del producto
    SELECT * INTO producto_record
    FROM productos
    WHERE id = p_producto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto ID % no existe', p_producto_id;
    END IF;

    -- Calcular precio según tipo de venta
    CASE p_tipo_venta
        WHEN 'COPA_INDIVIDUAL' THEN
            precio_final = producto_record.precio_copa;
        WHEN 'PACK_VIP', 'BOTELLA_COMPLETA' THEN
            precio_final = producto_record.precio_botella_vip;
        WHEN 'NORMAL' THEN
            precio_final = producto_record.precio_venta;
        ELSE
            RAISE EXCEPTION 'Tipo de venta no válido: %', p_tipo_venta;
    END CASE;

    RETURN precio_final;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precio_venta_botella IS 'Calcula el precio de venta óptimo según el tipo de venta';

-- =====================================================
-- Verificación de la migración
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migración V022 completada: tabla detalle_venta actualizada para soporte de botellas VIP';
    RAISE NOTICE '- 2 triggers creados: actualizar copas servidas y descontar stock';
    RAISE NOTICE '- 2 vistas creadas: resumen de ventas y análisis de rentabilidad';
    RAISE NOTICE '- 1 función auxiliar: calcular precio de venta';
END $$;
