package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para resumen de botellas abiertas por producto
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenBotellasDTO {

    private Long productoId;
    private String productoNombre;
    private String categoria;

    // Estadísticas de botellas
    private Long totalBotellasAbiertas;
    private Integer totalCopasServidas;
    private Integer totalCopasDisponibles;
    private BigDecimal equivalenteBotellas;

    // Ubicaciones
    private List<String> ubicaciones;

    // Fechas
    private LocalDateTime botellaMasAntigua;
    private LocalDateTime botellaMasReciente;

    // Alertas
    private Boolean tieneAlertaCasiVacia;
    private Boolean tieneAlertaMas24h;
    private Integer botellasConAlertas;
}
