-- Fix descontar_stock_consumo() trigger to set stock_anterior and stock_nuevo
-- This fixes DataIntegrityViolationException when registering consumptions in POS

CREATE OR REPLACE FUNCTION descontar_stock_consumo()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo_venta VARCHAR(20);
    v_unidades_reales DECIMAL(10,2);
    v_cantidad_botellas DECIMAL(10,2);
    v_stock_anterior DECIMAL(10,2);  -- Capture stock before update
    v_stock_nuevo DECIMAL(10,2);     -- Calculate stock after update
BEGIN
    -- Obtener tipo de venta, unidades reales y stock actual del producto
    SELECT tipo_venta, unidades_reales, stock_actual
    INTO v_tipo_venta, v_unidades_reales, v_stock_anterior
    FROM productos
    WHERE id = NEW.producto_id;

    -- Calcular cuántas botellas se consumen
    IF v_tipo_venta IN ('COPA', 'CHUPITO') AND v_unidades_reales IS NOT NULL AND v_unidades_reales > 0 THEN
        v_cantidad_botellas := NEW.cantidad / v_unidades_reales;
    ELSE
        v_cantidad_botellas := NEW.cantidad;
    END IF;

    -- Calcular nuevo stock
    v_stock_nuevo := v_stock_anterior - v_cantidad_botellas;

    -- Actualizar stock del producto
    UPDATE productos
    SET stock_actual = v_stock_nuevo, actualizado_en = NOW()
    WHERE id = NEW.producto_id;

    -- Registrar movimiento de stock CON stock_anterior y stock_nuevo
    INSERT INTO movimientos_stock (
        producto_id, tipo_movimiento, cantidad,
        stock_anterior, stock_nuevo,
        motivo, referencia, fecha_movimiento
    ) VALUES (
        NEW.producto_id, 'SALIDA', v_cantidad_botellas,
        v_stock_anterior, v_stock_nuevo,
        'Consumo POS - Sesión ' || NEW.sesion_id,
        'CONSUMO_' || NEW.id, NEW.fecha_consumo
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
