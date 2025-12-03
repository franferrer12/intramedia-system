-- ============================================================================
-- Migration V024: Sistema Híbrido de Vinculación de Dispositivos POS
-- ============================================================================
-- Fecha: 12 Octubre 2025
-- Descripción: Añade soporte para dos modos de vinculación:
--   1. QUICK START (asignacion_permanente = false): Vinculación temporal automática
--   2. ASIGNACIÓN FIJA (asignacion_permanente = true): Vinculación permanente manual
-- ============================================================================

-- Añadir columna de tipo de asignación
ALTER TABLE dispositivos_pos
ADD COLUMN IF NOT EXISTS asignacion_permanente BOOLEAN NOT NULL DEFAULT false;

-- Comentarios
COMMENT ON COLUMN dispositivos_pos.asignacion_permanente IS 'Tipo de vinculación: false = temporal (quick start), true = permanente (asignación fija)';

-- Índice para consultas de dispositivos con asignación permanente
CREATE INDEX IF NOT EXISTS idx_dispositivos_pos_asignacion_permanente
ON dispositivos_pos(asignacion_permanente);

-- ============================================================================
-- CÓMO FUNCIONA EL SISTEMA:
-- ============================================================================
/*
MODO 1: QUICK START (asignacion_permanente = false)
- El empleado escanea su código/introduce PIN en CUALQUIER dispositivo disponible
- El sistema vincula TEMPORALMENTE al empleado con ese dispositivo para esa sesión
- Cuando termina la sesión, se desvincula automáticamente
- Permite flexibilidad máxima: cualquier empleado puede usar cualquier dispositivo

MODO 2: ASIGNACIÓN FIJA (asignacion_permanente = true)
- El administrador ASIGNA PERMANENTEMENTE un dispositivo a un empleado específico
- Solo ese empleado puede usar ese dispositivo
- Si otro empleado intenta usarlo, se rechaza
- Útil para puestos fijos o cuando se requiere control estricto

VENTAJAS:
- Quick Start: Máxima flexibilidad, ideal para barras compartidas
- Asignación Fija: Control estricto, ideal para cajas principales
- El administrador decide qué modo usar para cada dispositivo
*/

-- ============================================================================
-- FIN DE MIGRATION V024
-- ============================================================================
