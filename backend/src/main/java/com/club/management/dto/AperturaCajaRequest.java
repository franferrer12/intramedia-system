package com.club.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para apertura de sesión de caja
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AperturaCajaRequest {

    @NotBlank(message = "El nombre de la caja es obligatorio")
    private String nombreCaja;

    @NotNull(message = "El empleado de apertura es obligatorio")
    private Long empleadoAperturaId;

    @NotNull(message = "El monto inicial es obligatorio")
    @Positive(message = "El monto inicial debe ser mayor a 0")
    private BigDecimal montoInicial;

    private String observaciones;
}
