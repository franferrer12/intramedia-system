package com.club.management.controller;

import com.club.management.dto.request.ProveedorRequest;
import com.club.management.dto.response.ProveedorDTO;
import com.club.management.entity.Proveedor.TipoProveedor;
import com.club.management.service.ProveedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para gestión de Proveedores
 */
@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorService proveedorService;

    /**
     * Obtener todos los proveedores
     */
    @GetMapping
    public ResponseEntity<List<ProveedorDTO>> getAllProveedores() {
        return ResponseEntity.ok(proveedorService.getAllProveedores());
    }

    /**
     * Obtener proveedor por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProveedorDTO> getProveedorById(@PathVariable Long id) {
        return ResponseEntity.ok(proveedorService.getProveedorById(id));
    }

    /**
     * Obtener proveedores activos
     */
    @GetMapping("/activos")
    public ResponseEntity<List<ProveedorDTO>> getProveedoresActivos() {
        return ResponseEntity.ok(proveedorService.getProveedoresActivos());
    }

    /**
     * Obtener proveedores por tipo
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<ProveedorDTO>> getProveedoresByTipo(@PathVariable TipoProveedor tipo) {
        return ResponseEntity.ok(proveedorService.getProveedoresByTipo(tipo));
    }

    /**
     * Crear nuevo proveedor
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<ProveedorDTO> createProveedor(@Valid @RequestBody ProveedorRequest request) {
        ProveedorDTO proveedor = proveedorService.createProveedor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(proveedor);
    }

    /**
     * Actualizar proveedor
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<ProveedorDTO> updateProveedor(
            @PathVariable Long id,
            @Valid @RequestBody ProveedorRequest request) {
        return ResponseEntity.ok(proveedorService.updateProveedor(id, request));
    }

    /**
     * Eliminar proveedor
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<Void> deleteProveedor(@PathVariable Long id) {
        proveedorService.deleteProveedor(id);
        return ResponseEntity.noContent().build();
    }
}
