package com.club.management.dto;

import com.club.management.entity.BotellaAbierta.EstadoBotella;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitud de cierre de botella
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CerrarBotellaRequest {

    @NotNull(message = "El ID de la botella es obligatorio")
    private Long botellaId;

    @NotNull(message = "El ID del empleado es obligatorio")
    private Long empleadoId;

    @NotNull(message = "El motivo de cierre es obligatorio")
    private EstadoBotella motivo;  // CERRADA o DESPERDICIADA

    private String notas;  // Opcional
}
