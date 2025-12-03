package com.club.management.controller;

import com.club.management.dto.request.EmpleadoRequest;
import com.club.management.dto.response.EmpleadoDTO;
import com.club.management.service.EmpleadoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empleados")
@RequiredArgsConstructor
public class EmpleadoController {

    private final EmpleadoService empleadoService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<EmpleadoDTO>> getAll() {
        return ResponseEntity.ok(empleadoService.findAll());
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<EmpleadoDTO>> getActivos() {
        return ResponseEntity.ok(empleadoService.findActivos());
    }

    @GetMapping("/inactivos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<EmpleadoDTO>> getInactivos() {
        return ResponseEntity.ok(empleadoService.findInactivos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<EmpleadoDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(empleadoService.findById(id));
    }

    @GetMapping("/cargo/{cargo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<EmpleadoDTO>> getByCargo(@PathVariable String cargo) {
        return ResponseEntity.ok(empleadoService.findByCargo(cargo));
    }

    @GetMapping("/departamento/{departamento}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<EmpleadoDTO>> getByDepartamento(@PathVariable String departamento) {
        return ResponseEntity.ok(empleadoService.findByDepartamento(departamento));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<EmpleadoDTO>> search(@RequestParam String q) {
        return ResponseEntity.ok(empleadoService.search(q));
    }

    @GetMapping("/cargos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<String>> getAllCargos() {
        return ResponseEntity.ok(empleadoService.getAllCargos());
    }

    @GetMapping("/departamentos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<String>> getAllDepartamentos() {
        return ResponseEntity.ok(empleadoService.getAllDepartamentos());
    }

    @GetMapping("/count/activos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<Long> countActivos() {
        return ResponseEntity.ok(empleadoService.countActivos());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<EmpleadoDTO> create(@Valid @RequestBody EmpleadoRequest request) {
        EmpleadoDTO created = empleadoService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<EmpleadoDTO> update(@PathVariable Long id,
                                              @Valid @RequestBody EmpleadoRequest request) {
        return ResponseEntity.ok(empleadoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        empleadoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/dar-baja")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<EmpleadoDTO> darDeBaja(@PathVariable Long id) {
        return ResponseEntity.ok(empleadoService.darDeBaja(id));
    }

    @PatchMapping("/{id}/reactivar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<EmpleadoDTO> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(empleadoService.reactivar(id));
    }
}
