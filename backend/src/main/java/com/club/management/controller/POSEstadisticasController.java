package com.club.management.controller;

import com.club.management.dto.EstadisticasPOSDTO;
import com.club.management.service.POSEstadisticasService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST para estadísticas del dashboard POS
 */
@RestController
@RequestMapping("/api/pos/estadisticas")
@RequiredArgsConstructor
public class POSEstadisticasController {

    private final POSEstadisticasService estadisticasService;

    /**
     * Obtiene estadísticas para un rango de fechas específico
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<EstadisticasPOSDTO> getEstadisticas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {
        return ResponseEntity.ok(estadisticasService.getEstadisticas(fechaInicio, fechaFin));
    }

    /**
     * Obtiene estadísticas del día actual
     */
    @GetMapping("/hoy")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<EstadisticasPOSDTO> getEstadisticasHoy() {
        return ResponseEntity.ok(estadisticasService.getEstadisticasHoy());
    }

    /**
     * Obtiene estadísticas de los últimos 7 días
     */
    @GetMapping("/semana")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<EstadisticasPOSDTO> getEstadisticasSemana() {
        return ResponseEntity.ok(estadisticasService.getEstadisticasSemana());
    }

    /**
     * Obtiene estadísticas de los últimos 30 días
     */
    @GetMapping("/mes")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<EstadisticasPOSDTO> getEstadisticasMes() {
        return ResponseEntity.ok(estadisticasService.getEstadisticasMes());
    }

    /**
     * Obtiene los productos más vendidos en un rango de fechas
     */
    @GetMapping("/top-productos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<EstadisticasPOSDTO.ProductoVendidoDTO>> getTopProductos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(estadisticasService.getTopProductos(fechaInicio, fechaFin, limit));
    }

    /**
     * Obtiene ventas agrupadas por hora del día
     */
    @GetMapping("/ventas-por-hora")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<EstadisticasPOSDTO.VentaPorHoraDTO>> getVentasPorHora(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {
        return ResponseEntity.ok(estadisticasService.getVentasPorHora(fechaInicio, fechaFin));
    }

    /**
     * Obtiene estadísticas de una sesión de caja específica
     */
    @GetMapping("/sesion/{sesionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<EstadisticasPOSDTO> getEstadisticasSesion(@PathVariable Long sesionId) {
        return ResponseEntity.ok(estadisticasService.getEstadisticasSesion(sesionId));
    }
}
