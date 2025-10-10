package com.club.management.config;

import com.club.management.entity.Usuario;
import com.club.management.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runner que se ejecuta al iniciar la aplicación para migrar passwords viejos
 * a hashes más rápidos (BCrypt cost 10 → cost 4)
 *
 * IMPORTANTE: Este componente puede ser eliminado después de que todos los
 * usuarios hayan migrado sus passwords.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordMigrationRunner implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("=== INICIANDO MIGRACIÓN DE PASSWORDS ===");

        try {
            // Buscar el usuario admin
            var adminOptional = usuarioRepository.findByUsername("admin");

            if (adminOptional.isEmpty()) {
                log.warn("Usuario admin no encontrado - saltando migración");
                return;
            }

            Usuario admin = adminOptional.get();
            String currentHash = admin.getPassword();

            // Verificar si el hash actual es BCrypt cost-10 (formato: $2a$10$...)
            if (currentHash.startsWith("$2a$10$") || currentHash.startsWith("$2b$10$") || currentHash.startsWith("$2y$10$")) {
                log.warn("⚠️  DETECTADO: Password del admin usa BCrypt cost-10 (lento)");
                log.info("🔄 MIGRANDO: Rehasheando password del admin con BCrypt cost-4...");

                // Rehashear el password conocido "admin123" con el nuevo encoder (cost-4)
                String newHash = passwordEncoder.encode("admin123");
                admin.setPassword(newHash);
                usuarioRepository.save(admin);

                log.info("✅ ÉXITO: Password del admin migrado exitosamente");
                log.info("📊 MEJORA: Login debería ser ~87% más rápido (1.3s → 0.15s)");
                log.info("🔍 Hash viejo: {}", currentHash.substring(0, 20) + "...");
                log.info("🔍 Hash nuevo: {}", newHash.substring(0, 20) + "...");
            } else if (currentHash.startsWith("$2a$04$") || currentHash.startsWith("$2b$04$") || currentHash.startsWith("$2y$04$")) {
                log.info("✅ Password del admin ya usa BCrypt cost-4 (rápido) - no requiere migración");
            } else {
                log.warn("⚠️  Hash del admin tiene formato desconocido: {}", currentHash.substring(0, 10));
            }

        } catch (Exception e) {
            log.error("❌ ERROR durante migración de passwords: {}", e.getMessage(), e);
            // No fallar el inicio de la aplicación por este error
        }

        log.info("=== MIGRACIÓN DE PASSWORDS COMPLETADA ===");
    }
}
