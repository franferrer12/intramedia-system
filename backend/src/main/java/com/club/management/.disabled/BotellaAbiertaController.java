package com.club.management.controller;

import com.club.management.dto.*;
import com.club.management.service.BotellaAbiertaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gestión de botellas abiertas en barra
 * Sistema VIP Bottles - Tracking de copas servidas y stock dual
 *
 * TEMPORALMENTE DESHABILITADO - Pendiente de completar implementación
 * TODO: Habilitar cuando se implemente completamente el módulo Botellas VIP
 */
// @RestController
// @RequestMapping("/api/botellas-abiertas")
@RequiredArgsConstructor
@Slf4j
public class BotellaAbiertaController {

    private final BotellaAbiertaService botellaAbiertaService;

    // ========== ENDPOINTS DE CONSULTA ==========

    /**
     * Obtener todas las botellas abiertas (estado ABIERTA)
     * GET /api/botellas-abiertas
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<BotellaAbiertaDTO>> getBotellasAbiertas() {
        log.info("GET /api/botellas-abiertas - Obteniendo botellas abiertas");
        return ResponseEntity.ok(botellaAbiertaService.getBotellasAbiertas());
    }

    /**
     * Obtener todas las botellas (incluye cerradas y desperdiciadas)
     * GET /api/botellas-abiertas/todas
     */
    @GetMapping("/todas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<BotellaAbiertaDTO>> getAllBotellas() {
        log.info("GET /api/botellas-abiertas/todas - Obteniendo todas las botellas");
        return ResponseEntity.ok(botellaAbiertaService.getAllBotellas());
    }

    /**
     * Obtener una botella por ID
     * GET /api/botellas-abiertas/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<BotellaAbiertaDTO> getBotellaById(@PathVariable Long id) {
        log.info("GET /api/botellas-abiertas/{} - Obteniendo botella por ID", id);
        return ResponseEntity.ok(botellaAbiertaService.getBotellaById(id));
    }

    /**
     * Obtener botellas abiertas de un producto específico
     * GET /api/botellas-abiertas/producto/{productoId}
     */
    @GetMapping("/producto/{productoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<BotellaAbiertaDTO>> getBotellasPorProducto(@PathVariable Long productoId) {
        log.info("GET /api/botellas-abiertas/producto/{} - Obteniendo botellas por producto", productoId);
        return ResponseEntity.ok(botellaAbiertaService.getBotellasPorProducto(productoId));
    }

    /**
     * Obtener botellas abiertas por ubicación
     * GET /api/botellas-abiertas/ubicacion/{ubicacion}
     */
    @GetMapping("/ubicacion/{ubicacion}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<List<BotellaAbiertaDTO>> getBotellasPorUbicacion(@PathVariable String ubicacion) {
        log.info("GET /api/botellas-abiertas/ubicacion/{} - Obteniendo botellas por ubicación", ubicacion);
        return ResponseEntity.ok(botellaAbiertaService.getBotellasPorUbicacion(ubicacion));
    }

    /**
     * Obtener botellas con alertas (casi vacías o abiertas más de 24h)
     * GET /api/botellas-abiertas/alertas
     */
    @GetMapping("/alertas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<List<BotellaAbiertaDTO>> getBotellasConAlertas() {
        log.info("GET /api/botellas-abiertas/alertas - Obteniendo botellas con alertas");
        return ResponseEntity.ok(botellaAbiertaService.getBotellasConAlertas());
    }

    // ========== OPERACIONES DE NEGOCIO ==========

    /**
     * Abrir una nueva botella
     * POST /api/botellas-abiertas/abrir
     *
     * Body:
     * {
     *   "productoId": 1,
     *   "ubicacion": "BARRA_PRINCIPAL",
     *   "empleadoId": 1,
     *   "sesionCajaId": 1,  // opcional
     *   "notas": "Apertura de botella para turno noche"  // opcional
     * }
     */
    @PostMapping("/abrir")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<BotellaAbiertaDTO> abrirBotella(@Valid @RequestBody AbrirBotellaRequest request) {
        log.info("POST /api/botellas-abiertas/abrir - Producto ID: {}, Ubicación: {}",
            request.getProductoId(), request.getUbicacion());
        try {
            BotellaAbiertaDTO botella = botellaAbiertaService.abrirBotella(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(botella);
        } catch (RuntimeException e) {
            log.error("Error al abrir botella: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Cerrar una botella manualmente
     * POST /api/botellas-abiertas/cerrar
     *
     * Body:
     * {
     *   "botellaId": 1,
     *   "empleadoId": 1,
     *   "motivo": "CERRADA",  // CERRADA o DESPERDICIADA
     *   "notas": "Botella terminada"  // opcional
     * }
     */
    @PostMapping("/cerrar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<BotellaAbiertaDTO> cerrarBotella(@Valid @RequestBody CerrarBotellaRequest request) {
        log.info("POST /api/botellas-abiertas/cerrar - Botella ID: {}, Motivo: {}",
            request.getBotellaId(), request.getMotivo());
        try {
            BotellaAbiertaDTO botella = botellaAbiertaService.cerrarBotella(request);
            return ResponseEntity.ok(botella);
        } catch (RuntimeException e) {
            log.error("Error al cerrar botella: {}", e.getMessage());
            throw e;
        }
    }

    // ========== ESTADÍSTICAS Y REPORTES ==========

    /**
     * Obtener resumen de botellas abiertas por producto
     * GET /api/botellas-abiertas/resumen
     */
    @GetMapping("/resumen")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<ResumenBotellasDTO>> getResumenPorProducto() {
        log.info("GET /api/botellas-abiertas/resumen - Obteniendo resumen por producto");
        return ResponseEntity.ok(botellaAbiertaService.getResumenPorProducto());
    }

    /**
     * Calcular copas disponibles de un producto
     * GET /api/botellas-abiertas/copas-disponibles/{productoId}
     */
    @GetMapping("/copas-disponibles/{productoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<Integer> getCopasDisponibles(@PathVariable Long productoId) {
        log.info("GET /api/botellas-abiertas/copas-disponibles/{} - Calculando copas disponibles", productoId);
        return ResponseEntity.ok(botellaAbiertaService.getCopasDisponibles(productoId));
    }

    /**
     * Obtener stock total consolidado (cerrado + abierto)
     * GET /api/botellas-abiertas/stock-total
     *
     * Retorna el stock completo de todas las botellas:
     * - Stock cerrado (almacén)
     * - Stock abierto (barra) convertido a equivalente de botellas
     * - Stock total consolidado
     * - Alertas de stock bajo/alto
     */
    @GetMapping("/stock-total")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<StockTotalDTO>> getStockTotalBotellas() {
        log.info("GET /api/botellas-abiertas/stock-total - Obteniendo stock total consolidado");
        return ResponseEntity.ok(botellaAbiertaService.getStockTotalBotellas());
    }

    // ========== UBICACIONES PREDEFINIDAS ==========

    /**
     * Obtener ubicaciones predefinidas para botellas
     * GET /api/botellas-abiertas/ubicaciones
     */
    @GetMapping("/ubicaciones")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<List<String>> getUbicaciones() {
        List<String> ubicaciones = List.of(
            "BARRA_PRINCIPAL",
            "BARRA_VIP",
            "COCTELERIA",
            "TERRAZA",
            "SALA_EVENTOS"
        );
        return ResponseEntity.ok(ubicaciones);
    }
}
