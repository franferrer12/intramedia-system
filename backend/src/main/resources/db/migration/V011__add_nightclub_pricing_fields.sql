-- Migración V011: Modelo de precios para ocio nocturno
-- Añade campos para gestionar botellas vendidas como copas/chupitos individuales

-- 1. Añadir campos físicos de la botella
ALTER TABLE productos
    ADD COLUMN capacidad_ml DECIMAL(10, 2),
    ADD COLUMN tipo_venta VARCHAR(20) DEFAULT 'BOTELLA',
    ADD COLUMN ml_por_servicio DECIMAL(10, 2),
    ADD COLUMN factor_merma DECIMAL(5, 2) DEFAULT 0;

-- 2. Añadir campos calculados para economía real
ALTER TABLE productos
    ADD COLUMN unidades_teoricas DECIMAL(10, 2),
    ADD COLUMN unidades_reales DECIMAL(10, 2),
    ADD COLUMN ingreso_total_estimado DECIMAL(10, 2),
    ADD COLUMN beneficio_unitario DECIMAL(10, 2),
    ADD COLUMN margen_porcentaje DECIMAL(5, 2);

-- 3. Añadir constraint para tipo_venta
ALTER TABLE productos
    ADD CONSTRAINT chk_tipo_venta CHECK (tipo_venta IN ('COPA', 'CHUPITO', 'BOTELLA'));

-- 4. Añadir constraint para factor_merma (0-100%)
ALTER TABLE productos
    ADD CONSTRAINT chk_factor_merma CHECK (factor_merma >= 0 AND factor_merma <= 100);

-- 5. Crear índice para búsquedas por tipo de venta
CREATE INDEX idx_productos_tipo_venta ON productos(tipo_venta);

-- 6. Comentarios para documentación
COMMENT ON COLUMN productos.capacidad_ml IS 'Capacidad de la botella en mililitros (700ml, 1000ml, 1500ml, etc)';
COMMENT ON COLUMN productos.tipo_venta IS 'Tipo de venta: COPA (6 seg ≈90ml), CHUPITO (2 seg ≈30ml), BOTELLA (completa)';
COMMENT ON COLUMN productos.ml_por_servicio IS 'Mililitros por servicio individual (90ml copa, 30ml chupito, NULL botella)';
COMMENT ON COLUMN productos.factor_merma IS 'Porcentaje de merma/desperdicio (10% copas, 5% chupitos, 0% botellas)';
COMMENT ON COLUMN productos.unidades_teoricas IS 'Calculado: capacidad_ml ÷ ml_por_servicio (unidades perfectas)';
COMMENT ON COLUMN productos.unidades_reales IS 'Calculado: unidades_teoricas × (1 - factor_merma/100) (con pérdidas)';
COMMENT ON COLUMN productos.ingreso_total_estimado IS 'Calculado: precio_venta × unidades_reales (ingreso por botella)';
COMMENT ON COLUMN productos.beneficio_unitario IS 'Calculado: ingreso_total_estimado - precio_compra (ganancia neta)';
COMMENT ON COLUMN productos.margen_porcentaje IS 'Calculado: (beneficio_unitario / precio_compra) × 100 (rentabilidad)';

-- 7. Función para calcular automáticamente los valores
CREATE OR REPLACE FUNCTION calcular_economia_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo calcular si es COPA o CHUPITO (BOTELLA no necesita cálculos)
    IF NEW.tipo_venta IN ('COPA', 'CHUPITO') THEN

        -- Calcular unidades teóricas
        IF NEW.capacidad_ml IS NOT NULL AND NEW.ml_por_servicio IS NOT NULL AND NEW.ml_por_servicio > 0 THEN
            NEW.unidades_teoricas := NEW.capacidad_ml / NEW.ml_por_servicio;
        ELSE
            NEW.unidades_teoricas := NULL;
        END IF;

        -- Calcular unidades reales (con merma)
        IF NEW.unidades_teoricas IS NOT NULL THEN
            NEW.unidades_reales := NEW.unidades_teoricas * (1 - COALESCE(NEW.factor_merma, 0) / 100.0);
        ELSE
            NEW.unidades_reales := NULL;
        END IF;

        -- Calcular ingreso total estimado
        IF NEW.unidades_reales IS NOT NULL AND NEW.precio_venta IS NOT NULL THEN
            NEW.ingreso_total_estimado := NEW.precio_venta * NEW.unidades_reales;
        ELSE
            NEW.ingreso_total_estimado := NULL;
        END IF;

    ELSIF NEW.tipo_venta = 'BOTELLA' THEN
        -- Para botellas completas, 1 unidad = 1 botella
        NEW.unidades_teoricas := 1;
        NEW.unidades_reales := 1;
        NEW.ingreso_total_estimado := NEW.precio_venta;
    END IF;

    -- Calcular beneficio unitario
    IF NEW.ingreso_total_estimado IS NOT NULL AND NEW.precio_compra IS NOT NULL THEN
        NEW.beneficio_unitario := NEW.ingreso_total_estimado - NEW.precio_compra;
    ELSE
        NEW.beneficio_unitario := NULL;
    END IF;

    -- Calcular margen porcentual
    IF NEW.beneficio_unitario IS NOT NULL AND NEW.precio_compra IS NOT NULL AND NEW.precio_compra > 0 THEN
        NEW.margen_porcentaje := (NEW.beneficio_unitario / NEW.precio_compra) * 100;
    ELSE
        NEW.margen_porcentaje := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para calcular automáticamente antes de INSERT/UPDATE
DROP TRIGGER IF EXISTS trigger_calcular_economia_producto ON productos;
CREATE TRIGGER trigger_calcular_economia_producto
    BEFORE INSERT OR UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION calcular_economia_producto();

-- 9. Actualizar productos existentes con valores por defecto
-- Los productos sin tipo_venta específico se consideran BOTELLA (venta directa)
UPDATE productos
SET tipo_venta = 'BOTELLA',
    capacidad_ml = 1000,  -- Asumir 1L por defecto
    factor_merma = 0,
    unidades_teoricas = 1,
    unidades_reales = 1,
    ingreso_total_estimado = precio_venta,
    beneficio_unitario = precio_venta - precio_compra,
    margen_porcentaje = CASE
        WHEN precio_compra > 0 THEN ((precio_venta - precio_compra) / precio_compra) * 100
        ELSE 0
    END
WHERE tipo_venta IS NULL OR tipo_venta = 'BOTELLA';
