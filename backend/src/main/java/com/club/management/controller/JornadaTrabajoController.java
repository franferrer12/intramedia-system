package com.club.management.controller;

import com.club.management.dto.request.JornadaTrabajoRequest;
import com.club.management.dto.response.JornadaTrabajoDTO;
import com.club.management.service.JornadaTrabajoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jornadas")
@RequiredArgsConstructor
public class JornadaTrabajoController {

    private final JornadaTrabajoService jornadaTrabajoService;

    /**
     * Obtiene todas las jornadas de trabajo
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getAll() {
        return ResponseEntity.ok(jornadaTrabajoService.findAll());
    }

    /**
     * Obtiene una jornada por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<JornadaTrabajoDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(jornadaTrabajoService.findById(id));
    }

    /**
     * Obtiene todas las jornadas de un empleado
     */
    @GetMapping("/empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(jornadaTrabajoService.findByEmpleado(empleadoId));
    }

    /**
     * Obtiene jornadas pendientes de pago
     */
    @GetMapping("/pendientes")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getPendientes() {
        return ResponseEntity.ok(jornadaTrabajoService.findPendientes());
    }

    /**
     * Obtiene jornadas pendientes por empleado
     */
    @GetMapping("/pendientes/empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getPendientesByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(jornadaTrabajoService.findPendientesByEmpleado(empleadoId));
    }

    /**
     * Obtiene jornadas por periodo (formato YYYY-MM)
     */
    @GetMapping("/periodo/{periodo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getByPeriodo(@PathVariable String periodo) {
        return ResponseEntity.ok(jornadaTrabajoService.findByPeriodo(periodo));
    }

    /**
     * Obtiene jornadas por fecha
     */
    @GetMapping("/fecha/{fecha}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getByFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(jornadaTrabajoService.findByFecha(fecha));
    }

    /**
     * Obtiene jornadas por rango de fechas
     */
    @GetMapping("/rango")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getByRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(jornadaTrabajoService.findByRangoFechas(fechaInicio, fechaFin));
    }

    /**
     * Obtiene jornadas por evento
     */
    @GetMapping("/evento/{eventoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<JornadaTrabajoDTO>> getByEvento(@PathVariable Long eventoId) {
        return ResponseEntity.ok(jornadaTrabajoService.findByEvento(eventoId));
    }

    /**
     * Obtiene estadísticas de un empleado
     */
    @GetMapping("/stats/empleado/{empleadoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<Map<String, Object>> getEstadisticasEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(jornadaTrabajoService.getEstadisticasEmpleado(empleadoId));
    }

    /**
     * Obtiene estadísticas generales
     */
    @GetMapping("/stats/general")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_LECTURA')")
    public ResponseEntity<Map<String, Object>> getEstadisticasGenerales() {
        return ResponseEntity.ok(jornadaTrabajoService.getEstadisticasGenerales());
    }

    /**
     * Crea una nueva jornada de trabajo
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO')")
    public ResponseEntity<JornadaTrabajoDTO> create(@Valid @RequestBody JornadaTrabajoRequest request) {
        JornadaTrabajoDTO created = jornadaTrabajoService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Actualiza una jornada de trabajo
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH', 'ROLE_ENCARGADO')")
    public ResponseEntity<JornadaTrabajoDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody JornadaTrabajoRequest request) {
        return ResponseEntity.ok(jornadaTrabajoService.update(id, request));
    }

    /**
     * Marca una jornada como pagada
     */
    @PatchMapping("/{id}/pagar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<JornadaTrabajoDTO> marcarComoPagada(
            @PathVariable Long id,
            @Valid @RequestBody Map<String, String> body) {
        String metodoPago = body.get("metodoPago");
        return ResponseEntity.ok(jornadaTrabajoService.marcarComoPagada(id, metodoPago));
    }

    /**
     * Paga múltiples jornadas a la vez
     */
    @PostMapping("/pagar-multiples")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<List<JornadaTrabajoDTO>> pagarMultiplesJornadas(
            @Valid @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> jornadaIds = (List<Long>) body.get("jornadaIds");
        String metodoPago = (String) body.get("metodoPago");
        return ResponseEntity.ok(jornadaTrabajoService.pagarMultiplesJornadas(jornadaIds, metodoPago));
    }

    /**
     * Elimina una jornada de trabajo
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        jornadaTrabajoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
