package com.club.management.controller;

import com.club.management.dto.AuthDispositivoDTO;
import com.club.management.dto.PairingTokenDTO;
import com.club.management.service.DispositivoPOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador público para autenticación de dispositivos POS.
 * Estos endpoints NO requieren autenticación JWT previa.
 */
@RestController
@RequestMapping("/api/pos-auth")
@RequiredArgsConstructor
public class DispositivoAuthController {

    private final DispositivoPOSService dispositivoPOSService;

    /**
     * Autentica un dispositivo usando UUID y PIN (método tradicional).
     * Este endpoint es público y NO requiere JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDispositivoDTO> autenticarConPIN(
            @RequestParam String uuid,
            @RequestParam String pin) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(uuid, pin);
        return ResponseEntity.ok(auth);
    }

    /**
     * Autentica un dispositivo usando un token de emparejamiento.
     * Este endpoint es público y NO requiere JWT.
     */
    @PostMapping("/login-with-token")
    public ResponseEntity<AuthDispositivoDTO> autenticarConToken(
            @RequestParam String pairingToken) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConToken(pairingToken);
        return ResponseEntity.ok(auth);
    }

    /**
     * Autentica un dispositivo usando email o DNI de empleado (Quick Start).
     * Este endpoint es público y NO requiere JWT.
     */
    @PostMapping("/login-with-employee")
    public ResponseEntity<AuthDispositivoDTO> autenticarConIdentificadorEmpleado(
            @RequestParam String identifier) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConIdentificadorEmpleado(identifier);
        return ResponseEntity.ok(auth);
    }
}
