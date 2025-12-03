package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para métricas del dashboard principal de analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDTO {

    /**
     * Costes laborales del mes actual (jornadas)
     */
    private BigDecimal costesLaboralesMesActual;

    /**
     * Costes laborales del mes anterior (jornadas)
     */
    private BigDecimal costesLaboralesMesAnterior;

    /**
     * Variación mensual en porcentaje
     */
    private BigDecimal variacionMensual;

    /**
     * Cantidad de jornadas pendientes de pago
     */
    private Long jornadasPendientesPago;

    /**
     * Importe total pendiente de pago
     */
    private BigDecimal importePendientePago;

    /**
     * Cantidad de empleados activos
     */
    private Long empleadosActivos;

    /**
     * Promedio de coste por hora (mes actual)
     */
    private BigDecimal promedioCosteHora;

    /**
     * Tendencia de costes de los últimos 6 meses
     */
    private List<MesCoste> ultimos6MesesTendencia;

    /**
     * Mes actual analizado (formato YYYY-MM)
     */
    private String mesActual;

    /**
     * Mes anterior analizado (formato YYYY-MM)
     */
    private String mesAnterior;

    /**
     * Total de horas trabajadas en el mes actual
     */
    private BigDecimal totalHorasMesActual;

    /**
     * Cantidad de jornadas del mes actual
     */
    private Long cantidadJornadasMesActual;

    /**
     * Cantidad de nóminas pendientes
     */
    private Long nominasPendientes;

    /**
     * Total de nóminas del mes actual
     */
    private BigDecimal totalNominasMesActual;
}
