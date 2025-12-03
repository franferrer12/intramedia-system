package com.club.management.controller;

import com.club.management.dto.request.NominaRequest;
import com.club.management.dto.response.NominaDTO;
import com.club.management.service.NominaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nominas")
@RequiredArgsConstructor
public class NominaController {

    private final NominaService nominaService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<NominaDTO>> getAll() {
        return ResponseEntity.ok(nominaService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<NominaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(nominaService.findById(id));
    }

    @GetMapping("/periodo/{periodo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<NominaDTO>> getByPeriodo(@PathVariable String periodo) {
        return ResponseEntity.ok(nominaService.findByPeriodo(periodo));
    }

    @GetMapping("/empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<NominaDTO>> getByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(nominaService.findByEmpleado(empleadoId));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<NominaDTO>> getByEstado(@PathVariable String estado) {
        return ResponseEntity.ok(nominaService.findByEstado(estado));
    }

    @GetMapping("/periodos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<String>> getAllPeriodos() {
        return ResponseEntity.ok(nominaService.getAllPeriodos());
    }

    @GetMapping("/stats/periodo/{periodo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<Map<String, Double>> getStatsByPeriodo(@PathVariable String periodo) {
        return ResponseEntity.ok(Map.of(
                "totalPagado", nominaService.getTotalPagadoPorPeriodo(periodo),
                "totalPendiente", nominaService.getTotalPendientePorPeriodo(periodo)
        ));
    }

    @GetMapping("/count/estado/{estado}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<Long> countByEstado(@PathVariable String estado) {
        return ResponseEntity.ok(nominaService.countByEstado(estado));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<NominaDTO> create(@Valid @RequestBody NominaRequest request) {
        NominaDTO created = nominaService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/generar-masivas/{periodo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<List<NominaDTO>> generarNominasMasivas(@PathVariable String periodo) {
        List<NominaDTO> nominas = nominaService.generarNominasMasivas(periodo);
        return ResponseEntity.status(HttpStatus.CREATED).body(nominas);
    }

    /**
     * Genera una nómina para un empleado específico desde sus jornadas trabajadas del periodo
     *
     * @param empleadoId ID del empleado
     * @param periodo Periodo en formato YYYY-MM
     * @return Nómina generada
     */
    @PostMapping("/generar-desde-jornadas/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<NominaDTO> generarDesdeJornadas(
            @PathVariable Long empleadoId,
            @RequestParam String periodo) {
        NominaDTO nomina = nominaService.generarNominaDesdeJornadas(empleadoId, periodo);
        return ResponseEntity.status(HttpStatus.CREATED).body(nomina);
    }

    /**
     * Genera nóminas masivas desde jornadas para todos los empleados activos del periodo
     *
     * @param periodo Periodo en formato YYYY-MM
     * @return Lista de nóminas generadas
     */
    @PostMapping("/generar-masivas-desde-jornadas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<List<NominaDTO>> generarMasivasDesdeJornadas(
            @RequestParam String periodo) {
        List<NominaDTO> nominas = nominaService.generarNominasMasivasDesdeJornadas(periodo);
        return ResponseEntity.status(HttpStatus.CREATED).body(nominas);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<NominaDTO> update(@PathVariable Long id,
                                            @Valid @RequestBody NominaRequest request) {
        return ResponseEntity.ok(nominaService.update(id, request));
    }

    @PatchMapping("/{id}/pagar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<NominaDTO> marcarComoPagada(@PathVariable Long id,
                                                       @Valid @RequestBody Map<String, String> body) {
        String metodoPago = body.get("metodoPago");
        String referenciaPago = body.get("referenciaPago");
        return ResponseEntity.ok(nominaService.marcarComoPagada(id, metodoPago, referenciaPago));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<NominaDTO> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(nominaService.cancelar(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        nominaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
