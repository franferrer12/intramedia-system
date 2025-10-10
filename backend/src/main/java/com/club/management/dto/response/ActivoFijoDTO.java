package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivoFijoDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private String categoria;

    // Valores financieros
    private BigDecimal valorInicial;
    private LocalDate fechaAdquisicion;
    private Integer vidaUtilAnios;
    private BigDecimal valorResidual;

    // Valores calculados
    private BigDecimal amortizacionAnual;
    private BigDecimal amortizacionMensual;
    private BigDecimal amortizacionAcumulada;
    private BigDecimal valorNeto;

    // Información adicional
    private Long proveedorId;
    private String proveedorNombre;
    private String numeroFactura;
    private String ubicacion;

    // Control
    private Boolean activo;
    private String notas;

    // Campos calculados adicionales para el frontend
    private Double porcentajeAmortizacion;
    private Boolean completamenteAmortizado;
    private Integer aniosRestantes;

    // Auditoría
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;

    /**
     * Calcula los campos derivados después de construir el DTO
     */
    public void calcularCamposDerivados() {
        // Calcular porcentaje de amortización
        if (valorInicial != null && valorInicial.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal valorAmortizable = valorInicial.subtract(valorResidual != null ? valorResidual : BigDecimal.ZERO);
            if (valorAmortizable.compareTo(BigDecimal.ZERO) > 0) {
                porcentajeAmortizacion = amortizacionAcumulada
                        .divide(valorAmortizable, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            } else {
                porcentajeAmortizacion = 0.0;
            }
        } else {
            porcentajeAmortizacion = 0.0;
        }

        // Verificar si está completamente amortizado
        completamenteAmortizado = porcentajeAmortizacion >= 100.0;

        // Calcular años restantes
        if (fechaAdquisicion != null && vidaUtilAnios != null) {
            LocalDate fechaFinVidaUtil = fechaAdquisicion.plusYears(vidaUtilAnios);
            Period periodo = Period.between(LocalDate.now(), fechaFinVidaUtil);
            aniosRestantes = Math.max(0, periodo.getYears());
        } else {
            aniosRestantes = 0;
        }
    }
}
