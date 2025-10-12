package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultadoSincronizacionDTO {
    private String uuidVenta;
    private Boolean exitoso;
    private Long ventaId; // ID de la venta creada
    private String mensaje;
    private String error;

    public static ResultadoSincronizacionDTO exitoso(String uuidVenta, Long ventaId) {
        return ResultadoSincronizacionDTO.builder()
                .uuidVenta(uuidVenta)
                .exitoso(true)
                .ventaId(ventaId)
                .mensaje("Venta sincronizada exitosamente")
                .build();
    }

    public static ResultadoSincronizacionDTO duplicado(String uuidVenta) {
        return ResultadoSincronizacionDTO.builder()
                .uuidVenta(uuidVenta)
                .exitoso(true)
                .mensaje("Venta ya fue sincronizada previamente")
                .build();
    }

    public static ResultadoSincronizacionDTO error(String uuidVenta, String error) {
        return ResultadoSincronizacionDTO.builder()
                .uuidVenta(uuidVenta)
                .exitoso(false)
                .error(error)
                .mensaje("Error al sincronizar venta")
                .build();
    }
}
