package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para métricas de costes laborales
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostesLaboralesDTO {

    /**
     * Total pagado en jornadas del mes especificado
     */
    private BigDecimal totalPagadoMes;

    /**
     * Total de nóminas (salarios netos) del mes especificado
     */
    private BigDecimal totalNominaMes;

    /**
     * Cantidad de empleados activos en el periodo
     */
    private Long cantidadEmpleados;

    /**
     * Cantidad total de jornadas trabajadas en el periodo
     */
    private Long cantidadJornadas;

    /**
     * Promedio de coste por jornada
     */
    private BigDecimal promedioCosteJornada;

    /**
     * Coste promedio por hora trabajada
     */
    private BigDecimal costePorHora;

    /**
     * Periodo analizado (formato YYYY-MM)
     */
    private String periodo;

    /**
     * Tendencia mensual de costes (últimos meses)
     */
    private List<MesCoste> tendenciaMensual;

    /**
     * Total de horas trabajadas en el periodo
     */
    private BigDecimal totalHorasTrabajadas;
}
