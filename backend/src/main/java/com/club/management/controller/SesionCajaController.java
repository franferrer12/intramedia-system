package com.club.management.controller;

import com.club.management.dto.AperturaCajaRequest;
import com.club.management.dto.CierreCajaRequest;
import com.club.management.dto.SesionCajaDTO;
import com.club.management.service.SesionCajaService;
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
 * Controlador REST para gestión de sesiones de caja
 */
@RestController
@RequestMapping("/api/pos/sesiones-caja")
@RequiredArgsConstructor
public class SesionCajaController {

    private final SesionCajaService sesionCajaService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<SesionCajaDTO>> getAll() {
        return ResponseEntity.ok(sesionCajaService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<SesionCajaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sesionCajaService.findById(id));
    }

    @GetMapping("/abiertas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<List<SesionCajaDTO>> getSesionesAbiertas() {
        return ResponseEntity.ok(sesionCajaService.findSesionesAbiertas());
    }

    @GetMapping("/cerradas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<List<SesionCajaDTO>> getSesionesCerradas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {
        return ResponseEntity.ok(sesionCajaService.findSesionesCerradas(fechaInicio, fechaFin));
    }

    @GetMapping("/caja/{nombreCaja}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<SesionCajaDTO>> getByCaja(@PathVariable String nombreCaja) {
        return ResponseEntity.ok(sesionCajaService.findByNombreCaja(nombreCaja));
    }

    @GetMapping("/caja/{nombreCaja}/abierta")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<SesionCajaDTO> getSesionAbiertaPorCaja(@PathVariable String nombreCaja) {
        SesionCajaDTO sesion = sesionCajaService.findSesionAbiertaPorNombreCaja(nombreCaja);
        if (sesion == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(sesion);
    }

    @GetMapping("/empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<SesionCajaDTO>> getByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(sesionCajaService.findByEmpleadoId(empleadoId));
    }

    /**
     * Abre una nueva sesión de caja
     */
    @PostMapping("/abrir")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<SesionCajaDTO> abrirSesion(@Valid @RequestBody AperturaCajaRequest request) {
        SesionCajaDTO sesion = sesionCajaService.abrirSesion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sesion);
    }

    /**
     * Cierra una sesión de caja existente
     */
    @PostMapping("/{id}/cerrar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<SesionCajaDTO> cerrarSesion(
            @PathVariable Long id,
            @Valid @RequestBody CierreCajaRequest request) {
        SesionCajaDTO sesion = sesionCajaService.cerrarSesion(id, request);
        return ResponseEntity.ok(sesion);
    }
}
