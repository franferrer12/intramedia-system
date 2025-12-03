package com.club.management.controller;

import com.club.management.dto.response.RoiMetricsDTO;
import com.club.management.service.RoiService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/roi")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
public class RoiController {

    private final RoiService roiService;

    /**
     * Obtener métricas de ROI desde el inicio hasta ahora
     */
    @GetMapping("/metricas")
    public ResponseEntity<RoiMetricsDTO> obtenerMetricas() {
        return ResponseEntity.ok(roiService.calcularMetricas());
    }

    /**
     * Obtener métricas de ROI para un periodo específico
     */
    @GetMapping("/metricas/periodo")
    public ResponseEntity<RoiMetricsDTO> obtenerMetricasPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(roiService.calcularMetricasPorPeriodo(fechaInicio, fechaFin));
    }
}
