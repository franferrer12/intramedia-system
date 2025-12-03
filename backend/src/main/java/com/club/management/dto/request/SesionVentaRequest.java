package com.club.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionVentaRequest {

    @NotBlank(message = "El nombre de la sesión es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    private Long empleadoId;

    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    private String notas;
}
