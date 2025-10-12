package com.club.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitud de login
 * Soporta autenticación de usuarios (username/password) y dispositivos POS (uuid/pin)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    // Para autenticación de usuarios
    private String username;
    private String password;

    // Para autenticación de dispositivos POS
    private String uuid;
    private String pin;

    // Tipo de autenticación: "user" o "device"
    private String type;
}
