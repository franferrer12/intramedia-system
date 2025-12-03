package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para representar el coste de un mes específico en tendencias
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MesCoste {

    /**
     * Periodo en formato YYYY-MM
     */
    private String periodo;

    /**
     * Total del coste en el periodo
     */
    private BigDecimal total;

    /**
     * Cantidad de jornadas en el periodo
     */
    private Long cantidadJornadas;

    /**
     * Cantidad de empleados distintos en el periodo
     */
    private Long cantidadEmpleados;
}
