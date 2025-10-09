package com.club.management.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class JornadaTrabajoDTO {
    private Long id;
    private Long empleadoId;
    private String empleadoNombre;
    private String empleadoDni;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private BigDecimal horasTrabajadas;
    private BigDecimal precioHora;
    private BigDecimal totalPago;
    private Boolean pagado;
    private LocalDate fechaPago;
    private String metodoPago;
    private Long eventoId;
    private String eventoNombre;
    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
