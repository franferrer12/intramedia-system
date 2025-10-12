package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO con datos del token de emparejamiento generado
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PairingTokenDTO {
    private String token; // JWT token temporal
    private String pairingCode; // Código corto (ej: 842-931)
    private LocalDateTime expiresAt; // Cuándo expira
    private String qrCodeData; // URL para QR code
    private String directLink; // Enlace directo para abrir en navegador
    private Integer validityMinutes; // Minutos de validez (60)
}
