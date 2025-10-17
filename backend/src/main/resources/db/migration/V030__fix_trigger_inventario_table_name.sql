-- ============================================
-- Migración: V030 - Corregir trigger descontar_stock_venta
-- Descripción: El trigger debe usar productos.stock_actual directamente (no JOIN con inventarios)
-- Fecha: 2025-10-15
-- ============================================

-- Recrear la función CORRECTAMENTE usando productos.stock_actual
CREATE OR REPLACE FUNCTION descontar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_producto RECORD;
    v_stock_actual NUMERIC(10,2);
BEGIN
    -- Obtener datos del producto (stock_actual está en la tabla productos)
    SELECT id, nombre, stock_actual
    INTO v_producto
    FROM productos
    WHERE id = NEW.producto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no encontrado', NEW.producto_id;
    END IF;

    v_stock_actual := v_producto.stock_actual;

    -- Verificar stock disponible
    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para producto "%". Disponible: %, Solicitado: %',
            v_producto.nombre, v_stock_actual, NEW.cantidad;
    END IF;

    -- Descontar del stock del producto
    UPDATE productos
    SET stock_actual = stock_actual - NEW.cantidad,
        actualizado_en = CURRENT_TIMESTAMP
    WHERE id = NEW.producto_id;

    -- Registrar movimiento de stock
    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo,
        referencia,
        fecha_movimiento
    )
    VALUES (
        NEW.producto_id,
        'SALIDA',
        NEW.cantidad,
        v_stock_actual,
        v_stock_actual - NEW.cantidad,
        'Venta POS',
        'Venta #' || (SELECT numero_ticket FROM ventas WHERE id = NEW.venta_id),
        CURRENT_TIMESTAMP
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya existe, no necesita recrearse
COMMENT ON FUNCTION descontar_stock_venta() IS 'Descuenta stock del producto al registrar una venta. CORREGIDO: Usa productos.stock_actual directamente';
