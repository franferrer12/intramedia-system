package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionPOSDTO {
    private Long dispositivoId;
    private String[] categoriasPredeterminadas;
    private Map<String, Object> permisos;
    private Map<String, Object> configImpresora;
    private Boolean tieneLectorBarras;
    private Boolean tieneCajonDinero;
    private Boolean tienePantallaCliente;
    private Boolean modoOfflineHabilitado;
    private List<ProductoDTO> productosPrecargados; // Para caché offline
    private Long sesionCajaActiva; // ID de sesión activa si existe
}
