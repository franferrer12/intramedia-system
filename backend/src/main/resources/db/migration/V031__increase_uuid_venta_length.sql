-- ============================================
-- Migración: V031 - Aumentar longitud de uuid_venta
-- Descripción: Aumenta el tamaño de uuid_venta para soportar UUIDs compuestos
--              generados por el frontend (deviceUUID-timestamp-random)
-- Fecha: 2025-10-15
-- ============================================

ALTER TABLE ventas_pendientes_sync
ALTER COLUMN uuid_venta TYPE VARCHAR(100);

-- También actualizar índice único si existe
DROP INDEX IF EXISTS idx_ventas_pendientes_sync_uuid;
CREATE UNIQUE INDEX idx_ventas_pendientes_sync_uuid ON ventas_pendientes_sync(uuid_venta);
