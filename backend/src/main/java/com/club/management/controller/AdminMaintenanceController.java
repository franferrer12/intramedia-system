package com.club.management.controller;

import com.club.management.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador temporal para tareas de mantenimiento
 * NOTA: Eliminar después de ejecutar las tareas necesarias
 */
@RestController
@RequestMapping("/api/admin/maintenance")
@RequiredArgsConstructor
public class AdminMaintenanceController {

    private final UsuarioRepository usuarioRepository;

    /**
     * Endpoint temporal para actualizar el hash del password del admin a BCrypt cost=4
     * Este endpoint rehashea el password 'admin123' con cost factor 4 para mejor performance
     */
    @PostMapping("/rehash-admin-password")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> rehashAdminPassword() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Ejecutar update SQL directo
            int updated = usuarioRepository.updateAdminPasswordHash(
                "$2y$04$gj602DDev6dFCqXcURHydOeJ1lt0tnB4OUlZveQuSAGy56xOrgCBe"
            );

            response.put("success", true);
            response.put("message", "Password hash actualizado correctamente");
            response.put("rowsAffected", updated);
            response.put("note", "Login debería ser ~87% más rápido (1.3s → 0.15s)");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint para verificar el hash actual del admin
     */
    @PostMapping("/check-admin-hash")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> checkAdminHash() {
        Map<String, Object> response = new HashMap<>();

        var admin = usuarioRepository.findByUsername("admin");
        if (admin.isPresent()) {
            String hash = admin.get().getPassword();
            String prefix = hash.substring(0, Math.min(10, hash.length()));

            response.put("hashPrefix", prefix);
            response.put("isCost4", prefix.startsWith("$2y$04$") || prefix.startsWith("$2a$04$"));
            response.put("isCost10", prefix.startsWith("$2a$10$"));
            response.put("note", prefix.startsWith("$2y$04$") || prefix.startsWith("$2a$04$")
                ? "✅ Hash rápido (cost=4) - Login debería ser rápido"
                : "⚠️ Hash lento (cost=10) - Login será lento");

            return ResponseEntity.ok(response);
        }

        response.put("error", "Usuario admin no encontrado");
        return ResponseEntity.notFound().build();
    }
}
