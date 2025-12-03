package com.club.management.controller;

import com.club.management.dto.VentaDTO;
import com.club.management.dto.VentaRequest;
import com.club.management.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST para gestión de ventas del POS
 */
@RestController
@RequestMapping("/api/pos/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<VentaDTO>> getAll() {
        return ResponseEntity.ok(ventaService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<VentaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ventaService.findById(id));
    }

    @GetMapping("/ticket/{numeroTicket}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<VentaDTO> getByTicket(@PathVariable String numeroTicket) {
        return ResponseEntity.ok(ventaService.findByNumeroTicket(numeroTicket));
    }

    @GetMapping("/sesion/{sesionCajaId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<VentaDTO>> getBySesionCaja(@PathVariable Long sesionCajaId) {
        return ResponseEntity.ok(ventaService.findBySesionCajaId(sesionCajaId));
    }

    @GetMapping("/empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<VentaDTO>> getByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(ventaService.findByEmpleadoId(empleadoId));
    }

    @GetMapping("/evento/{eventoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<VentaDTO>> getByEvento(@PathVariable Long eventoId) {
        return ResponseEntity.ok(ventaService.findByEventoId(eventoId));
    }

    @GetMapping("/rango-fechas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<VentaDTO>> getByRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {
        return ResponseEntity.ok(ventaService.findEntreFechas(fechaInicio, fechaFin));
    }

    /**
     * Crea una nueva venta con todos sus detalles
     * Esta operación:
     * 1. Valida sesión de caja abierta
     * 2. Valida stock disponible
     * 3. Crea venta con detalles
     * 4. Descuenta stock automáticamente (via trigger)
     * 5. Crea transacción financiera automáticamente (via trigger)
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<VentaDTO> crearVenta(@Valid @RequestBody VentaRequest request) {
        VentaDTO venta = ventaService.crearVenta(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(venta);
    }
}
