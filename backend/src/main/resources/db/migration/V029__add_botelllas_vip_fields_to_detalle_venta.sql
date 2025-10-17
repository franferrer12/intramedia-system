-- ============================================
-- Migración: V029 - Agregar campos sistema Botellas VIP a detalle_venta
-- Descripción: Agrega campos opcionales para el sistema de venta de botellas VIP
-- Fecha: 2025-10-14
-- ============================================

-- Campos para sistema de Botellas VIP (todos opcionales/nullable)
ALTER TABLE detalle_venta
ADD COLUMN IF NOT EXISTS tipo_venta VARCHAR(20) DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS es_copa_individual BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS botella_abierta_id BIGINT,  -- FK se agregará cuando exista tabla botellas_abiertas
ADD COLUMN IF NOT EXISTS copas_vendidas INTEGER,
ADD COLUMN IF NOT EXISTS descuento_pack_vip DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS notas_venta TEXT;

-- Índice para botella_abierta_id (sin FK por ahora)
CREATE INDEX IF NOT EXISTS idx_detalle_venta_botella_abierta
ON detalle_venta(botella_abierta_id)
WHERE botella_abierta_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_detalle_venta_tipo_venta
ON detalle_venta(tipo_venta)
WHERE tipo_venta != 'NORMAL';

-- Comentarios sobre el uso de los campos
COMMENT ON COLUMN detalle_venta.tipo_venta IS 'Tipo de venta: NORMAL, BOTELLA_COMPLETA, COPA_INDIVIDUAL, PACK_VIP';
COMMENT ON COLUMN detalle_venta.es_copa_individual IS 'TRUE si es venta de copas individuales de una botella VIP';
COMMENT ON COLUMN detalle_venta.botella_abierta_id IS 'Referencia a la botella abierta si es venta de copas individuales';
COMMENT ON COLUMN detalle_venta.copas_vendidas IS 'Número de copas vendidas de la botella (si aplica)';
COMMENT ON COLUMN detalle_venta.descuento_pack_vip IS 'Descuento especial aplicado en packs VIP';
COMMENT ON COLUMN detalle_venta.notas_venta IS 'Notas adicionales sobre la venta (mesa VIP, reserva, etc.)';
