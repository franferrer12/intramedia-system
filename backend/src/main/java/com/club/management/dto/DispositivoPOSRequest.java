package com.club.management.dto;

import com.club.management.entity.DispositivoPOS;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispositivoPOSRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    private String descripcion;

    @NotNull(message = "El tipo es obligatorio")
    private DispositivoPOS.TipoDispositivo tipo;

    @Size(max = 100, message = "La ubicación no puede exceder 100 caracteres")
    private String ubicacion;

    private Long empleadoAsignadoId;

    @NotBlank(message = "El PIN es obligatorio")
    @Size(min = 4, max = 6, message = "El PIN debe tener entre 4 y 6 caracteres")
    private String pin;

    private String[] categoriasPredeterminadas;

    private Map<String, Object> configImpresora;

    @Builder.Default
    private Boolean tieneLectorBarras = false;

    @Builder.Default
    private Boolean tieneCajonDinero = false;

    @Builder.Default
    private Boolean tienePantallaCliente = false;

    private Map<String, Object> permisos;
}
