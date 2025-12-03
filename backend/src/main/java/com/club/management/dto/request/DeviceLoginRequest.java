package com.club.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO para autenticación de dispositivos POS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceLoginRequest {

    @NotBlank(message = "UUID es requerido")
    private String uuid;

    @NotBlank(message = "PIN es requerido")
    private String pin;
}
