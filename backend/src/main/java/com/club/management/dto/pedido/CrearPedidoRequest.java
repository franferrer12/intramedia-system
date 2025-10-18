package com.club.management.dto.pedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO para crear un nuevo pedido
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearPedidoRequest {

    @NotNull(message = "El ID del proveedor es obligatorio")
    private Long proveedorId;

    private LocalDate fechaEsperada;

    @Size(max = 1000, message = "Las notas no pueden exceder 1000 caracteres")
    private String notas;

    @NotEmpty(message = "El pedido debe contener al menos un producto")
    @Valid
    private List<DetallePedidoRequest> detalles;
}
