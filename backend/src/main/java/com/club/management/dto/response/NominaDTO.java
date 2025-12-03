package com.club.management.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class NominaDTO {
    private Long id;
    private Long empleadoId;
    private String empleadoNombre;
    private String empleadoDni;
    private String periodo;
    private LocalDate fechaPago;
    private BigDecimal salarioBase;
    private BigDecimal horasExtra;
    private BigDecimal precioHoraExtra;
    private BigDecimal bonificaciones;
    private BigDecimal deducciones;
    private BigDecimal salarioBruto;
    private BigDecimal seguridadSocial;
    private BigDecimal irpf;
    private BigDecimal otrasRetenciones;
    private BigDecimal salarioNeto;
    private String estado;
    private String metodoPago;
    private String referenciaPago;
    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
