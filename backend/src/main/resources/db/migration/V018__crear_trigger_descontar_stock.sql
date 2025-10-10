-- =====================================================
-- MIGRACIÓN V018: Crear trigger para descontar stock
-- =====================================================
-- Este trigger se ejecuta automáticamente cuando se registra un consumo
-- en una sesión POS, actualizando el stock del producto y registrando
-- el movimiento en la tabla movimientos_stock.

-- La función descontar_stock_consumo() ya fue creada en V017
-- Esta migración solo crea el trigger que la invoca

-- Verificar si el trigger ya existe (idempotencia)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'descontar_stock_consumo_trigger'
    ) THEN
        CREATE TRIGGER descontar_stock_consumo_trigger
        AFTER INSERT ON consumos_sesion
        FOR EACH ROW
        EXECUTE FUNCTION descontar_stock_consumo();
    END IF;
END $$;
