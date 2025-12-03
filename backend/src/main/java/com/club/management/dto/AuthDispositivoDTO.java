package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthDispositivoDTO {
    private String token;
    private String type = "Bearer";
    private DispositivoPOSDTO dispositivo;
    private ConfiguracionPOSDTO configuracion;
}
