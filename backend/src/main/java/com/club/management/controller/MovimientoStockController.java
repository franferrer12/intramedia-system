package com.club.management.controller;

import com.club.management.dto.request.MovimientoStockFormData;
import com.club.management.dto.response.MovimientoStockDTO;
import com.club.management.service.MovimientoStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/movimientos-stock")
@RequiredArgsConstructor
public class MovimientoStockController {

    private final MovimientoStockService movimientoService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<MovimientoStockDTO>> getAllMovimientos() {
        return ResponseEntity.ok(movimientoService.getAllMovimientos());
    }

    @GetMapping("/producto/{productoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<MovimientoStockDTO>> getMovimientosByProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(movimientoService.getMovimientosByProducto(productoId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<MovimientoStockDTO> registrarMovimiento(@Valid @RequestBody MovimientoStockFormData formData) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(movimientoService.registrarMovimiento(formData));
    }

    @GetMapping("/evento/{eventoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<MovimientoStockDTO>> getMovimientosByEvento(@PathVariable Long eventoId) {
        return ResponseEntity.ok(movimientoService.getMovimientosByEvento(eventoId));
    }

    @GetMapping("/tipo/{tipo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<MovimientoStockDTO>> getMovimientosByTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(movimientoService.getMovimientosByTipo(tipo));
    }

    @GetMapping("/fecha-range")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<MovimientoStockDTO>> getMovimientosByFechaRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        return ResponseEntity.ok(movimientoService.getMovimientosByFechaRange(desde, hasta));
    }

    @GetMapping("/producto/{productoId}/fecha-range")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<MovimientoStockDTO>> getMovimientosByProductoAndFecha(
            @PathVariable Long productoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        return ResponseEntity.ok(movimientoService.getMovimientosByProductoAndFecha(productoId, desde, hasta));
    }
}
