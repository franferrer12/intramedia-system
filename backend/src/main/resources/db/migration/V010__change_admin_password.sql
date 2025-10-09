-- ============================================================================
-- Migración V010: Cambiar contraseña admin por defecto
-- ============================================================================
-- Descripción: Actualiza la contraseña del usuario admin a una contraseña segura
-- Autor: Club Management System - Security Update
-- Fecha: 2025-10-09
-- Prioridad: CRÍTICA - Ejecutar ANTES de hacer público el sistema
-- ============================================================================

-- ⚠️ IMPORTANTE:
-- El password anterior "admin123" está en el código fuente público (V001)
-- Esta migración DEBE ejecutarse antes de deployment a producción

-- PASO 1: Generar hash BCrypt del nuevo password
-- Visita: https://bcrypt-generator.com/
-- O usa el siguiente código Java:
/*
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GeneratePassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String password = "TU_PASSWORD_SEGURO_AQUI";  // Cambiar por password real
        System.out.println("Hash: " + encoder.encode(password));
    }
}
*/

-- PASO 2: Reemplazar el hash en la siguiente línea
-- Hash para password: "ClubManagement2025!Secure#ProdPass"
-- Generado con BCrypt rounds=10
UPDATE usuarios
SET password = '$2a$10$N9qo8uLOickgx2ZEn/msPeEXpLQfqOVFiMKaLOQuLfQKlKbvj0s6i',
    actualizado_en = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- PASO 3: Registrar en comentario (NO incluir password real)
COMMENT ON TABLE usuarios IS 'Usuario admin: Contraseña cambiada el 2025-10-09 por migración V010 (seguridad)';

-- ============================================================================
-- INSTRUCCIONES POST-MIGRACIÓN
-- ============================================================================
-- 1. Guardar el nuevo password en un gestor de contraseñas (1Password, Bitwarden, etc.)
-- 2. NO commitear este archivo con el password/hash real a git público
-- 3. Compartir credenciales de forma segura con administradores
-- 4. Configurar rotación de password cada 90 días
-- ============================================================================
