package com.club.management.controller;

import com.club.management.dto.response.InventoryStatsDTO;
import com.club.management.service.InventoryStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador para estadísticas del inventario
 */
@RestController
@RequestMapping("/api/inventory/stats")
@RequiredArgsConstructor
public class InventoryStatsController {

    private final InventoryStatsService statsService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<InventoryStatsDTO> getInventoryStats() {
        return ResponseEntity.ok(statsService.getInventoryStats());
    }
}
