package com.club.management.controller;

import com.club.management.dto.PedidoAuditoriaDTO;
import com.club.management.dto.pedido.*;
import com.club.management.entity.EstadoPedido;
import com.club.management.service.PedidoAuditoriaService;
import com.club.management.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para gestión de pedidos a proveedores
 */
@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PedidoController {

    private final PedidoService pedidoService;
    private final PedidoAuditoriaService auditoriaService;

    /**
     * Obtener todos los pedidos
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<PedidoDTO>> obtenerTodos() {
        log.info("GET /api/pedidos - Obtener todos los pedidos");
        List<PedidoDTO> pedidos = pedidoService.obtenerTodos();
        return ResponseEntity.ok(pedidos);
    }

    /**
     * Obtener pedido por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<PedidoDTO> obtenerPorId(@PathVariable Long id) {
        log.info("GET /api/pedidos/{} - Obtener pedido por ID", id);
        PedidoDTO pedido = pedidoService.obtenerPorId(id);
        return ResponseEntity.ok(pedido);
    }

    /**
     * Obtener pedidos por estado
     */
    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<PedidoDTO>> obtenerPorEstado(@PathVariable String estado) {
        log.info("GET /api/pedidos/estado/{} - Obtener pedidos por estado", estado);
        EstadoPedido estadoEnum = EstadoPedido.valueOf(estado.toUpperCase());
        List<PedidoDTO> pedidos = pedidoService.obtenerPorEstado(estadoEnum);
        return ResponseEntity.ok(pedidos);
    }

    /**
     * Obtener pedidos pendientes de recepción
     */
    @GetMapping("/pendientes-recepcion")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<PedidoDTO>> obtenerPendientesRecepcion() {
        log.info("GET /api/pedidos/pendientes-recepcion - Obtener pedidos pendientes");
        List<PedidoDTO> pedidos = pedidoService.obtenerPendientesRecepcion();
        return ResponseEntity.ok(pedidos);
    }

    /**
     * Crear un nuevo pedido
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<PedidoDTO> crearPedido(
            @Valid @RequestBody CrearPedidoRequest request,
            Authentication authentication) {
        log.info("POST /api/pedidos - Crear nuevo pedido para proveedor ID: {}", request.getProveedorId());

        // Obtener usuario actual (simplificado - en producción obtener del token)
        Long usuarioId = 1L; // TODO: Obtener del authentication

        PedidoDTO pedido = pedidoService.crearPedido(request, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(pedido);
    }

    /**
     * Actualizar estado de un pedido
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<PedidoDTO> actualizarEstado(
            @PathVariable Long id,
            @RequestParam String estado) {
        log.info("PATCH /api/pedidos/{}/estado - Actualizar estado a: {}", id, estado);
        EstadoPedido nuevoEstado = EstadoPedido.valueOf(estado.toUpperCase());
        PedidoDTO pedido = pedidoService.actualizarEstado(id, nuevoEstado);
        return ResponseEntity.ok(pedido);
    }

    /**
     * Recepcionar un pedido
     * - Actualiza cantidades recibidas
     * - Crea movimientos de stock
     * - Registra transacción financiera
     */
    @PostMapping("/{id}/recepcionar")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<PedidoDTO> recepcionarPedido(
            @PathVariable Long id,
            @Valid @RequestBody RecepcionarPedidoRequest request,
            Authentication authentication) {
        log.info("POST /api/pedidos/{}/recepcionar - Recepcionar pedido", id);

        // Obtener usuario actual
        Long usuarioId = 1L; // TODO: Obtener del authentication

        PedidoDTO pedido = pedidoService.recepcionarPedido(id, request, usuarioId);
        return ResponseEntity.ok(pedido);
    }

    /**
     * Cancelar un pedido
     */
    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<PedidoDTO> cancelarPedido(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        log.info("POST /api/pedidos/{}/cancelar - Cancelar pedido. Motivo: {}", id, motivo);
        PedidoDTO pedido = pedidoService.cancelarPedido(id, motivo);
        return ResponseEntity.ok(pedido);
    }

    /**
     * Eliminar un pedido (solo BORRADOR o CANCELADO)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarPedido(@PathVariable Long id) {
        log.info("DELETE /api/pedidos/{} - Eliminar pedido", id);
        pedidoService.eliminarPedido(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================
    // ENDPOINTS DE AUDITORÍA
    // ============================================

    /**
     * Obtener historial completo de auditoría de un pedido
     */
    @GetMapping("/{id}/auditoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<PedidoAuditoriaDTO>> obtenerHistorialAuditoria(@PathVariable Long id) {
        log.info("GET /api/pedidos/{}/auditoria - Obtener historial de auditoría", id);
        List<PedidoAuditoriaDTO> historial = auditoriaService.getHistorialPedido(id);
        return ResponseEntity.ok(historial);
    }

    /**
     * Obtener solo cambios de estado de un pedido
     */
    @GetMapping("/{id}/auditoria/cambios-estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<PedidoAuditoriaDTO>> obtenerCambiosEstado(@PathVariable Long id) {
        log.info("GET /api/pedidos/{}/auditoria/cambios-estado - Obtener cambios de estado", id);
        List<PedidoAuditoriaDTO> cambios = auditoriaService.getCambiosEstadoPedido(id);
        return ResponseEntity.ok(cambios);
    }

    /**
     * Obtener actividad reciente de auditoría (últimos 50 cambios)
     */
    @GetMapping("/auditoria/reciente")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<List<PedidoAuditoriaDTO>> obtenerActividadReciente() {
        log.info("GET /api/pedidos/auditoria/reciente - Obtener actividad reciente");
        List<PedidoAuditoriaDTO> actividad = auditoriaService.getActividadReciente();
        return ResponseEntity.ok(actividad);
    }
}
