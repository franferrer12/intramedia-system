package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO con datos de autenticación del dispositivo después de vincular
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceAuthDTO {
    private Boolean success;
    private String deviceUUID; // UUID del dispositivo
    private String deviceToken; // Token JWT de larga duración (30 días)
    private DeviceInfoDTO device; // Información del dispositivo

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceInfoDTO {
        private Long id;
        private String uuid;
        private String nombre;
        private String tipo;
        private String ubicacion;
        private Boolean asignacionPermanente;
        private Boolean modoTabletCompartida;
        private DeviceConfigDTO config;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceConfigDTO {
        private String[] categoriasPredeterminadas;
        private Boolean tieneLectorBarras;
        private Boolean tieneCajonDinero;
        private Boolean tienePantallaCliente;
        private Map<String, Object> permisos;
    }
}
