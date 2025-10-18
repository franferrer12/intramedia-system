package com.club.management.dto.pedido;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para crear/actualizar un detalle de pedido
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetallePedidoRequest {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    private BigDecimal cantidad;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio unitario no puede ser negativo")
    private BigDecimal precioUnitario;

    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    private String notas;
}
