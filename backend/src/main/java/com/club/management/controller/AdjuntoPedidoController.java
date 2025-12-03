package com.club.management.controller;

import com.club.management.dto.AdjuntoPedidoDTO;
import com.club.management.service.AdjuntoPedidoService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Controlador REST para gestión de adjuntos de pedidos
 */
@RestController
@RequestMapping("/api/pedidos/adjuntos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdjuntoPedidoController {

    private final AdjuntoPedidoService adjuntoService;

    /**
     * Obtener todos los adjuntos de un pedido
     */
    @GetMapping("/pedido/{pedidoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<AdjuntoPedidoDTO>> obtenerAdjuntosPedido(@PathVariable Long pedidoId) {
        log.info("GET /api/pedidos/adjuntos/pedido/{} - Obtener adjuntos del pedido", pedidoId);
        List<AdjuntoPedidoDTO> adjuntos = adjuntoService.obtenerAdjuntosPedido(pedidoId);
        return ResponseEntity.ok(adjuntos);
    }

    /**
     * Subir un archivo adjunto a un pedido
     */
    @PostMapping(value = "/pedido/{pedidoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<AdjuntoPedidoDTO> subirAdjunto(
            @PathVariable Long pedidoId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoArchivo") String tipoArchivo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "usuarioId", required = false) Long usuarioId) {

        log.info("POST /api/pedidos/adjuntos/pedido/{} - Subir adjunto: {}",
                pedidoId, file.getOriginalFilename());

        // Si no se proporciona usuarioId, usar 1 por defecto (TODO: obtener del token)
        if (usuarioId == null) {
            usuarioId = 1L;
        }

        AdjuntoPedidoDTO adjunto = adjuntoService.subirAdjunto(
                pedidoId,
                file,
                tipoArchivo,
                descripcion,
                usuarioId
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(adjunto);
    }

    /**
     * Descargar un archivo adjunto
     */
    @GetMapping("/{adjuntoId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO', 'LECTURA')")
    public ResponseEntity<Resource> descargarAdjunto(
            @PathVariable Long adjuntoId,
            HttpServletRequest request) {

        log.info("GET /api/pedidos/adjuntos/{}/download - Descargar adjunto", adjuntoId);

        // Cargar el archivo como Resource
        Resource resource = adjuntoService.descargarAdjunto(adjuntoId);

        // Obtener información del adjunto
        AdjuntoPedidoDTO adjunto = adjuntoService.obtenerAdjunto(adjuntoId);

        // Determinar el tipo de contenido
        String contentType = adjunto.getMimeType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + adjunto.getNombreOriginal() + "\"")
                .body(resource);
    }

    /**
     * Vista previa de un archivo (para PDFs e imágenes)
     */
    @GetMapping("/{adjuntoId}/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO', 'LECTURA')")
    public ResponseEntity<Resource> previsualizarAdjunto(
            @PathVariable Long adjuntoId,
            HttpServletRequest request) {

        log.info("GET /api/pedidos/adjuntos/{}/preview - Vista previa del adjunto", adjuntoId);

        Resource resource = adjuntoService.descargarAdjunto(adjuntoId);
        AdjuntoPedidoDTO adjunto = adjuntoService.obtenerAdjunto(adjuntoId);

        String contentType = adjunto.getMimeType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + adjunto.getNombreOriginal() + "\"")
                .body(resource);
    }

    /**
     * Eliminar un archivo adjunto
     */
    @DeleteMapping("/{adjuntoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    public ResponseEntity<Void> eliminarAdjunto(@PathVariable Long adjuntoId) {
        log.info("DELETE /api/pedidos/adjuntos/{} - Eliminar adjunto", adjuntoId);
        adjuntoService.eliminarAdjunto(adjuntoId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtener información de un adjunto específico
     */
    @GetMapping("/{adjuntoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO', 'LECTURA')")
    public ResponseEntity<AdjuntoPedidoDTO> obtenerAdjunto(@PathVariable Long adjuntoId) {
        log.info("GET /api/pedidos/adjuntos/{} - Obtener información del adjunto", adjuntoId);
        AdjuntoPedidoDTO adjunto = adjuntoService.obtenerAdjunto(adjuntoId);
        return ResponseEntity.ok(adjunto);
    }

    /**
     * Obtener estadísticas de adjuntos de un pedido
     */
    @GetMapping("/pedido/{pedidoId}/estadisticas")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<EstadisticasAdjuntosDTO> obtenerEstadisticas(@PathVariable Long pedidoId) {
        log.info("GET /api/pedidos/adjuntos/pedido/{}/estadisticas - Obtener estadísticas", pedidoId);

        long cantidadAdjuntos = adjuntoService.contarAdjuntosPedido(pedidoId);
        Long tamanioTotal = adjuntoService.calcularTamanioTotal(pedidoId);

        EstadisticasAdjuntosDTO stats = new EstadisticasAdjuntosDTO(cantidadAdjuntos, tamanioTotal);
        return ResponseEntity.ok(stats);
    }

    /**
     * DTO para estadísticas de adjuntos
     */
    public record EstadisticasAdjuntosDTO(long cantidadAdjuntos, Long tamanioTotalBytes) {
    }
}
