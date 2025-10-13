-- ============================================================================
-- Migration V026: Fix log_dispositivo_actividad trigger
-- ============================================================================
-- Fecha: 13 Octubre 2025
-- Descripción: Corrige el trigger que fallaba con "operator does not exist: jsonb - jsonb"
--              Simplificamos la función para que almacene el estado completo
--              en lugar de intentar calcular los cambios con operador JSONB
-- ============================================================================

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_dispositivos_pos_log ON dispositivos_pos;

-- Reemplazar la función con una versión simplificada
CREATE OR REPLACE FUNCTION log_dispositivo_actividad()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dispositivos_pos_logs (dispositivo_id, tipo_evento, descripcion, metadata)
    VALUES (
        NEW.id,
        'ACTUALIZACION',
        'Dispositivo actualizado',
        jsonb_build_object(
            'estado_nuevo', to_jsonb(NEW),
            'estado_anterior', to_jsonb(OLD),
            'actualizado_en', NOW()
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trigger_dispositivos_pos_log
AFTER UPDATE ON dispositivos_pos
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION log_dispositivo_actividad();

-- Comentario
COMMENT ON FUNCTION log_dispositivo_actividad() IS
'Registra automáticamente actualizaciones de dispositivos POS en la tabla de logs.
Almacena el estado completo antes y después de la actualización.';

-- ============================================================================
-- NOTAS:
-- ============================================================================
/*
PROBLEMA ANTERIOR:
La función intentaba usar: to_jsonb(NEW) - to_jsonb(OLD)
El operador - para JSONB puede no estar disponible o fallar con tipos complejos.

SOLUCIÓN:
Almacenamos el estado completo (NEW y OLD) en lugar de intentar calcular
los cambios. Esto es más confiable y permite analizar los cambios
en la aplicación si es necesario.

VENTAJAS:
- Compatible con todas las versiones de PostgreSQL
- No depende de operadores JSONB avanzados
- Más información disponible para auditoría
- Permite reconstruir historial completo
*/

-- ============================================================================
-- FIN DE MIGRATION V026
-- ============================================================================
