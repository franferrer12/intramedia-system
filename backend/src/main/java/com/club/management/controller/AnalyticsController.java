package com.club.management.controller;

import com.club.management.dto.response.*;
import com.club.management.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para Analytics y métricas empresariales
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Obtiene los costes laborales de un periodo específico
     *
     * @param periodo Periodo en formato YYYY-MM (opcional, por defecto mes actual)
     * @return Métricas de costes laborales del periodo
     */
    @GetMapping("/costes-laborales")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<CostesLaboralesDTO> getCostesLaborales(
            @RequestParam(required = false) String periodo) {

        log.info("GET /api/analytics/costes-laborales - periodo: {}", periodo);

        // Si no se proporciona periodo, usar el mes actual
        if (periodo == null || periodo.isEmpty()) {
            periodo = LocalDate.now().toString().substring(0, 7); // YYYY-MM
        }

        CostesLaboralesDTO costes = analyticsService.getCostesLaborales(periodo);
        return ResponseEntity.ok(costes);
    }

    /**
     * Obtiene el rendimiento de un empleado en un rango de fechas
     *
     * @param empleadoId ID del empleado
     * @param desde Fecha de inicio en formato YYYY-MM (opcional, por defecto hace 1 año)
     * @param hasta Fecha de fin en formato YYYY-MM (opcional, por defecto mes actual)
     * @return Análisis de rendimiento del empleado
     */
    @GetMapping("/rendimiento-empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<RendimientoEmpleadoDTO> getRendimientoEmpleado(
            @PathVariable Long empleadoId,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta) {

        log.info("GET /api/analytics/rendimiento-empleado/{} - desde: {}, hasta: {}",
                empleadoId, desde, hasta);

        // Si no se proporcionan fechas, usar el último año
        if (desde == null || desde.isEmpty()) {
            desde = LocalDate.now().minusYears(1).toString().substring(0, 7);
        }
        if (hasta == null || hasta.isEmpty()) {
            hasta = LocalDate.now().toString().substring(0, 7);
        }

        RendimientoEmpleadoDTO rendimiento = analyticsService.getRendimientoPorEmpleado(
                empleadoId, desde, hasta);
        return ResponseEntity.ok(rendimiento);
    }

    /**
     * Obtiene el análisis de rentabilidad de eventos en un rango de fechas
     *
     * @param desde Fecha de inicio (opcional, por defecto hace 3 meses)
     * @param hasta Fecha de fin (opcional, por defecto hoy)
     * @return Lista de análisis de rentabilidad por evento
     */
    @GetMapping("/rentabilidad-eventos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<List<AnalisisRentabilidadDTO>> getRentabilidadEventos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        log.info("GET /api/analytics/rentabilidad-eventos - desde: {}, hasta: {}", desde, hasta);

        // Si no se proporcionan fechas, usar los últimos 3 meses
        if (desde == null) {
            desde = LocalDate.now().minusMonths(3);
        }
        if (hasta == null) {
            hasta = LocalDate.now();
        }

        List<AnalisisRentabilidadDTO> rentabilidad = analyticsService.getAnalisisRentabilidadEventos(
                desde, hasta);
        return ResponseEntity.ok(rentabilidad);
    }

    /**
     * Obtiene las métricas principales del dashboard
     *
     * @return Métricas del dashboard
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<DashboardMetricsDTO> getDashboard() {
        log.info("GET /api/analytics/dashboard");

        DashboardMetricsDTO metrics = analyticsService.getDashboardMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Obtiene la evolución de costes laborales de los últimos N meses
     *
     * @param meses Cantidad de meses a analizar (opcional, por defecto 6)
     * @return Lista de costes por mes
     */
    @GetMapping("/evolucion-costes")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<List<MesCoste>> getEvolucionCostes(
            @RequestParam(required = false, defaultValue = "6") int meses) {

        log.info("GET /api/analytics/evolucion-costes - meses: {}", meses);

        // Validar que los meses sean razonables (entre 1 y 24)
        if (meses < 1) meses = 1;
        if (meses > 24) meses = 24;

        List<MesCoste> evolucion = analyticsService.getEvolucionCostesLaborales(meses);
        return ResponseEntity.ok(evolucion);
    }

    /**
     * Obtiene la comparativa anual de costes por mes
     *
     * @param año Año a analizar (opcional, por defecto año actual)
     * @return Mapa con periodo y total de costes
     */
    @GetMapping("/comparativa-anual")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<Map<String, BigDecimal>> getComparativaAnual(
            @RequestParam(required = false) Integer año) {

        log.info("GET /api/analytics/comparativa-anual - año: {}", año);

        // Si no se proporciona año, usar el año actual
        if (año == null) {
            año = LocalDate.now().getYear();
        }

        Map<String, BigDecimal> comparativa = analyticsService.getComparativaCostesAnual(año);
        return ResponseEntity.ok(comparativa);
    }
}
