-- ============================================================================
-- Migración V012: Corregir contraseña del usuario admin
-- ============================================================================
-- Descripción: Actualiza la contraseña del admin a 'admin123' (hash correcto)
-- Autor: Club Management System
-- Fecha: 2025-10-09
-- ============================================================================

-- Actualizar contraseña del admin a 'admin123'
-- Hash BCrypt con strength 10 para 'admin123' (generado con Spring BCryptPasswordEncoder)
UPDATE usuarios
SET password = '$2a$10$0zGHF6c/rqk70xdW.2PLmeaDI2CUIwAz8RRC5m2w4Qrefvb0MPOMO',
    actualizado_en = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- Verificar que se actualizó correctamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios
        WHERE username = 'admin'
        AND password = '$2a$10$0zGHF6c/rqk70xdW.2PLmeaDI2CUIwAz8RRC5m2w4Qrefvb0MPOMO'
    ) THEN
        RAISE EXCEPTION 'La contraseña del admin no se actualizó correctamente';
    END IF;
END $$;

COMMENT ON TABLE usuarios IS 'Credenciales: admin / admin123 (CAMBIAR EN PRODUCCIÓN)';
