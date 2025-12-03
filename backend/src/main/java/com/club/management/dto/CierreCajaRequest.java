package com.club.management.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para cierre de sesión de caja
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CierreCajaRequest {

    @NotNull(message = "El empleado de cierre es obligatorio")
    private Long empleadoCierreId;

    @NotNull(message = "El monto real contado es obligatorio")
    @PositiveOrZero(message = "El monto real no puede ser negativo")
    private BigDecimal montoReal;

    private String observaciones;
}
