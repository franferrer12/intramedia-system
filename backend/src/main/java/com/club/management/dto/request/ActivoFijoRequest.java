package com.club.management.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivoFijoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String nombre;

    private String descripcion;

    @NotBlank(message = "La categoría es obligatoria")
    private String categoria;

    @NotNull(message = "El valor inicial es obligatorio")
    @DecimalMin(value = "0.0", message = "El valor inicial debe ser mayor o igual a 0")
    private BigDecimal valorInicial;

    @NotNull(message = "La fecha de adquisición es obligatoria")
    private LocalDate fechaAdquisicion;

    @NotNull(message = "La vida útil en años es obligatoria")
    @Min(value = 1, message = "La vida útil debe ser al menos 1 año")
    private Integer vidaUtilAnios;

    @DecimalMin(value = "0.0", message = "El valor residual debe ser mayor o igual a 0")
    private BigDecimal valorResidual;

    private Long proveedorId;

    @Size(max = 100, message = "El número de factura no puede exceder 100 caracteres")
    private String numeroFactura;

    @Size(max = 200, message = "La ubicación no puede exceder 200 caracteres")
    private String ubicacion;

    private Boolean activo;

    private String notas;
}
