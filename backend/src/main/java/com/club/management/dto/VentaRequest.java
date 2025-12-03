package com.club.management.dto;

import com.club.management.entity.Venta;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request para crear una venta
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VentaRequest {

    @NotNull(message = "La sesión de caja es obligatoria")
    private Long sesionCajaId;

    @NotNull(message = "El empleado (cajero) es obligatorio")
    private Long empleadoId;

    @NotNull(message = "El método de pago es obligatorio")
    private Venta.MetodoPago metodoPago;

    private BigDecimal montoEfectivo;
    private BigDecimal montoTarjeta;

    private Long eventoId;  // Opcional
    private String clienteNombre;  // Opcional
    private String observaciones;

    @NotEmpty(message = "La venta debe tener al menos un producto")
    @Valid
    private List<DetalleVentaRequest> detalles;

    /**
     * Request para cada línea de detalle de venta
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetalleVentaRequest {

        @NotNull(message = "El producto es obligatorio")
        private Long productoId;

        @NotNull(message = "La cantidad es obligatoria")
        private Integer cantidad;

        private BigDecimal precioUnitario;  // Opcional, se toma del producto si no se especifica

        @Builder.Default
        private BigDecimal descuento = BigDecimal.ZERO;
    }
}
