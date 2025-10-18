package com.club.management.controller;

import com.club.management.dto.ConfiguracionSistemaDTO;
import com.club.management.dto.SystemLogDTO;
import com.club.management.dto.response.UsuarioDTO;
import com.club.management.entity.SystemLog;
import com.club.management.service.ConfiguracionService;
import com.club.management.service.SystemLogService;
import com.club.management.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final SystemLogService systemLogService;
    private final ConfiguracionService configuracionService;
    private final UsuarioService usuarioService;

    // ==================== SYSTEM LOGS ====================

    /**
     * Get system logs with filters
     */
    @GetMapping("/logs")
    public ResponseEntity<Page<SystemLogDTO>> obtenerLogs(
            @RequestParam(required = false) String nivel,
            @RequestParam(required = false) String modulo,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        SystemLog.Nivel nivelEnum = nivel != null ? SystemLog.Nivel.valueOf(nivel) : null;

        Page<SystemLogDTO> logs = systemLogService.buscarLogs(
                nivelEnum, modulo, usuarioId, fechaInicio, fechaFin, page, size
        );

        return ResponseEntity.ok(logs);
    }

    /**
     * Get recent logs for dashboard
     */
    @GetMapping("/logs/recent")
    public ResponseEntity<List<SystemLogDTO>> obtenerLogsRecientes(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(systemLogService.getRecentLogs(limit));
    }

    /**
     * Get log statistics
     */
    @GetMapping("/logs/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasLogs() {
        return ResponseEntity.ok(systemLogService.getEstadisticas());
    }

    /**
     * Get all distinct modules
     */
    @GetMapping("/logs/modulos")
    public ResponseEntity<List<String>> obtenerModulos() {
        return ResponseEntity.ok(systemLogService.getModulos());
    }

    /**
     * Clean up old logs
     */
    @DeleteMapping("/logs/limpiar")
    public ResponseEntity<Void> limpiarLogsAntiguos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fecha
    ) {
        systemLogService.limpiarLogsAntiguos(fecha);
        return ResponseEntity.noContent().build();
    }

    // ==================== CONFIGURATION ====================

    /**
     * Get all configurations
     */
    @GetMapping("/configuracion")
    public ResponseEntity<List<ConfiguracionSistemaDTO>> obtenerConfiguraciones() {
        return ResponseEntity.ok(configuracionService.getAllConfiguraciones());
    }

    /**
     * Get configurations by category
     */
    @GetMapping("/configuracion/categoria/{categoria}")
    public ResponseEntity<List<ConfiguracionSistemaDTO>> obtenerConfiguracionesPorCategoria(
            @PathVariable String categoria
    ) {
        return ResponseEntity.ok(configuracionService.getConfiguracionesByCategoria(categoria));
    }

    /**
     * Get all categories
     */
    @GetMapping("/configuracion/categorias")
    public ResponseEntity<List<String>> obtenerCategorias() {
        return ResponseEntity.ok(configuracionService.getCategorias());
    }

    /**
     * Get configuration by key
     */
    @GetMapping("/configuracion/{clave}")
    public ResponseEntity<ConfiguracionSistemaDTO> obtenerConfiguracion(
            @PathVariable String clave
    ) {
        return ResponseEntity.ok(configuracionService.getConfiguracion(clave));
    }

    /**
     * Update configuration
     */
    @PutMapping("/configuracion/{clave}")
    public ResponseEntity<ConfiguracionSistemaDTO> actualizarConfiguracion(
            @PathVariable String clave,
            @RequestParam String valor,
            @RequestHeader("Authorization") String token
    ) {
        // Extract user ID from token (simplified - in real app, get from SecurityContext)
        Long usuarioId = usuarioService.getCurrentUserId();

        ConfiguracionSistemaDTO updated = configuracionService.updateConfiguracion(clave, valor, usuarioId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Create new configuration
     */
    @PostMapping("/configuracion")
    public ResponseEntity<ConfiguracionSistemaDTO> crearConfiguracion(
            @Valid @RequestBody ConfiguracionSistemaDTO dto,
            @RequestHeader("Authorization") String token
    ) {
        Long usuarioId = usuarioService.getCurrentUserId();
        ConfiguracionSistemaDTO created = configuracionService.crearConfiguracion(dto, usuarioId);
        return ResponseEntity.ok(created);
    }

    /**
     * Delete configuration
     */
    @DeleteMapping("/configuracion/{clave}")
    public ResponseEntity<Void> eliminarConfiguracion(@PathVariable String clave) {
        configuracionService.eliminarConfiguracion(clave);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search configurations
     */
    @GetMapping("/configuracion/buscar")
    public ResponseEntity<List<ConfiguracionSistemaDTO>> buscarConfiguraciones(
            @RequestParam String query
    ) {
        return ResponseEntity.ok(configuracionService.buscarConfiguraciones(query));
    }

    /**
     * Get configuration map
     */
    @GetMapping("/configuracion/mapa")
    public ResponseEntity<Map<String, String>> obtenerMapaConfiguracion() {
        return ResponseEntity.ok(configuracionService.getConfiguracionMap());
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all users
     */
    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioDTO>> obtenerUsuarios() {
        return ResponseEntity.ok(usuarioService.getAllUsuarios());
    }

    /**
     * Get user by ID
     */
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<UsuarioDTO> obtenerUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.getUsuarioById(id));
    }

    /**
     * Update user role
     */
    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<UsuarioDTO> actualizarRolUsuario(
            @PathVariable Long id,
            @RequestParam String rol
    ) {
        return ResponseEntity.ok(usuarioService.updateRol(id, rol));
    }

    /**
     * Activate/deactivate user
     */
    @PutMapping("/usuarios/{id}/activo")
    public ResponseEntity<UsuarioDTO> toggleUsuarioActivo(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.toggleActivo(id));
    }

    /**
     * Reset user password (generates temporary password)
     */
    @PostMapping("/usuarios/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetearPassword(@PathVariable Long id) {
        String tempPassword = usuarioService.resetPassword(id);
        return ResponseEntity.ok(Map.of(
                "message", "Contraseña reseteada exitosamente",
                "temporaryPassword", tempPassword
        ));
    }

    /**
     * Get user statistics
     */
    @GetMapping("/usuarios/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasUsuarios() {
        return ResponseEntity.ok(usuarioService.getEstadisticas());
    }

    // ==================== SYSTEM HEALTH ====================

    /**
     * Get system health information
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> obtenerEstadoSistema() {
        Map<String, Object> health = Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "logStats", systemLogService.getEstadisticas(),
                "userStats", usuarioService.getEstadisticas()
        );
        return ResponseEntity.ok(health);
    }
}
