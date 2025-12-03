package com.club.management.controller;

import com.club.management.dto.PedidoRecurrenteDTO;
import com.club.management.service.PedidoRecurrenteService;
import com.club.management.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pedidos-recurrentes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
public class PedidoRecurrenteController {

    private final PedidoRecurrenteService recurrenteService;
    private final UsuarioService usuarioService;

    /**
     * Obtener todos los pedidos recurrentes
     */
    @GetMapping
    public ResponseEntity<List<PedidoRecurrenteDTO>> obtenerTodos() {
        return ResponseEntity.ok(recurrenteService.getAllRecurrentes());
    }

    /**
     * Obtener pedidos recurrentes activos
     */
    @GetMapping("/activos")
    public ResponseEntity<List<PedidoRecurrenteDTO>> obtenerActivos() {
        return ResponseEntity.ok(recurrenteService.getRecurrentesActivos());
    }

    /**
     * Obtener pedido recurrente por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PedidoRecurrenteDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(recurrenteService.getRecurrenteById(id));
    }

    /**
     * Obtener próximas ejecuciones (próximos N días)
     */
    @GetMapping("/proximas-ejecuciones")
    public ResponseEntity<List<PedidoRecurrenteDTO>> obtenerProximasEjecuciones(
            @RequestParam(defaultValue = "7") int dias
    ) {
        return ResponseEntity.ok(recurrenteService.getProximasEjecuciones(dias));
    }

    /**
     * Crear nuevo pedido recurrente
     */
    @PostMapping
    public ResponseEntity<PedidoRecurrenteDTO> crear(@Valid @RequestBody PedidoRecurrenteDTO dto) {
        Long usuarioId = usuarioService.getCurrentUserId();
        PedidoRecurrenteDTO created = recurrenteService.crearRecurrente(dto, usuarioId);
        return ResponseEntity.ok(created);
    }

    /**
     * Actualizar pedido recurrente
     */
    @PutMapping("/{id}")
    public ResponseEntity<PedidoRecurrenteDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody PedidoRecurrenteDTO dto
    ) {
        return ResponseEntity.ok(recurrenteService.actualizarRecurrente(id, dto));
    }

    /**
     * Activar/Desactivar pedido recurrente
     */
    @PutMapping("/{id}/toggle-activo")
    public ResponseEntity<PedidoRecurrenteDTO> toggleActivo(@PathVariable Long id) {
        return ResponseEntity.ok(recurrenteService.toggleActivo(id));
    }

    /**
     * Eliminar pedido recurrente
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        recurrenteService.eliminarRecurrente(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Ejecutar pedidos recurrentes pendientes manualmente
     */
    @PostMapping("/ejecutar-pendientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<Map<String, Object>> ejecutarPendientes() {
        List<Long> pedidosGenerados = recurrenteService.ejecutarPedidosPendientes();
        return ResponseEntity.ok(Map.of(
                "ejecutados", pedidosGenerados.size(),
                "pedidosGenerados", pedidosGenerados
        ));
    }

    /**
     * Obtener estadísticas de pedidos recurrentes
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        return ResponseEntity.ok(recurrenteService.getEstadisticas());
    }
}
