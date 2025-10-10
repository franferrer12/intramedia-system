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
public class InversionInicialRequest {

    @NotBlank(message = "El concepto es obligatorio")
    @Size(max = 200, message = "El concepto no puede exceder 200 caracteres")
    private String concepto;

    private String descripcion;

    @NotBlank(message = "La categoría es obligatoria")
    private String categoria;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.0", message = "El monto debe ser mayor o igual a 0")
    private BigDecimal monto;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    private Long activoFijoId;

    private Long proveedorId;

    @Size(max = 100, message = "El número de factura no puede exceder 100 caracteres")
    private String numeroFactura;

    @Size(max = 50, message = "La forma de pago no puede exceder 50 caracteres")
    private String formaPago;
}
