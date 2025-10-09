package com.club.management.controller;

import com.club.management.dto.request.LoginRequest;
import com.club.management.dto.response.LoginResponse;
import com.club.management.dto.response.UsuarioDTO;
import com.club.management.service.AuthenticationService;
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

    /**
     * POST /api/auth/login
     * Autentica un usuario y retorna un token JWT
     */
    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica un usuario y retorna un token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authenticationService.login(loginRequest);
        return ResponseEntity.ok(response);
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
