package com.club.management.controller;

import com.club.management.dto.AuthDispositivoDTO;
import com.club.management.dto.request.DeviceLoginRequest;
import com.club.management.dto.request.LoginRequest;
import com.club.management.dto.response.LoginResponse;
import com.club.management.dto.response.UsuarioDTO;
import com.club.management.service.AuthenticationService;
import com.club.management.service.DispositivoPOSService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller de autenticación
 * Endpoints: /api/auth/*
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints de autenticación")
public class AuthenticationController {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private DispositivoPOSService dispositivoPOSService;

    /**
     * POST /api/auth/login
     * Autentica un usuario o dispositivo POS y retorna un token JWT
     *
     * Para usuarios: {"username": "admin", "password": "admin123"}
     * Para dispositivos (formato 1): {"uuid": "...", "pin": "1234", "type": "device"}
     * Para dispositivos (formato 2): {"username": "25f9eb5e-...", "password": "1234"}
     */
    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica un usuario o dispositivo POS y retorna un token JWT")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        // Detectar tipo de autenticación

        // Opción 1: Campos uuid/pin explícitos
        if ("device".equals(loginRequest.getType()) ||
            (loginRequest.getUuid() != null && loginRequest.getPin() != null)) {
            AuthDispositivoDTO deviceAuth = dispositivoPOSService.autenticarConPIN(
                loginRequest.getUuid(),
                loginRequest.getPin()
            );
            return ResponseEntity.ok(deviceAuth);
        }

        // Opción 2: Username es un UUID (formato híbrido)
        if (loginRequest.getUsername() != null && isUUID(loginRequest.getUsername())) {
            AuthDispositivoDTO deviceAuth = dispositivoPOSService.autenticarConPIN(
                loginRequest.getUsername(),  // username ES el UUID
                loginRequest.getPassword()   // password ES el PIN
            );
            return ResponseEntity.ok(deviceAuth);
        }

        // Opción 3: Autenticación de usuario regular
        LoginResponse response = authenticationService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Verifica si un string es un UUID válido
     */
    private boolean isUUID(String str) {
        if (str == null || str.length() != 36) {
            return false;
        }
        // Formato: 8-4-4-4-12 caracteres separados por guiones
        return str.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    }

    /**
     * GET /api/auth/me
     * Obtiene la información del usuario actualmente autenticado
     */
    @GetMapping("/me")
    @Operation(summary = "Usuario actual", description = "Obtiene el usuario autenticado")
    public ResponseEntity<UsuarioDTO> getCurrentUser() {
        UsuarioDTO usuario = authenticationService.getCurrentUser();
        return ResponseEntity.ok(usuario);
    }

    /**
     * POST /api/auth/refresh
     * Refresca el token JWT
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Genera un nuevo token JWT")
    public ResponseEntity<LoginResponse> refreshToken() {
        String newToken = authenticationService.refreshToken();
        UsuarioDTO usuario = authenticationService.getCurrentUser();

        LoginResponse response = LoginResponse.builder()
                .token(newToken)
                .type("Bearer")
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .build();

        return ResponseEntity.ok(response);
    }
}
