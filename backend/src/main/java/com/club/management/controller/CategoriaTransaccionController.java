package com.club.management.controller;

import com.club.management.dto.request.CategoriaTransaccionRequest;
import com.club.management.dto.response.CategoriaTransaccionDTO;
import com.club.management.service.CategoriaTransaccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias-transaccion")
@RequiredArgsConstructor
public class CategoriaTransaccionController {

    private final CategoriaTransaccionService categoriaTransaccionService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<CategoriaTransaccionDTO>> getAll() {
        return ResponseEntity.ok(categoriaTransaccionService.findAll());
    }

    @GetMapping("/activas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<CategoriaTransaccionDTO>> getActivas() {
        return ResponseEntity.ok(categoriaTransaccionService.findActivas());
    }

    @GetMapping("/tipo/{tipo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<CategoriaTransaccionDTO>> getByTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(categoriaTransaccionService.findByTipo(tipo));
    }

    @GetMapping("/tipo/{tipo}/activas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<CategoriaTransaccionDTO>> getByTipoActivas(@PathVariable String tipo) {
        return ResponseEntity.ok(categoriaTransaccionService.findByTipoActivas(tipo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<CategoriaTransaccionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaTransaccionService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<CategoriaTransaccionDTO> create(@Valid @RequestBody CategoriaTransaccionRequest request) {
        CategoriaTransaccionDTO created = categoriaTransaccionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<CategoriaTransaccionDTO> update(@PathVariable Long id,
                                                          @Valid @RequestBody CategoriaTransaccionRequest request) {
        return ResponseEntity.ok(categoriaTransaccionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoriaTransaccionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
