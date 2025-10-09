package com.club.management.controller;

import com.club.management.dto.request.TransaccionRequest;
import com.club.management.dto.response.TransaccionDTO;
import com.club.management.service.TransaccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
public class TransaccionController {

    private final TransaccionService transaccionService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<TransaccionDTO>> getAll() {
        return ResponseEntity.ok(transaccionService.findAll());
    }

    @GetMapping("/tipo/{tipo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<TransaccionDTO>> getByTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(transaccionService.findByTipo(tipo));
    }

    @GetMapping("/evento/{eventoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<TransaccionDTO>> getByEventoId(@PathVariable Long eventoId) {
        return ResponseEntity.ok(transaccionService.findByEventoId(eventoId));
    }

    @GetMapping("/fecha")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<TransaccionDTO>> getByFecha(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(transaccionService.findByFechaBetween(fechaInicio, fechaFin));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<TransaccionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(transaccionService.findById(id));
    }

    @GetMapping("/suma/tipo/{tipo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<BigDecimal> getSumByTipo(
            @PathVariable String tipo,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(transaccionService.getSumByTipoAndFecha(tipo, fechaInicio, fechaFin));
    }

    @GetMapping("/suma/evento/{eventoId}/tipo/{tipo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<BigDecimal> getSumByEvento(@PathVariable Long eventoId, @PathVariable String tipo) {
        return ResponseEntity.ok(transaccionService.getSumByEventoIdAndTipo(eventoId, tipo));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<TransaccionDTO> create(@Valid @RequestBody TransaccionRequest request) {
        TransaccionDTO created = transaccionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<TransaccionDTO> update(@PathVariable Long id,
                                                 @Valid @RequestBody TransaccionRequest request) {
        return ResponseEntity.ok(transaccionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transaccionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
