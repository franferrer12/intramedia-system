package com.club.management.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class JornadaTrabajoRequest {

    @NotNull(message = "El ID del empleado es obligatorio")
    private Long empleadoId;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime horaInicio;

    @NotNull(message = "La hora de fin es obligatoria")
    private LocalTime horaFin;

    @DecimalMin(value = "0.0", inclusive = true, message = "El precio por hora debe ser mayor o igual a 0")
    private BigDecimal precioHora;

    private Boolean pagado;

    private LocalDate fechaPago;

    @Size(max = 50, message = "El método de pago no puede exceder 50 caracteres")
    private String metodoPago;

    private Long eventoId;

    private String notas;
}
