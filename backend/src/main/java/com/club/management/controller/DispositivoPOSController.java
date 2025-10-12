package com.club.management.controller;

import com.club.management.dto.*;
import com.club.management.service.DispositivoPOSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispositivos-pos")
@RequiredArgsConstructor
public class DispositivoPOSController {

    private final DispositivoPOSService dispositivoPOSService;

    // ============================================
    // GESTIÓN DE DISPOSITIVOS (Admin)
    // ============================================

    @PostMapping("/registrar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<DispositivoPOSDTO> registrarDispositivo(
            @Valid @RequestBody DispositivoPOSRequest request) {
        DispositivoPOSDTO dispositivo = dispositivoPOSService.registrar(request);
        return ResponseEntity.ok(dispositivo);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<List<DispositivoPOSDTO>> listarTodos() {
        return ResponseEntity.ok(dispositivoPOSService.listarTodos());
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<List<DispositivoPOSDTO>> listarActivos() {
        return ResponseEntity.ok(dispositivoPOSService.listarActivos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<DispositivoPOSDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<DispositivoPOSDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DispositivoPOSRequest request) {
        return ResponseEntity.ok(dispositivoPOSService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        dispositivoPOSService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================
    // AUTENTICACIÓN DE DISPOSITIVOS
    // ============================================

    @PostMapping("/autenticar")
    public ResponseEntity<AuthDispositivoDTO> autenticarConPIN(
            @RequestParam String uuid,
            @RequestParam String pin) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(uuid, pin);
        return ResponseEntity.ok(auth);
    }

    @GetMapping("/{id}/configuracion")
    public ResponseEntity<ConfiguracionPOSDTO> obtenerConfiguracion(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerConfiguracion(id));
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> registrarHeartbeat(@PathVariable Long id) {
        dispositivoPOSService.registrarHeartbeat(id);
        return ResponseEntity.ok().build();
    }

    // ============================================
    // SINCRONIZACIÓN OFFLINE
    // ============================================

    @PostMapping("/ventas-offline/sincronizar")
    public ResponseEntity<List<ResultadoSincronizacionDTO>> sincronizarVentasOffline(
            @Valid @RequestBody List<VentaOfflineDTO> ventas,
            @RequestParam Long dispositivoId) {
        List<ResultadoSincronizacionDTO> resultados =
                dispositivoPOSService.sincronizarVentasOffline(ventas, dispositivoId);
        return ResponseEntity.ok(resultados);
    }

    @GetMapping("/{id}/ventas-pendientes")
    public ResponseEntity<List<VentaOfflineDTO>> obtenerVentasPendientes(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerVentasPendientes(id));
    }

    // ============================================
    // LOGS Y AUDITORÍA
    // ============================================

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<List<DispositivoLogDTO>> obtenerLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerLogs(id, limit));
    }

    @PostMapping("/{id}/log")
    public ResponseEntity<Void> registrarLog(
            @PathVariable Long id,
            @RequestParam String tipoEvento,
            @RequestParam String descripcion,
            @RequestBody(required = false) Map<String, Object> metadata) {
        dispositivoPOSService.registrarLog(id, tipoEvento, descripcion, metadata);
        return ResponseEntity.ok().build();
    }
}
