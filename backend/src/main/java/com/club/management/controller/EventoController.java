package com.club.management.controller;

import com.club.management.dto.request.EventoRequest;
import com.club.management.dto.response.EventoDTO;
import com.club.management.entity.Evento.EstadoEvento;
import com.club.management.service.EventoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para gestión de Eventos
 * Endpoints: /api/eventos
 */
@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
@Tag(name = "Eventos", description = "Gestión de eventos y actividades")
public class EventoController {

    private final EventoService eventoService;

    /**
     * GET /api/eventos
     * Obtener todos los eventos
     */
    @GetMapping
    @Operation(summary = "Listar eventos", description = "Obtiene la lista de todos los eventos")
    public ResponseEntity<List<EventoDTO>> getAllEventos() {
        List<EventoDTO> eventos = eventoService.getAllEventos();
        return ResponseEntity.ok(eventos);
    }

    /**
     * GET /api/eventos/{id}
     * Obtener evento por ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obtener evento", description = "Obtiene un evento por su ID")
    public ResponseEntity<EventoDTO> getEventoById(@PathVariable Long id) {
        EventoDTO evento = eventoService.getEventoById(id);
        return ResponseEntity.ok(evento);
    }

    /**
     * POST /api/eventos
     * Crear nuevo evento
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    @Operation(summary = "Crear evento", description = "Crea un nuevo evento")
    public ResponseEntity<EventoDTO> createEvento(@Valid @RequestBody EventoRequest request) {
        EventoDTO evento = eventoService.createEvento(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(evento);
    }

    /**
     * PUT /api/eventos/{id}
     * Actualizar evento existente
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    @Operation(summary = "Actualizar evento", description = "Actualiza un evento existente")
    public ResponseEntity<EventoDTO> updateEvento(
            @PathVariable Long id,
            @Valid @RequestBody EventoRequest request
    ) {
        EventoDTO evento = eventoService.updateEvento(id, request);
        return ResponseEntity.ok(evento);
    }

    /**
     * DELETE /api/eventos/{id}
     * Eliminar evento
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    @Operation(summary = "Eliminar evento", description = "Elimina un evento")
    public ResponseEntity<Void> deleteEvento(@PathVariable Long id) {
        eventoService.deleteEvento(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/eventos/proximos
     * Obtener eventos próximos
     */
    @GetMapping("/proximos")
    @Operation(summary = "Eventos próximos", description = "Obtiene eventos futuros")
    public ResponseEntity<List<EventoDTO>> getProximosEventos() {
        List<EventoDTO> eventos = eventoService.getProximosEventos();
        return ResponseEntity.ok(eventos);
    }

    /**
     * GET /api/eventos/estado/{estado}
     * Obtener eventos por estado
     */
    @GetMapping("/estado/{estado}")
    @Operation(summary = "Eventos por estado", description = "Obtiene eventos filtrados por estado")
    public ResponseEntity<List<EventoDTO>> getEventosByEstado(@PathVariable EstadoEvento estado) {
        List<EventoDTO> eventos = eventoService.getEventosByEstado(estado);
        return ResponseEntity.ok(eventos);
    }
}
