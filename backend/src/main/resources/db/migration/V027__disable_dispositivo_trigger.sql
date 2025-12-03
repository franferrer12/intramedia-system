-- ============================================================================
-- Migration V027: Disable problematic dispositivos_pos trigger
-- ============================================================================
-- Fecha: 13 Octubre 2025
-- Descripción: Deshabilita temporalmente el trigger que causa errores 500
--              en el endpoint /api/auth/device/{id}/qr
--              El trigger intenta serializar entidades complejas a JSONB
--              causando "operator does not exist" errors
-- ============================================================================

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_dispositivos_pos_log ON dispositivos_pos;

-- Eliminar la función (opcional, pero recomendado para limpiar)
DROP FUNCTION IF EXISTS log_dispositivo_actividad();

-- Comentario explicativo
COMMENT ON TABLE dispositivos_pos_logs IS
'Tabla de auditoría de dispositivos POS.
NOTA: El trigger automático fue deshabilitado en V027 debido a problemas de serialización JSONB.
Los logs deben ser insertados manualmente desde la aplicación Java.';

-- ============================================================================
-- NOTAS:
-- ============================================================================
/*
PROBLEMA:
El trigger log_dispositivo_actividad() fallaba al intentar serializar
la entidad completa DispositivoPOS a JSONB, especialmente cuando contenía
relaciones JPA (empleadoAsignado, etc).

SÍNTOMA:
- Endpoint /api/auth/device/{id}/qr retornaba 500 Internal Server Error
- Log mostraba: "operator does not exist: jsonb - jsonb" o errores similares

SOLUCIÓN TEMPORAL:
Deshabilitar el trigger y permitir que la aplicación Java maneje
el logging manualmente a través del método registrarLogInterno()
en DispositivoPOSService.java

SOLUCIÓN PERMANENTE (futura):
Crear un trigger más simple que solo registre cambios de campos específicos
sin intentar serializar toda la entidad:
- Solo registrar: activo, ubicacion, empleado_asignado_id, etc.
- Evitar serializar relaciones JPA complejas
*/

-- ============================================================================
-- FIN DE MIGRATION V027
-- ============================================================================
