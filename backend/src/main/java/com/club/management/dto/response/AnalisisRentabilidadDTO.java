package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO para análisis de rentabilidad por evento
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalisisRentabilidadDTO {

    /**
     * ID del evento
     */
    private Long eventoId;

    /**
     * Nombre del evento
     */
    private String eventoNombre;

    /**
     * Fecha del evento
     */
    private LocalDate eventoFecha;

    /**
     * Tipo de evento
     */
    private String eventoTipo;

    /**
     * Estado del evento
     */
    private String eventoEstado;

    /**
     * Ingresos del evento (suma de transacciones tipo INGRESO)
     */
    private BigDecimal ingresosEvento;

    /**
     * Costes de personal (suma de jornadas del evento)
     */
    private BigDecimal costesPersonal;

    /**
     * Otros gastos del evento (transacciones tipo GASTO)
     */
    private BigDecimal otrosGastos;

    /**
     * Gastos totales (costesPersonal + otrosGastos)
     */
    private BigDecimal gastosTotal;

    /**
     * Margen bruto (ingresos - gastos totales)
     */
    private BigDecimal margenBruto;

    /**
     * Porcentaje de margen ((margenBruto / ingresos) * 100)
     */
    private BigDecimal porcentajeMargen;

    /**
     * Cantidad de empleados que trabajaron en el evento
     */
    private Long cantidadEmpleados;

    /**
     * Aforo real del evento
     */
    private Integer aforoReal;

    /**
     * Ingreso promedio por persona
     */
    private BigDecimal ingresoPorPersona;
}
