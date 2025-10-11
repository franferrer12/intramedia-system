package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para respuesta de stock total consolidado (cerrado + abierto)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTotalDTO {

    private Long productoId;
    private String productoNombre;
    private String categoria;

    // Stock cerrado (botellas en almacén)
    private BigDecimal stockCerradoBotellas;

    // Stock abierto (botellas en barra)
    private Long stockAbiertoBotellas;
    private Integer copasDisponibles;
    private BigDecimal stockAbiertoEquivalenteBotellas;

    // Stock total
    private BigDecimal stockTotalEquivalente;

    // Límites
    private BigDecimal stockMinimo;
    private BigDecimal stockMaximo;

    // Nivel de stock
    private String nivelStock;  // BAJO, NORMAL, ALTO

    // Ubicaciones de botellas abiertas
    private List<String> ubicacionesBotellas;
}
