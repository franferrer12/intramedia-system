package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoiMetricsDTO {

    // Inversión
    private BigDecimal inversionTotal;
    private BigDecimal valorActivosActual;

    // Resultados
    private BigDecimal beneficioNetoAcumulado;
    private BigDecimal ingresosTotales;
    private BigDecimal gastosTotales;

    // ROI
    private BigDecimal roi;  // ROI total desde apertura
    private BigDecimal roiAnualizado;  // ROI anualizado

    // Tiempo
    private Long diasDesdeApertura;

    // Recuperación
    private BigDecimal inversionRecuperada;
    private BigDecimal porcentajeRecuperado;
    private Long diasEstimadosRecuperacion;  // null si ya se recuperó o no es posible calcular
    private BigDecimal tasaRetornoMensual;

    // Estado
    private String estadoRecuperacion;  // "RECUPERADO", "EN_PROCESO", "PERDIDA"
    private Boolean inversionRecuperadaCompletamente;
}
