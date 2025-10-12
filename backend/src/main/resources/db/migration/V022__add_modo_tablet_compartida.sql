-- ============================================
-- MIGRACIÓN V022: Modo Tablet Compartida
-- Fecha: 12 Octubre 2025
-- Descripción: Agregar soporte para modo tablet compartida
--              donde múltiples empleados usan el mismo dispositivo
-- ============================================

-- Agregar campo para activar modo tablet compartida
ALTER TABLE dispositivos_pos
ADD COLUMN modo_tablet_compartida BOOLEAN DEFAULT false;

-- Agregar relación de empleado a ventas offline (para tracking por empleado)
ALTER TABLE ventas_pendientes_sync
ADD COLUMN empleado_id BIGINT REFERENCES empleados(id) ON DELETE SET NULL;

-- Índice para consultas por empleado
CREATE INDEX idx_ventas_pendientes_empleado ON ventas_pendientes_sync(empleado_id);

-- Comentarios
COMMENT ON COLUMN dispositivos_pos.modo_tablet_compartida IS
'Si está activado, solicita al empleado identificarse con PIN antes de cada venta';

COMMENT ON COLUMN ventas_pendientes_sync.empleado_id IS
'ID del empleado que realizó la venta (para tablets compartidas)';
