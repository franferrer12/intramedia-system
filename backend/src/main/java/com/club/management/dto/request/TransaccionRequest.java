package com.club.management.dto.request;

import com.club.management.entity.Transaccion.TipoTransaccion;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransaccionRequest {

    @NotNull(message = "El tipo es obligatorio")
    private TipoTransaccion tipo;

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    private Long eventoId;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotBlank(message = "El concepto es obligatorio")
    @Size(max = 255, message = "El concepto no puede exceder 255 caracteres")
    private String concepto;

    private String descripcion;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal monto;

    @Size(max = 50, message = "El método de pago no puede exceder 50 caracteres")
    private String metodoPago;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referencia;

    private Long proveedorId;

    private String notas;
}
