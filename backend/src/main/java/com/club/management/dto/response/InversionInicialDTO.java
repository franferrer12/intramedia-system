package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InversionInicialDTO {

    private Long id;
    private String concepto;
    private String descripcion;
    private String categoria;
    private BigDecimal monto;
    private LocalDate fecha;

    // Relaciones
    private Long activoFijoId;
    private String activoFijoNombre;
    private Long proveedorId;
    private String proveedorNombre;

    // Información adicional
    private String numeroFactura;
    private String formaPago;

    // Auditoría
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
