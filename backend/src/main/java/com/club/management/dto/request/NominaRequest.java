package com.club.management.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class NominaRequest {

    @NotNull(message = "El ID del empleado es obligatorio")
    private Long empleadoId;

    @NotBlank(message = "El periodo es obligatorio")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "El periodo debe tener formato YYYY-MM")
    private String periodo;

    @NotNull(message = "La fecha de pago es obligatoria")
    private LocalDate fechaPago;

    @NotNull(message = "El salario base es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El salario base debe ser mayor o igual a 0")
    private BigDecimal salarioBase;

    @DecimalMin(value = "0.0", inclusive = true, message = "Las horas extra deben ser mayores o iguales a 0")
    private BigDecimal horasExtra;

    @DecimalMin(value = "0.0", inclusive = true, message = "El precio por hora extra debe ser mayor o igual a 0")
    private BigDecimal precioHoraExtra;

    @DecimalMin(value = "0.0", inclusive = true, message = "Las bonificaciones deben ser mayores o iguales a 0")
    private BigDecimal bonificaciones;

    @DecimalMin(value = "0.0", inclusive = true, message = "Las deducciones deben ser mayores o iguales a 0")
    private BigDecimal deducciones;

    @DecimalMin(value = "0.0", inclusive = true, message = "Otras retenciones deben ser mayores o iguales a 0")
    private BigDecimal otrasRetenciones;

    @Pattern(regexp = "^(PENDIENTE|PAGADA|CANCELADA)$", message = "Estado debe ser PENDIENTE, PAGADA o CANCELADA")
    private String estado;

    @Size(max = 50, message = "El método de pago no puede exceder 50 caracteres")
    private String metodoPago;

    @Size(max = 100, message = "La referencia de pago no puede exceder 100 caracteres")
    private String referenciaPago;

    private String notas;
}
