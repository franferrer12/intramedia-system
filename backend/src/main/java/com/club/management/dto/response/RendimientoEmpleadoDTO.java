package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para análisis de rendimiento por empleado
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendimientoEmpleadoDTO {

    /**
     * ID del empleado
     */
    private Long empleadoId;

    /**
     * Nombre completo del empleado
     */
    private String empleadoNombre;

    /**
     * Total de horas trabajadas en el periodo
     */
    private BigDecimal totalHorasTrabajadas;

    /**
     * Total de jornadas trabajadas en el periodo
     */
    private Long totalJornadas;

    /**
     * Total pagado al empleado en el periodo
     */
    private BigDecimal totalPagado;

    /**
     * Promedio de horas por jornada
     */
    private BigDecimal promedioHorasPorJornada;

    /**
     * Promedio de ingreso por jornada
     */
    private BigDecimal promedioIngresoPorJornada;

    /**
     * Fecha de inicio del periodo analizado
     */
    private String periodoInicio;

    /**
     * Fecha de fin del periodo analizado
     */
    private String periodoFin;

    /**
     * Precio promedio por hora del empleado
     */
    private BigDecimal precioPromedioHora;

    /**
     * Cantidad de jornadas pendientes de pago
     */
    private Long jornadasPendientes;

    /**
     * Importe pendiente de pago
     */
    private BigDecimal importePendiente;
}
