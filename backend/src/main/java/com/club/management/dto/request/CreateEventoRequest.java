package com.club.management.dto.request;

import com.club.management.entity.Evento.TipoEvento;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO para crear un evento
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 255, message = "El nombre no puede exceder 255 caracteres")
    private String nombre;

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "La fecha no puede ser en el pasado")
    private LocalDate fecha;

    private LocalTime horaInicio;

    private LocalTime horaFin;

    @NotNull(message = "El tipo de evento es obligatorio")
    private TipoEvento tipo;

    @Min(value = 0, message = "El aforo esperado no puede ser negativo")
    private Integer aforoEsperado;

    private String artista;

    @DecimalMin(value = "0.0", inclusive = false, message = "El caché del artista debe ser mayor que 0")
    private BigDecimal cacheArtista;

    @DecimalMin(value = "0.0", message = "Los ingresos estimados no pueden ser negativos")
    private BigDecimal ingresosEstimados;

    @DecimalMin(value = "0.0", message = "Los gastos estimados no pueden ser negativos")
    private BigDecimal gastosEstimados;

    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    private String descripcion;

    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    private String notas;
}
