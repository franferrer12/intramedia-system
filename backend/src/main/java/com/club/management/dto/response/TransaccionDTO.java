package com.club.management.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TransaccionDTO {

    private Long id;
    private String tipo;
    private Long categoriaId;
    private String categoriaNombre;
    private Long eventoId;
    private String eventoNombre;
    private LocalDate fecha;
    private String concepto;
    private String descripcion;
    private BigDecimal monto;
    private String metodoPago;
    private String referencia;
    private Long proveedorId;
    private String proveedorNombre;
    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
