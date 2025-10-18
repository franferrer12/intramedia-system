package com.club.management.service;

import com.club.management.dto.AdjuntoPedidoDTO;
import com.club.management.entity.AdjuntoPedido;
import com.club.management.entity.Pedido;
import com.club.management.entity.Usuario;
import com.club.management.repository.AdjuntoPedidoRepository;
import com.club.management.repository.PedidoRepository;
import com.club.management.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de adjuntos de pedidos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdjuntoPedidoService {

    private final AdjuntoPedidoRepository adjuntoRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final FileStorageService fileStorageService;

    @Value("${app.file-storage.max-file-size:10485760}") // 10 MB por defecto
    private long maxFileSize;

    /**
     * Subir un archivo adjunto a un pedido
     */
    @Transactional
    public AdjuntoPedidoDTO subirAdjunto(
            Long pedidoId,
            MultipartFile file,
            String tipoArchivo,
            String descripcion,
            Long usuarioId) {

        // Validar que el pedido existe
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));

        // Validar tamaño del archivo
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("El archivo excede el tamaño máximo permitido de " + (maxFileSize / 1024 / 1024) + " MB");
        }

        // Validar que el archivo no esté vacío
        if (file.isEmpty()) {
            throw new RuntimeException("El archivo está vacío");
        }

        // Almacenar el archivo
        String subdirectorio = "pedidos/" + pedidoId;
        String nombreArchivo = fileStorageService.storeFileInSubdirectory(file, subdirectorio);

        // Obtener usuario (opcional)
        Usuario usuario = null;
        if (usuarioId != null) {
            usuario = usuarioRepository.findById(usuarioId).orElse(null);
        }

        // Crear registro en base de datos
        AdjuntoPedido adjunto = AdjuntoPedido.builder()
                .pedido(pedido)
                .nombreArchivo(nombreArchivo)
                .nombreOriginal(file.getOriginalFilename())
                .tipoArchivo(AdjuntoPedido.TipoAdjunto.valueOf(tipoArchivo.toUpperCase()))
                .mimeType(file.getContentType())
                .tamanioBytes(file.getSize())
                .rutaArchivo(nombreArchivo)
                .descripcion(descripcion)
                .subidoPor(usuario)
                .fechaSubida(LocalDateTime.now())
                .build();

        adjunto = adjuntoRepository.save(adjunto);

        log.info("Archivo adjunto subido exitosamente: {} para pedido ID: {}",
                file.getOriginalFilename(), pedidoId);

        return mapToDTO(adjunto);
    }

    /**
     * Obtener todos los adjuntos de un pedido
     */
    @Transactional(readOnly = true)
    public List<AdjuntoPedidoDTO> obtenerAdjuntosPedido(Long pedidoId) {
        return adjuntoRepository.findByPedidoIdOrderByFechaSubidaDesc(pedidoId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener un adjunto específico
     */
    @Transactional(readOnly = true)
    public AdjuntoPedidoDTO obtenerAdjunto(Long adjuntoId) {
        AdjuntoPedido adjunto = adjuntoRepository.findById(adjuntoId)
                .orElseThrow(() -> new RuntimeException("Adjunto no encontrado con ID: " + adjuntoId));
        return mapToDTO(adjunto);
    }

    /**
     * Descargar archivo adjunto
     */
    @Transactional(readOnly = true)
    public Resource descargarAdjunto(Long adjuntoId) {
        AdjuntoPedido adjunto = adjuntoRepository.findById(adjuntoId)
                .orElseThrow(() -> new RuntimeException("Adjunto no encontrado con ID: " + adjuntoId));

        return fileStorageService.loadFileAsResource(adjunto.getRutaArchivo());
    }

    /**
     * Eliminar un adjunto
     */
    @Transactional
    public void eliminarAdjunto(Long adjuntoId) {
        AdjuntoPedido adjunto = adjuntoRepository.findById(adjuntoId)
                .orElseThrow(() -> new RuntimeException("Adjunto no encontrado con ID: " + adjuntoId));

        // Eliminar archivo físico
        boolean archivoEliminado = fileStorageService.deleteFile(adjunto.getRutaArchivo());

        // Eliminar registro de base de datos
        adjuntoRepository.delete(adjunto);

        log.info("Adjunto eliminado: {} (archivo físico eliminado: {})",
                adjunto.getNombreOriginal(), archivoEliminado);
    }

    /**
     * Contar adjuntos de un pedido
     */
    @Transactional(readOnly = true)
    public long contarAdjuntosPedido(Long pedidoId) {
        return adjuntoRepository.countByPedidoId(pedidoId);
    }

    /**
     * Calcular tamaño total de adjuntos de un pedido
     */
    @Transactional(readOnly = true)
    public Long calcularTamanioTotal(Long pedidoId) {
        return adjuntoRepository.calcularTamanioTotalPedido(pedidoId);
    }

    /**
     * Mapear entidad a DTO
     */
    private AdjuntoPedidoDTO mapToDTO(AdjuntoPedido adjunto) {
        String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

        AdjuntoPedidoDTO dto = AdjuntoPedidoDTO.builder()
                .id(adjunto.getId())
                .pedidoId(adjunto.getPedido().getId())
                .numeroPedido(adjunto.getPedido().getNumeroPedido())
                .nombreArchivo(adjunto.getNombreArchivo())
                .nombreOriginal(adjunto.getNombreOriginal())
                .tipoArchivo(adjunto.getTipoArchivo().name())
                .mimeType(adjunto.getMimeType())
                .tamanioBytes(adjunto.getTamanioBytes())
                .tamanioLegible(adjunto.getTamanioLegible())
                .descripcion(adjunto.getDescripcion())
                .fechaSubida(adjunto.getFechaSubida())
                .esImagen(adjunto.isImagen())
                .esPdf(adjunto.isPdf())
                .build();

        // Agregar información del usuario si existe
        if (adjunto.getSubidoPor() != null) {
            dto.setSubidoPorId(adjunto.getSubidoPor().getId());
            dto.setSubidoPorNombre(adjunto.getSubidoPor().getUsername());
        }

        // Generar URLs de descarga
        dto.setUrlDescarga(baseUrl + "/api/pedidos/adjuntos/" + adjunto.getId() + "/download");

        if (adjunto.isImagen() || adjunto.isPdf()) {
            dto.setUrlVistaPrevia(baseUrl + "/api/pedidos/adjuntos/" + adjunto.getId() + "/preview");
        }

        return dto;
    }
}
