-- Migración V020: Sistema de Venta Dual (Copa + Botella VIP)
-- Añade campo para habilitar venta simultánea en copas y botellas VIP

-- 1. Agregar campo es_venta_dual
ALTER TABLE productos
    ADD COLUMN IF NOT EXISTS es_venta_dual BOOLEAN DEFAULT false NOT NULL;

-- 2. Crear índice para búsquedas de productos con venta dual
CREATE INDEX IF NOT EXISTS idx_productos_venta_dual
    ON productos(es_venta_dual)
    WHERE es_venta_dual = true;

-- 3. Comentario para documentación
COMMENT ON COLUMN productos.es_venta_dual IS
'Indica si el producto puede venderse tanto en copas (barra) como en botellas VIP (reservados). Requiere precio_copa y precio_botella_vip configurados.';

-- 4. Actualizar productos existentes que tengan ambos precios configurados
UPDATE productos
SET es_venta_dual = true
WHERE precio_copa IS NOT NULL
  AND precio_botella_vip IS NOT NULL
  AND copas_por_botella IS NOT NULL
  AND copas_por_botella > 0;

-- 5. Crear vista para análisis de valor de inventario dual
CREATE OR REPLACE VIEW valor_inventario_dual AS
SELECT
    p.id,
    p.codigo,
    p.nombre,
    p.stock_actual,

    -- Inversión actual
    p.precio_compra,
    (p.stock_actual * p.precio_compra) as capital_invertido,

    -- Opción Copa
    p.copas_por_botella,
    p.precio_copa,
    (p.stock_actual * p.copas_por_botella) as copas_totales_disponibles,
    (p.stock_actual * p.copas_por_botella * COALESCE(p.precio_copa, 0)) as valor_potencial_copas,
    ((p.stock_actual * p.copas_por_botella * COALESCE(p.precio_copa, 0)) - (p.stock_actual * p.precio_compra)) as beneficio_potencial_copas,

    -- Opción VIP
    p.precio_botella_vip,
    (p.stock_actual * COALESCE(p.precio_botella_vip, 0)) as valor_potencial_vip,
    ((p.stock_actual * COALESCE(p.precio_botella_vip, 0)) - (p.stock_actual * p.precio_compra)) as beneficio_potencial_vip,

    -- Comparación y recomendación
    CASE
        WHEN (p.stock_actual * p.copas_por_botella * COALESCE(p.precio_copa, 0)) > (p.stock_actual * COALESCE(p.precio_botella_vip, 0))
            THEN 'COPA'
        WHEN (p.stock_actual * COALESCE(p.precio_botella_vip, 0)) > (p.stock_actual * p.copas_por_botella * COALESCE(p.precio_copa, 0))
            THEN 'VIP'
        ELSE 'IGUAL'
    END as mejor_opcion,

    -- Diferencia de beneficio
    ABS(
        ((p.stock_actual * p.copas_por_botella * COALESCE(p.precio_copa, 0)) - (p.stock_actual * p.precio_compra)) -
        ((p.stock_actual * COALESCE(p.precio_botella_vip, 0)) - (p.stock_actual * p.precio_compra))
    ) as diferencia_beneficio,

    -- Margen copa (%)
    CASE
        WHEN p.precio_compra > 0 AND p.copas_por_botella > 0 AND p.precio_copa > 0
        THEN ((p.precio_copa - (p.precio_compra / p.copas_por_botella)) / (p.precio_compra / p.copas_por_botella)) * 100
        ELSE 0
    END as margen_copa_porcentaje,

    -- Margen VIP (%)
    CASE
        WHEN p.precio_compra > 0 AND p.precio_botella_vip > 0
        THEN ((p.precio_botella_vip - p.precio_compra) / p.precio_compra) * 100
        ELSE 0
    END as margen_vip_porcentaje,

    p.categoria,
    p.activo,
    p.creado_en,
    p.actualizado_en

FROM productos p
WHERE p.es_venta_dual = true
  AND p.stock_actual > 0
ORDER BY diferencia_beneficio DESC;

-- 6. Comentario en la vista
COMMENT ON VIEW valor_inventario_dual IS
'Vista para análisis de valor de inventario con venta dual. Muestra el valor potencial vendiendo en copas vs botellas VIP, con recomendaciones automáticas.';

-- 7. Crear índices adicionales para optimizar queries de venta dual
CREATE INDEX IF NOT EXISTS idx_productos_precio_copa
    ON productos(precio_copa)
    WHERE precio_copa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_productos_precio_vip
    ON productos(precio_botella_vip)
    WHERE precio_botella_vip IS NOT NULL;

-- 8. Log de migración
DO $$
BEGIN
    RAISE NOTICE 'V020: Sistema de Venta Dual habilitado correctamente';
    RAISE NOTICE 'V020: Vista valor_inventario_dual creada';
    RAISE NOTICE 'V020: Índices de optimización creados';
END $$;
