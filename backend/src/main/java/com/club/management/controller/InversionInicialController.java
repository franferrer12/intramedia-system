package com.club.management.controller;

import com.club.management.dto.request.InversionInicialRequest;
import com.club.management.dto.response.InversionInicialDTO;
import com.club.management.service.InversionInicialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inversion-inicial")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
public class InversionInicialController {

    private final InversionInicialService inversionService;

    @GetMapping
    public ResponseEntity<List<InversionInicialDTO>> listarTodas() {
        return ResponseEntity.ok(inversionService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InversionInicialDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(inversionService.obtenerPorId(id));
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<InversionInicialDTO>> listarPorCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(inversionService.listarPorCategoria(categoria));
    }

    @GetMapping("/rango-fechas")
    public ResponseEntity<List<InversionInicialDTO>> obtenerPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(inversionService.obtenerPorRangoFechas(fechaInicio, fechaFin));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<InversionInicialDTO>> buscarPorConcepto(@RequestParam String concepto) {
        return ResponseEntity.ok(inversionService.buscarPorConcepto(concepto));
    }

    @GetMapping("/estadisticas/total")
    public ResponseEntity<BigDecimal> obtenerInversionTotal() {
        return ResponseEntity.ok(inversionService.obtenerInversionTotal());
    }

    @GetMapping("/estadisticas/por-categoria/{categoria}")
    public ResponseEntity<BigDecimal> obtenerInversionPorCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(inversionService.obtenerInversionPorCategoria(categoria));
    }

    @PostMapping
    public ResponseEntity<InversionInicialDTO> crear(@Valid @RequestBody InversionInicialRequest request) {
        return ResponseEntity.ok(inversionService.crearInversion(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InversionInicialDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody InversionInicialRequest request) {
        return ResponseEntity.ok(inversionService.actualizarInversion(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        inversionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
