package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PairingTokenDTO {
    private String pairingToken;
    private String pairingUrl;
    private String qrCodeData;
    private Long dispositivoId;
    private String dispositivoNombre;
    private LocalDateTime expiresAt;
}
