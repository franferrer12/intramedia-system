package com.club.management.service;

import com.club.management.dto.response.RoiMetricsDTO;
import com.club.management.entity.Transaccion.TipoTransaccion;
import com.club.management.repository.ActivoFijoRepository;
import com.club.management.repository.InversionInicialRepository;
import com.club.management.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoiService {

    private final InversionInicialRepository inversionInicialRepository;
    private final ActivoFijoRepository activoFijoRepository;
    private final TransaccionRepository transaccionRepository;

    /**
     * Calcula las métricas de ROI desde el inicio hasta ahora
     */
    @Transactional(readOnly = true)
    public RoiMetricsDTO calcularMetricas() {
        log.info("Calculando métricas ROI desde el inicio hasta ahora");

        // Obtener la fecha de apertura (fecha más antigua en inversión inicial)
        LocalDate fechaApertura = obtenerFechaApertura();
        LocalDate fechaActual = LocalDate.now();

        // Si no hay inversiones, retornar DTO vacío
        if (fechaApertura == null) {
            log.warn("No hay inversiones registradas. Retornando métricas vacías.");
            return crearDTOVacio();
        }

        // Calcular con el rango completo desde la apertura hasta hoy
        return calcularMetricasPorPeriodo(fechaApertura, fechaActual);
    }

    /**
     * Calcula las métricas de ROI para un periodo específico
     */
    @Transactional(readOnly = true)
    public RoiMetricsDTO calcularMetricasPorPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        log.info("Calculando métricas ROI entre {} y {}", fechaInicio, fechaFin);

        // Validaciones
        if (fechaInicio == null || fechaFin == null) {
            log.error("Las fechas de inicio y fin son obligatorias");
            throw new IllegalArgumentException("Las fechas de inicio y fin son obligatorias");
        }

        if (fechaInicio.isAfter(fechaFin)) {
            log.error("La fecha de inicio no puede ser posterior a la fecha de fin");
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        // 1. Calcular inversión total del periodo
        BigDecimal inversionTotal = calcularInversionTotalPorPeriodo(fechaInicio, fechaFin);

        // Si la inversión es 0, retornar DTO vacío
        if (inversionTotal.compareTo(BigDecimal.ZERO) == 0) {
            log.warn("No hay inversiones en el periodo especificado. Retornando métricas vacías.");
            return crearDTOVacio();
        }

        // 2. Calcular valor actual de activos (todos los activos, no filtrado por periodo)
        BigDecimal valorActivosActual = calcularValorActivosActual();

        // 3. Calcular ingresos totales del periodo
        BigDecimal ingresosTotales = calcularIngresosPorPeriodo(fechaInicio, fechaFin);

        // 4. Calcular gastos totales del periodo
        BigDecimal gastosTotales = calcularGastosPorPeriodo(fechaInicio, fechaFin);

        // 5. Calcular beneficio neto acumulado
        BigDecimal beneficioNetoAcumulado = ingresosTotales.subtract(gastosTotales);

        // 6. Calcular ROI
        BigDecimal roi = calcularROI(beneficioNetoAcumulado, inversionTotal);

        // 7. Calcular días desde apertura
        long diasDesdeApertura = ChronoUnit.DAYS.between(fechaInicio, fechaFin);

        // Evitar división por cero en los días
        if (diasDesdeApertura == 0) {
            diasDesdeApertura = 1;
        }

        // 8. Calcular ROI anualizado
        BigDecimal roiAnualizado = calcularROIAnualizado(roi, diasDesdeApertura);

        // 9. Calcular inversión recuperada
        BigDecimal inversionRecuperada = beneficioNetoAcumulado.min(inversionTotal);

        // Si el beneficio es negativo, la inversión recuperada es 0
        if (inversionRecuperada.compareTo(BigDecimal.ZERO) < 0) {
            inversionRecuperada = BigDecimal.ZERO;
        }

        // 10. Calcular porcentaje recuperado
        BigDecimal porcentajeRecuperado = calcularPorcentajeRecuperado(inversionRecuperada, inversionTotal);

        // 11. Calcular días estimados para recuperación
        Long diasEstimadosRecuperacion = calcularDiasEstimadosRecuperacion(
                porcentajeRecuperado, diasDesdeApertura);

        // 12. Calcular tasa de retorno mensual
        BigDecimal tasaRetornoMensual = calcularTasaRetornoMensual(
                beneficioNetoAcumulado, inversionTotal, diasDesdeApertura);

        // 13. Determinar estado de recuperación
        String estadoRecuperacion = determinarEstadoRecuperacion(porcentajeRecuperado);

        // 14. Verificar si la inversión se recuperó completamente
        Boolean inversionRecuperadaCompletamente = porcentajeRecuperado.compareTo(new BigDecimal("100")) >= 0;

        // Construir y retornar el DTO
        return RoiMetricsDTO.builder()
                .inversionTotal(inversionTotal)
                .valorActivosActual(valorActivosActual)
                .beneficioNetoAcumulado(beneficioNetoAcumulado)
                .ingresosTotales(ingresosTotales)
                .gastosTotales(gastosTotales)
                .roi(roi)
                .roiAnualizado(roiAnualizado)
                .diasDesdeApertura(diasDesdeApertura)
                .inversionRecuperada(inversionRecuperada)
                .porcentajeRecuperado(porcentajeRecuperado)
                .diasEstimadosRecuperacion(diasEstimadosRecuperacion)
                .tasaRetornoMensual(tasaRetornoMensual)
                .estadoRecuperacion(estadoRecuperacion)
                .inversionRecuperadaCompletamente(inversionRecuperadaCompletamente)
                .build();
    }

    /**
     * Obtiene la fecha más antigua de inversión inicial (fecha de apertura)
     */
    private LocalDate obtenerFechaApertura() {
        return inversionInicialRepository.findAllByOrderByFechaDesc()
                .stream()
                .map(inv -> inv.getFecha())
                .min(LocalDate::compareTo)
                .orElse(null);
    }

    /**
     * Calcula la inversión total del periodo especificado
     */
    private BigDecimal calcularInversionTotalPorPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        return inversionInicialRepository.findByFechaBetween(fechaInicio, fechaFin)
                .stream()
                .map(inv -> inv.getMonto())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula el valor neto actual de todos los activos fijos activos
     */
    private BigDecimal calcularValorActivosActual() {
        BigDecimal valor = activoFijoRepository.calcularValorNetoTotal();
        return valor != null ? valor : BigDecimal.ZERO;
    }

    /**
     * Calcula los ingresos totales del periodo
     */
    private BigDecimal calcularIngresosPorPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        BigDecimal ingresos = transaccionRepository.sumByTipoAndFechaBetween(
                TipoTransaccion.INGRESO, fechaInicio, fechaFin);
        return ingresos != null ? ingresos : BigDecimal.ZERO;
    }

    /**
     * Calcula los gastos totales del periodo
     */
    private BigDecimal calcularGastosPorPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        BigDecimal gastos = transaccionRepository.sumByTipoAndFechaBetween(
                TipoTransaccion.GASTO, fechaInicio, fechaFin);
        return gastos != null ? gastos : BigDecimal.ZERO;
    }

    /**
     * Calcula el ROI: ((beneficioNeto - inversionTotal) / inversionTotal) × 100
     */
    private BigDecimal calcularROI(BigDecimal beneficioNeto, BigDecimal inversionTotal) {
        if (inversionTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return beneficioNeto.subtract(inversionTotal)
                .divide(inversionTotal, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula el ROI anualizado: (roi / diasDesdeApertura) × 365
     */
    private BigDecimal calcularROIAnualizado(BigDecimal roi, long diasDesdeApertura) {
        if (diasDesdeApertura == 0) {
            return BigDecimal.ZERO;
        }

        return roi.divide(new BigDecimal(diasDesdeApertura), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("365"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula el porcentaje recuperado: (inversionRecuperada / inversionTotal) × 100
     */
    private BigDecimal calcularPorcentajeRecuperado(BigDecimal inversionRecuperada, BigDecimal inversionTotal) {
        if (inversionTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return inversionRecuperada
                .divide(inversionTotal, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula los días estimados para recuperación completa
     * Retorna null si ya se recuperó o no es posible calcular
     */
    private Long calcularDiasEstimadosRecuperacion(BigDecimal porcentajeRecuperado, long diasDesdeApertura) {
        // Si ya se recuperó completamente, retornar null
        if (porcentajeRecuperado.compareTo(new BigDecimal("100")) >= 0) {
            return null;
        }

        // Si el porcentaje es 0 o negativo, no es posible estimar
        if (porcentajeRecuperado.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        // Calcular: (diasDesdeApertura / porcentajeRecuperado) × 100
        BigDecimal diasEstimados = new BigDecimal(diasDesdeApertura)
                .divide(porcentajeRecuperado, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(0, RoundingMode.HALF_UP);

        return diasEstimados.longValue();
    }

    /**
     * Calcula la tasa de retorno mensual: (beneficioNeto / inversionTotal) / (dias / 30.0) × 100
     */
    private BigDecimal calcularTasaRetornoMensual(BigDecimal beneficioNeto, BigDecimal inversionTotal, long dias) {
        if (inversionTotal.compareTo(BigDecimal.ZERO) == 0 || dias == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal meses = new BigDecimal(dias).divide(new BigDecimal("30.0"), 4, RoundingMode.HALF_UP);

        if (meses.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return beneficioNeto
                .divide(inversionTotal, 4, RoundingMode.HALF_UP)
                .divide(meses, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Determina el estado de recuperación de la inversión
     */
    private String determinarEstadoRecuperacion(BigDecimal porcentajeRecuperado) {
        if (porcentajeRecuperado.compareTo(new BigDecimal("100")) >= 0) {
            return "RECUPERADO";
        } else if (porcentajeRecuperado.compareTo(BigDecimal.ZERO) > 0) {
            return "EN_PROCESO";
        } else {
            return "PERDIDA";
        }
    }

    /**
     * Crea un DTO vacío con todos los valores en 0 y estado SIN_DATOS
     */
    private RoiMetricsDTO crearDTOVacio() {
        return RoiMetricsDTO.builder()
                .inversionTotal(BigDecimal.ZERO)
                .valorActivosActual(BigDecimal.ZERO)
                .beneficioNetoAcumulado(BigDecimal.ZERO)
                .ingresosTotales(BigDecimal.ZERO)
                .gastosTotales(BigDecimal.ZERO)
                .roi(BigDecimal.ZERO)
                .roiAnualizado(BigDecimal.ZERO)
                .diasDesdeApertura(0L)
                .inversionRecuperada(BigDecimal.ZERO)
                .porcentajeRecuperado(BigDecimal.ZERO)
                .diasEstimadosRecuperacion(null)
                .tasaRetornoMensual(BigDecimal.ZERO)
                .estadoRecuperacion("SIN_DATOS")
                .inversionRecuperadaCompletamente(false)
                .build();
    }
}
