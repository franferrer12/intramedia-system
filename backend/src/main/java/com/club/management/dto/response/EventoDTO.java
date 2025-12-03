package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO para Evento (respuesta)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoDTO {

    private Long id;
    private String nombre;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String tipo;
    private Integer aforoEsperado;
    private Integer aforoReal;
    private String estado;
    private String artista;
    private BigDecimal cacheArtista;
    private BigDecimal ingresosEstimados;
    private BigDecimal gastosEstimados;
    private BigDecimal ingresosReales;
    private BigDecimal gastosReales;
    private BigDecimal beneficioNeto;
    private BigDecimal margen;
    private String descripcion;
    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
