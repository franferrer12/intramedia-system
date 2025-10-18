package com.club.management.controller;

import com.club.management.dto.PlantillaPedidoDTO;
import com.club.management.service.PlantillaPedidoService;
import com.club.management.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/plantillas-pedido")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
public class PlantillaPedidoController {

    private final PlantillaPedidoService plantillaService;
    private final UsuarioService usuarioService;

    /**
     * Obtener todas las plantillas
     */
    @GetMapping
    public ResponseEntity<List<PlantillaPedidoDTO>> obtenerTodas() {
        return ResponseEntity.ok(plantillaService.getAllPlantillas());
    }

    /**
     * Obtener plantillas activas
     */
    @GetMapping("/activas")
    public ResponseEntity<List<PlantillaPedidoDTO>> obtenerActivas() {
        return ResponseEntity.ok(plantillaService.getPlantillasActivas());
    }

    /**
     * Obtener plantilla por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PlantillaPedidoDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(plantillaService.getPlantillaById(id));
    }

    /**
     * Obtener plantillas por proveedor
     */
    @GetMapping("/proveedor/{proveedorId}")
    public ResponseEntity<List<PlantillaPedidoDTO>> obtenerPorProveedor(@PathVariable Long proveedorId) {
        return ResponseEntity.ok(plantillaService.getPlantillasByProveedor(proveedorId));
    }

    /**
     * Buscar plantillas
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<PlantillaPedidoDTO>> buscar(@RequestParam String query) {
        return ResponseEntity.ok(plantillaService.buscarPlantillas(query));
    }

    /**
     * Crear nueva plantilla
     */
    @PostMapping
    public ResponseEntity<PlantillaPedidoDTO> crear(@Valid @RequestBody PlantillaPedidoDTO dto) {
        Long usuarioId = usuarioService.getCurrentUserId();
        PlantillaPedidoDTO created = plantillaService.crearPlantilla(dto, usuarioId);
        return ResponseEntity.ok(created);
    }

    /**
     * Crear plantilla desde un pedido existente
     */
    @PostMapping("/desde-pedido/{pedidoId}")
    public ResponseEntity<PlantillaPedidoDTO> crearDesdePedido(
            @PathVariable Long pedidoId,
            @RequestParam String nombre,
            @RequestParam(required = false) String descripcion
    ) {
        Long usuarioId = usuarioService.getCurrentUserId();
        PlantillaPedidoDTO created = plantillaService.crearPlantillaDesdePedido(
                pedidoId, nombre, descripcion, usuarioId
        );
        return ResponseEntity.ok(created);
    }

    /**
     * Actualizar plantilla
     */
    @PutMapping("/{id}")
    public ResponseEntity<PlantillaPedidoDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody PlantillaPedidoDTO dto
    ) {
        return ResponseEntity.ok(plantillaService.actualizarPlantilla(id, dto));
    }

    /**
     * Activar/Desactivar plantilla
     */
    @PutMapping("/{id}/toggle-activa")
    public ResponseEntity<PlantillaPedidoDTO> toggleActiva(@PathVariable Long id) {
        return ResponseEntity.ok(plantillaService.toggleActiva(id));
    }

    /**
     * Eliminar plantilla
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        plantillaService.eliminarPlantilla(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtener estadísticas de plantillas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        return ResponseEntity.ok(plantillaService.getEstadisticas());
    }
}
