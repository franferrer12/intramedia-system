package com.club.management.controller;

import com.club.management.dto.request.CerrarSesionRequest;
import com.club.management.dto.request.RegistrarConsumoRequest;
import com.club.management.dto.request.SesionVentaRequest;
import com.club.management.dto.response.ConsumoSesionDTO;
import com.club.management.dto.response.EstadisticasSesionDTO;
import com.club.management.dto.response.SesionVentaDTO;
import com.club.management.service.EstadisticasSesionService;
import com.club.management.service.SesionVentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones-venta")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
public class SesionVentaController {

    private final SesionVentaService sesionService;
    private final EstadisticasSesionService estadisticasService;

    @PostMapping
    public ResponseEntity<SesionVentaDTO> crearSesion(@Valid @RequestBody SesionVentaRequest request) {
        SesionVentaDTO sesion = sesionService.crearSesion(request);
        return ResponseEntity.ok(sesion);
    }

    @GetMapping
    public ResponseEntity<List<SesionVentaDTO>> listarSesiones() {
        List<SesionVentaDTO> sesiones = sesionService.listarSesiones();
        return ResponseEntity.ok(sesiones);
    }

    @GetMapping("/abiertas")
    public ResponseEntity<List<SesionVentaDTO>> listarSesionesAbiertas() {
        List<SesionVentaDTO> sesiones = sesionService.listarSesionesAbiertas();
        return ResponseEntity.ok(sesiones);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SesionVentaDTO> obtenerSesion(@PathVariable Long id) {
        SesionVentaDTO sesion = sesionService.obtenerSesion(id);
        return ResponseEntity.ok(sesion);
    }

    @PostMapping("/{id}/consumos")
    public ResponseEntity<ConsumoSesionDTO> registrarConsumo(
            @PathVariable Long id,
            @Valid @RequestBody RegistrarConsumoRequest request) {
        ConsumoSesionDTO consumo = sesionService.registrarConsumo(id, request);
        return ResponseEntity.ok(consumo);
    }

    @GetMapping("/{id}/consumos")
    public ResponseEntity<List<ConsumoSesionDTO>> listarConsumosDeSesion(@PathVariable Long id) {
        List<ConsumoSesionDTO> consumos = sesionService.listarConsumosDeSesion(id);
        return ResponseEntity.ok(consumos);
    }

    @PostMapping("/{id}/cerrar")
    public ResponseEntity<SesionVentaDTO> cerrarSesion(
            @PathVariable Long id,
            @RequestBody(required = false) CerrarSesionRequest request) {
        SesionVentaDTO sesion = sesionService.cerrarSesion(id, request);
        return ResponseEntity.ok(sesion);
    }

    @GetMapping("/{id}/estadisticas")
    public ResponseEntity<EstadisticasSesionDTO> obtenerEstadisticas(@PathVariable Long id) {
        EstadisticasSesionDTO estadisticas = estadisticasService.obtenerEstadisticas(id);
        return ResponseEntity.ok(estadisticas);
    }
}
