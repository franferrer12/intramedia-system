package com.club.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitud de apertura de botella
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbrirBotellaRequest {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @NotBlank(message = "La ubicación es obligatoria")
    private String ubicacion;  // BARRA_PRINCIPAL, BARRA_VIP, COCTELERIA, etc.

    @NotNull(message = "El ID del empleado es obligatorio")
    private Long empleadoId;

    private Long sesionCajaId;  // Opcional

    private String notas;  // Opcional
}
