package com.club.management.dto.pedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para recepcionar un pedido
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecepcionarPedidoRequest {

    @NotEmpty(message = "Debe especificar las cantidades recibidas")
    @Valid
    private List<DetalleRecepcionRequest> detallesRecepcion;

    @Size(max = 1000, message = "Las notas no pueden exceder 1000 caracteres")
    private String notas;

    /**
     * Inner class para las cantidades recibidas por detalle
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetalleRecepcionRequest {
        private Long detalleId;
        private java.math.BigDecimal cantidadRecibida;
        private String notas;
    }
}
