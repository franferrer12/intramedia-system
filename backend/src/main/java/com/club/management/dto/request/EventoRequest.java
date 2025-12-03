package com.club.management.dto.request;

import com.club.management.entity.Evento.EstadoEvento;
import com.club.management.entity.Evento.TipoEvento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO para crear/actualizar eventos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoRequest {

    @NotBlank(message = "El nombre del evento es obligatorio")
    private String nombre;

    @NotNull(message = "La fecha del evento es obligatoria")
    private LocalDate fecha;

    private LocalTime horaInicio;

    private LocalTime horaFin;

    @NotNull(message = "El tipo de evento es obligatorio")
    private TipoEvento tipo;

    private Integer aforoEsperado;

    private Integer aforoReal;

    private EstadoEvento estado;

    private String artista;

    private BigDecimal cacheArtista;

    private BigDecimal ingresosEstimados;

    private BigDecimal gastosEstimados;

    private BigDecimal ingresosReales;

    private BigDecimal gastosReales;

    private String descripcion;

    private String notas;
}
