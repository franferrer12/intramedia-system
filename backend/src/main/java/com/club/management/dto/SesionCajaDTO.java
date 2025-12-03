package com.club.management.dto;

import com.club.management.entity.SesionCaja;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para respuestas de sesiones de caja
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionCajaDTO {

    private Long id;
    private String nombreCaja;

    private Long empleadoAperturaId;
    private String empleadoAperturaNombre;

    private Long empleadoCierreId;
    private String empleadoCierreNombre;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaApertura;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCierre;

    private BigDecimal montoInicial;
    private BigDecimal montoEsperado;
    private BigDecimal montoReal;
    private BigDecimal diferencia;

    private SesionCaja.EstadoSesionCaja estado;
    private String observaciones;

    // Estadísticas
    private Integer totalVentas;
    private BigDecimal totalIngresos;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
