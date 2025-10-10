package com.club.management.controller;

import com.club.management.dto.request.ActivoFijoRequest;
import com.club.management.dto.response.ActivoFijoDTO;
import com.club.management.service.ActivoFijoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/activos-fijos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
public class ActivoFijoController {

    private final ActivoFijoService activoFijoService;

    @GetMapping
    public ResponseEntity<List<ActivoFijoDTO>> listarTodos() {
        return ResponseEntity.ok(activoFijoService.listarTodos());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<ActivoFijoDTO>> listarActivos() {
        return ResponseEntity.ok(activoFijoService.listarActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivoFijoDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(activoFijoService.obtenerPorId(id));
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<ActivoFijoDTO>> listarPorCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(activoFijoService.listarPorCategoria(categoria));
    }

    @GetMapping("/amortizados")
    public ResponseEntity<List<ActivoFijoDTO>> listarAmortizados() {
        return ResponseEntity.ok(activoFijoService.obtenerActivosAmortizados());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ActivoFijoDTO>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(activoFijoService.buscarPorNombre(nombre));
    }

    @GetMapping("/estadisticas/valor-total")
    public ResponseEntity<BigDecimal> obtenerValorTotal() {
        return ResponseEntity.ok(activoFijoService.obtenerValorInicialTotal());
    }

    @GetMapping("/estadisticas/valor-neto-total")
    public ResponseEntity<BigDecimal> obtenerValorNetoTotal() {
        return ResponseEntity.ok(activoFijoService.obtenerValorNetoTotal());
    }

    @GetMapping("/estadisticas/amortizacion-acumulada")
    public ResponseEntity<BigDecimal> obtenerAmortizacionAcumulada() {
        return ResponseEntity.ok(activoFijoService.obtenerAmortizacionAcumulada());
    }

    @PostMapping
    public ResponseEntity<ActivoFijoDTO> crear(@Valid @RequestBody ActivoFijoRequest request) {
        return ResponseEntity.ok(activoFijoService.crearActivoFijo(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivoFijoDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActivoFijoRequest request) {
        return ResponseEntity.ok(activoFijoService.actualizarActivoFijo(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        activoFijoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/recalcular-amortizacion")
    public ResponseEntity<ActivoFijoDTO> recalcularAmortizacion(@PathVariable Long id) {
        return ResponseEntity.ok(activoFijoService.recalcularAmortizacion(id));
    }
}
