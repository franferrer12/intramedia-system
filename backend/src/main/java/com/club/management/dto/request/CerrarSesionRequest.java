package com.club.management.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CerrarSesionRequest {

    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    private String notas;
}
