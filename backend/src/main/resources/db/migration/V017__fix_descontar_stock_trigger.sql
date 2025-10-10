-- =====================================================
-- MIGRACIÓN V017: Fix trigger descontar_stock_consumo
-- Añadir stock_anterior y stock_nuevo al registro de movimiento
-- =====================================================

CREATE OR REPLACE FUNCTION descontar_stock_consumo()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo_venta VARCHAR(20);
    v_unidades_reales DECIMAL(10,2);
    v_cantidad_botellas DECIMAL(10,2);
    v_stock_anterior DECIMAL(10,2);
    v_stock_nuevo DECIMAL(10,2);
BEGIN
    -- Obtener tipo de venta, unidades reales y stock actual del producto
    SELECT tipo_venta, unidades_reales, stock_actual
    INTO v_tipo_venta, v_unidades_reales, v_stock_anterior
    FROM productos
    WHERE id = NEW.producto_id;

    -- Calcular cuántas botellas se consumen
    IF v_tipo_venta IN ('COPA', 'CHUPITO') AND v_unidades_reales IS NOT NULL AND v_unidades_reales > 0 THEN
        -- Convertir copas/chupitos a botellas
        -- Ejemplo: 2 copas / 9 copas por botella = 0.22 botellas
        v_cantidad_botellas := NEW.cantidad / v_unidades_reales;
    ELSE
        -- Venta de botella completa
        v_cantidad_botellas := NEW.cantidad;
    END IF;

    -- Calcular nuevo stock
    v_stock_nuevo := v_stock_anterior - v_cantidad_botellas;

    -- Actualizar stock del producto
    UPDATE productos
    SET
        stock_actual = v_stock_nuevo,
        actualizado_en = NOW()
    WHERE id = NEW.producto_id;

    -- Registrar movimiento de stock CON stock_anterior y stock_nuevo
    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo,
        referencia,
        fecha_movimiento
    ) VALUES (
        NEW.producto_id,
        'SALIDA',
        v_cantidad_botellas,
        v_stock_anterior,
        v_stock_nuevo,
        'Consumo POS - Sesión ' || NEW.sesion_id,
        'CONSUMO_' || NEW.id,
        NEW.fecha_consumo
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
