package com.club.management.controller;

import com.club.management.service.DispositivoPOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller para el sistema de vinculación (pairing) de dispositivos POS.
 *
 * Ubicado en /api/auth/device/** para bypasear el WAF de Railway.
 * Este path está whitelisteado en SecurityConfig.
 */
@RestController
@RequestMapping("/api/auth/device")
@RequiredArgsConstructor
public class DevicePairingController {

    private final DispositivoPOSService dispositivoPOSService;

    /**
     * GET /api/auth/device/{id}/qr
     * Genera un código de emparejamiento temporal (1 hora de validez).
     * Solo para ADMIN/GERENTE autenticados.
     */
    @GetMapping("/{id}/qr")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<com.club.management.dto.response.PairingTokenDTO> generarQR(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.generarTokenPairing(id));
    }

    /**
     * GET /api/auth/device/setup
     * Vincula un dispositivo usando un código de setup (pairing key).
     * Endpoint PÚBLICO - no requiere autenticación previa.
     */
    @GetMapping("/setup")
    public ResponseEntity<com.club.management.dto.response.DeviceAuthDTO> setup(
            @RequestParam String p) {
        return ResponseEntity.ok(dispositivoPOSService.vincularPorToken(p));
    }

    /**
     * GET /api/auth/device/pair
     * Vincula un dispositivo usando un PIN corto (ej: "842-931").
     * Endpoint PÚBLICO - alternativa al código para ingreso manual.
     */
    @GetMapping("/pair")
    public ResponseEntity<com.club.management.dto.response.DeviceAuthDTO> pair(
            @RequestParam String code) {
        return ResponseEntity.ok(dispositivoPOSService.vincularPorCodigo(code));
    }
}
