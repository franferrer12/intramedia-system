package com.club.management.service;

import com.club.management.dto.PedidoAuditoriaDTO;
import com.club.management.entity.Pedido;
import com.club.management.entity.PedidoAuditoria;
import com.club.management.entity.Usuario;
import com.club.management.repository.PedidoAuditoriaRepository;
import com.club.management.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de auditoría de pedidos
 */
@Service
@RequiredArgsConstructor
public class PedidoAuditoriaService {

    private final PedidoAuditoriaRepository auditoriaRepository;
    private final PedidoRepository pedidoRepository;

    /**
     * Obtener historial completo de auditoría de un pedido
     */
    @Transactional(readOnly = true)
    public List<PedidoAuditoriaDTO> getHistorialPedido(Long pedidoId) {
        return auditoriaRepository.findByPedidoIdOrderByFechaCambioDesc(pedidoId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener solo cambios de estado de un pedido
     */
    @Transactional(readOnly = true)
    public List<PedidoAuditoriaDTO> getCambiosEstadoPedido(Long pedidoId) {
        return auditoriaRepository.findCambiosEstadoPorPedido(pedidoId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Registrar creación de pedido
     */
    @Transactional
    public void registrarCreacion(Pedido pedido, Usuario usuario, String ipAddress, String userAgent) {
        PedidoAuditoria auditoria = PedidoAuditoria.crearRegistroCreacion(
                pedido,
                usuario,
                ipAddress,
                userAgent
        );
        auditoriaRepository.save(auditoria);
    }

    /**
     * Registrar cambio de estado
     */
    @Transactional
    public void registrarCambioEstado(
            Pedido pedido,
            Usuario usuario,
            String estadoAnterior,
            String estadoNuevo,
            String observaciones,
            String ipAddress,
            String userAgent) {
        PedidoAuditoria auditoria = PedidoAuditoria.crearRegistroCambioEstado(
                pedido,
                usuario,
                estadoAnterior,
                estadoNuevo,
                observaciones,
                ipAddress,
                userAgent
        );
        auditoriaRepository.save(auditoria);
    }

    /**
     * Registrar modificación de campo
     */
    @Transactional
    public void registrarModificacion(
            Pedido pedido,
            Usuario usuario,
            String campoModificado,
            String valorAnterior,
            String valorNuevo,
            String ipAddress,
            String userAgent) {
        PedidoAuditoria auditoria = PedidoAuditoria.crearRegistroModificacion(
                pedido,
                usuario,
                campoModificado,
                valorAnterior,
                valorNuevo,
                ipAddress,
                userAgent
        );
        auditoriaRepository.save(auditoria);
    }

    /**
     * Registrar eliminación de pedido
     */
    @Transactional
    public void registrarEliminacion(Pedido pedido, Usuario usuario, String ipAddress, String userAgent) {
        PedidoAuditoria auditoria = PedidoAuditoria.builder()
                .pedido(pedido)
                .usuario(usuario)
                .accion("ELIMINADO")
                .observaciones("Pedido eliminado")
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .fechaCambio(LocalDateTime.now())
                .build();
        auditoriaRepository.save(auditoria);
    }

    /**
     * Obtener actividad reciente (últimos 50 cambios)
     */
    @Transactional(readOnly = true)
    public List<PedidoAuditoriaDTO> getActividadReciente() {
        return auditoriaRepository.findTop50ByOrderByFechaCambioDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Contar registros de auditoría de un pedido
     */
    @Transactional(readOnly = true)
    public long contarRegistrosPedido(Long pedidoId) {
        return auditoriaRepository.countByPedidoId(pedidoId);
    }

    /**
     * Mapear PedidoAuditoria a PedidoAuditoriaDTO
     */
    private PedidoAuditoriaDTO mapToDTO(PedidoAuditoria auditoria) {
        PedidoAuditoriaDTO dto = PedidoAuditoriaDTO.builder()
                .id(auditoria.getId())
                .pedidoId(auditoria.getPedido().getId())
                .numeroPedido(auditoria.getPedido().getNumeroPedido())
                .accion(auditoria.getAccion())
                .estadoAnterior(auditoria.getEstadoAnterior())
                .estadoNuevo(auditoria.getEstadoNuevo())
                .campoModificado(auditoria.getCampoModificado())
                .valorAnterior(auditoria.getValorAnterior())
                .valorNuevo(auditoria.getValorNuevo())
                .observaciones(auditoria.getObservaciones())
                .ipAddress(auditoria.getIpAddress())
                .userAgent(auditoria.getUserAgent())
                .fechaCambio(auditoria.getFechaCambio())
                .build();

        // Agregar información del usuario si existe
        if (auditoria.getUsuario() != null) {
            dto.setUsuarioId(auditoria.getUsuario().getId());
            dto.setUsuarioNombre(auditoria.getUsuario().getUsername());
            dto.setUsuarioEmail(auditoria.getUsuario().getEmail());
        }

        // Generar descripción amigable
        dto.setDescripcion(generarDescripcion(auditoria));

        return dto;
    }

    /**
     * Generar descripción amigable del cambio
     */
    private String generarDescripcion(PedidoAuditoria auditoria) {
        String usuario = auditoria.getUsuario() != null
                ? auditoria.getUsuario().getUsername()
                : "Sistema";

        switch (auditoria.getAccion()) {
            case "CREADO":
                return usuario + " creó el pedido";
            case "CAMBIO_ESTADO":
                return usuario + " cambió el estado de " + auditoria.getEstadoAnterior() + " a " + auditoria.getEstadoNuevo();
            case "MODIFICADO":
                return usuario + " modificó " + auditoria.getCampoModificado();
            case "ELIMINADO":
                return usuario + " eliminó el pedido";
            default:
                return usuario + " realizó una acción: " + auditoria.getAccion();
        }
    }
}
