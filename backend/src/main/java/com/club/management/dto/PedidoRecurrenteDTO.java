package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoRecurrenteDTO {
    private Long id;
    private Long plantillaId;
    private String plantillaNombre;
    private String proveedorNombre;
    private String frecuencia; // SEMANAL, QUINCENAL, MENSUAL, TRIMESTRAL
    private Integer diaEjecucion;
    private String diasEjecucion;
    private LocalTime horaEjecucion;
    private LocalDateTime proximaEjecucion;
    private LocalDateTime ultimaEjecucion;
    private Boolean activo;
    private Integer notificarAntesHoras;
    private String emailsNotificacion;
    private String descripcionFrecuencia; // Descripción legible
    private Long creadoPorId;
    private String creadoPorNombre;
    private LocalDateTime fechaCreacion;
}
