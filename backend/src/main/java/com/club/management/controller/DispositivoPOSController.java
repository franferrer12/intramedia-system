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
    // AUTENTICACIÓN Y EMPAREJAMIENTO DE DISPOSITIVOS
    // ============================================

    /**
     * Genera un token de emparejamiento para vincular un dispositivo de forma sencilla.
     * El token puede usarse para generar un QR o un enlace que el dispositivo escanea/abre.
     */
    @PostMapping("/{id}/generar-token-pairing")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<PairingTokenDTO> generarTokenEmparejamiento(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.generarTokenEmparejamiento(id));
    }

    /**
     * Autentica un dispositivo usando un token de emparejamiento.
     * Permite al dispositivo conectarse sin ingresar manualmente UUID y PIN.
     */
    @PostMapping("/autenticar-con-token")
    public ResponseEntity<AuthDispositivoDTO> autenticarConToken(
            @RequestParam String pairingToken) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConToken(pairingToken);
        return ResponseEntity.ok(auth);
    }

    /**
     * Autentica un dispositivo usando email o DNI de empleado.
     * Permite al POS terminal iniciar sesión con identificador de empleado sin conocer UUID.
     * Solo funciona con dispositivos en modo Quick Start (asignación temporal).
     */
    @PostMapping("/autenticar-con-empleado")
    public ResponseEntity<AuthDispositivoDTO> autenticarConIdentificadorEmpleado(
            @RequestParam String identifier) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConIdentificadorEmpleado(identifier);
        return ResponseEntity.ok(auth);
    }

    /**
     * Autentica un dispositivo usando UUID y PIN (método tradicional).
     */
    @PostMapping("/autenticar")
    public ResponseEntity<AuthDispositivoDTO> autenticarConPIN(
            @RequestParam String uuid,
            @RequestParam String pin) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(uuid, pin);
        return ResponseEntity.ok(auth);
    }

    // ============================================
    // VINCULACIÓN TEMPORAL (QUICK START)
    // ============================================

    /**
     * Vincula temporalmente un empleado a un dispositivo no asignado permanentemente.
     * Permite que cualquier empleado use cualquier dispositivo disponible (modo Quick Start).
     */
    @PostMapping("/{id}/vincular-temporal")
    public ResponseEntity<DispositivoPOSDTO> vincularTemporalmente(
            @PathVariable Long id,
            @RequestParam Long empleadoId) {
        return ResponseEntity.ok(dispositivoPOSService.vincularTemporalmente(id, empleadoId));
    }

    /**
     * Desvincula el empleado actualmente asignado temporalmente a un dispositivo.
     * Útil cuando un empleado termina su turno o sesión.
     */
    @PostMapping("/{id}/desvincular")
    public ResponseEntity<DispositivoPOSDTO> desvincular(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.desvincular(id));
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
