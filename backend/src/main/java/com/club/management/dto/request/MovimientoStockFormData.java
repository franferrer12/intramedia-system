package com.club.management.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoStockFormData {
    private Long productoId;
    private String tipoMovimiento; // ENTRADA, SALIDA, AJUSTE, MERMA, DEVOLUCION
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private String motivo;
    private String referencia;
    private Long eventoId;
    private Long proveedorId;
    private LocalDateTime fechaMovimiento;
    private String notas;
}
