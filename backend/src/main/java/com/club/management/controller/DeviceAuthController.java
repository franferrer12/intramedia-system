package com.club.management.controller;

import com.club.management.dto.AuthDispositivoDTO;
import com.club.management.dto.request.DeviceLoginRequest;
import com.club.management.service.DispositivoPOSService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador de autenticación de dispositivos bajo /api/auth/device/**
 *
 * Como /public/** parece estar bloqueado por Railway, intentamos
 * usar el mismo path que funciona para login de usuarios: /api/auth/**
 */
@RestController
@RequestMapping("/api/auth/device")
@RequiredArgsConstructor
@Tag(name = "Device Authentication", description = "Autenticación de dispositivos POS")
public class DeviceAuthController {

    private final DispositivoPOSService dispositivoPOSService;

    /**
     * POST /api/auth/device/login
     * Autentica un dispositivo POS usando UUID y PIN.
     */
    @PostMapping("/login")
    @Operation(summary = "Login de dispositivo POS", description = "Autentica usando UUID y PIN")
    public ResponseEntity<AuthDispositivoDTO> login(@Valid @RequestBody DeviceLoginRequest request) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(
            request.getUuid(),
            request.getPin()
        );
        return ResponseEntity.ok(auth);
    }

    /**
     * POST /api/auth/device/pairing
     * Autentica usando token de emparejamiento.
     */
    @PostMapping("/pairing")
    @Operation(summary = "Login con token de pairing")
    public ResponseEntity<AuthDispositivoDTO> authenticateWithToken(@RequestParam String pairingToken) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConToken(pairingToken);
        return ResponseEntity.ok(auth);
    }

    /**
     * POST /api/auth/device/quick-start
     * Quick Start: Autentica usando email o DNI de empleado.
     */
    @PostMapping("/quick-start")
    @Operation(summary = "Quick Start con credenciales de empleado")
    public ResponseEntity<AuthDispositivoDTO> quickStart(@RequestParam String identifier) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConIdentificadorEmpleado(identifier);
        return ResponseEntity.ok(auth);
    }
}
