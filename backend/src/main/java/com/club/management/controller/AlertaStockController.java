package com.club.management.controller;

import com.club.management.entity.AlertaStock;
import com.club.management.service.AlertaStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertas-stock")
@RequiredArgsConstructor
public class AlertaStockController {

    private final AlertaStockService alertaService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<AlertaStock>> getAlertasActivas() {
        return ResponseEntity.ok(alertaService.getAlertasActivas());
    }

    @GetMapping("/no-leidas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<AlertaStock>> getAlertasNoLeidas() {
        return ResponseEntity.ok(alertaService.getAlertasNoLeidas());
    }

    @GetMapping("/conteo-no-leidas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<Long> getConteoNoLeidas() {
        return ResponseEntity.ok(alertaService.getConteoAlertasNoLeidas());
    }

    @PostMapping("/{id}/marcar-leida")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<Void> marcarComoLeida(@PathVariable Long id) {
        alertaService.marcarComoLeida(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/marcar-todas-leidas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<Void> marcarTodasComoLeidas() {
        alertaService.marcarTodasComoLeidas();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<Void> desactivarAlerta(@PathVariable Long id) {
        alertaService.desactivarAlerta(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forzar-verificacion")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<String> forzarVerificacion() {
        alertaService.forzarVerificacionStock();
        return ResponseEntity.ok("Verificación de stock ejecutada correctamente");
    }
}
