package com.club.management.dto.pedido;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO de respuesta para el detalle de un pedido
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetallePedidoDTO {

    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoCategoria;
    private BigDecimal cantidadPedida;
    private BigDecimal cantidadRecibida;
    private BigDecimal diferencia;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private String notas;
    private Boolean completamenteRecibido;
    private Boolean parcialmenteRecibido;
    private BigDecimal porcentajeRecibido;
}
