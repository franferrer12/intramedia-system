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
 * Controlador público para autenticación de dispositivos POS.
 *
 * Este controlador está FUERA del path /api/** para evitar problemas
 * con Spring Security que bloquea requests con UUIDs.
 *
 * Endpoints: /public/pos/*
 */
@RestController
@RequestMapping("/public/pos")
@RequiredArgsConstructor
@Tag(name = "Public POS Authentication", description = "Endpoints públicos para autenticación de dispositivos POS")
public class PublicPOSController {

    private final DispositivoPOSService dispositivoPOSService;

    /**
     * POST /public/pos/auth
     * Autentica un dispositivo POS usando UUID y PIN.
     *
     * Este endpoint NO requiere autenticación JWT previa.
     *
     * @param request Credenciales del dispositivo (uuid y pin)
     * @return Token JWT y datos del dispositivo autenticado
     */
    @PostMapping("/auth")
    @Operation(
        summary = "Autenticar dispositivo POS",
        description = "Autentica un dispositivo POS usando UUID y PIN. Retorna un token JWT válido."
    )
    public ResponseEntity<AuthDispositivoDTO> authenticate(
            @Valid @RequestBody DeviceLoginRequest request) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(
            request.getUuid(),
            request.getPin()
        );
        return ResponseEntity.ok(auth);
    }

    /**
     * POST /public/pos/auth-token
     * Autentica un dispositivo usando un token de emparejamiento (pairing).
     *
     * @param pairingToken Token de emparejamiento generado previamente
     * @return Token JWT y datos del dispositivo autenticado
     */
    @PostMapping("/auth-token")
    @Operation(
        summary = "Autenticar con token de emparejamiento",
        description = "Autentica un dispositivo usando un token de pairing generado desde el backoffice"
    )
    public ResponseEntity<AuthDispositivoDTO> authenticateWithToken(
            @RequestParam String pairingToken) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConToken(pairingToken);
        return ResponseEntity.ok(auth);
    }

    /**
     * POST /public/pos/auth-employee
     * Autentica un dispositivo usando email o DNI de empleado (Quick Start).
     *
     * @param identifier Email o DNI del empleado
     * @return Token JWT y datos del dispositivo autenticado
     */
    @PostMapping("/auth-employee")
    @Operation(
        summary = "Autenticar con credenciales de empleado",
        description = "Quick Start: Autentica usando email o DNI del empleado. Asigna automáticamente un dispositivo disponible."
    )
    public ResponseEntity<AuthDispositivoDTO> authenticateWithEmployee(
            @RequestParam String identifier) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConIdentificadorEmpleado(identifier);
        return ResponseEntity.ok(auth);
    }

    /**
     * GET /public/pos/setup
     * Vincula un dispositivo usando un código de setup (pairing token).
     * Endpoint PÚBLICO - no requiere autenticación previa.
     *
     * @param p Pairing key (UUID temporal)
     * @return DeviceToken de larga duración (30 días) y configuración del dispositivo
     */
    @GetMapping("/setup")
    @Operation(
        summary = "Vincular dispositivo con pairing key",
        description = "Vincula un dispositivo usando un código de setup generado desde el backoffice. Retorna token de dispositivo válido por 30 días."
    )
    public ResponseEntity<com.club.management.dto.response.DeviceAuthDTO> setup(
            @RequestParam String p) {
        return ResponseEntity.ok(dispositivoPOSService.vincularPorToken(p));
    }

    /**
     * GET /public/pos/pair
     * Vincula un dispositivo usando un PIN corto (ej: "842-931").
     * Endpoint PÚBLICO - alternativa al código para ingreso manual.
     *
     * @param code Código corto de 6 dígitos
     * @return DeviceToken de larga duración y configuración
     */
    @GetMapping("/pair")
    @Operation(
        summary = "Vincular dispositivo con código corto",
        description = "Vincula un dispositivo usando un código manual corto (formato: 123-456)"
    )
    public ResponseEntity<com.club.management.dto.response.DeviceAuthDTO> pair(
            @RequestParam String code) {
        return ResponseEntity.ok(dispositivoPOSService.vincularPorCodigo(code));
    }
}
