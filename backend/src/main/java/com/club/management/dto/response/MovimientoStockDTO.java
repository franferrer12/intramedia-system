package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoStockDTO {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoCodigo;
    private String tipoMovimiento;
    private BigDecimal cantidad;
    private BigDecimal stockAnterior;
    private BigDecimal stockNuevo;
    private BigDecimal precioUnitario;
    private BigDecimal costoTotal;
    private String motivo;
    private String referencia;
    private Long eventoId;
    private String eventoNombre;
    private Long proveedorId;
    private String proveedorNombre;
    private String usuarioNombre;
    private LocalDateTime fechaMovimiento;
    private String notas;
    private LocalDateTime creadoEn;
}
