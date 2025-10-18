package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa un registro de auditoría para cambios en pedidos
 */
@Entity
@Table(name = "pedido_auditoria", indexes = {
    @Index(name = "idx_pedido_auditoria_pedido_id", columnList = "pedido_id"),
    @Index(name = "idx_pedido_auditoria_fecha", columnList = "fecha_cambio"),
    @Index(name = "idx_pedido_auditoria_usuario", columnList = "usuario_id"),
    @Index(name = "idx_pedido_auditoria_accion", columnList = "accion")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 50)
    private String accion; // 'CREADO', 'MODIFICADO', 'CAMBIO_ESTADO', 'ELIMINADO'

    @Column(name = "estado_anterior", length = 50)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", length = 50)
    private String estadoNuevo;

    @Column(name = "campo_modificado", length = 100)
    private String campoModificado;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "fecha_cambio", nullable = false)
    private LocalDateTime fechaCambio;

    /**
     * Método de utilidad para crear un registro de auditoría de creación
     */
    public static PedidoAuditoria crearRegistroCreacion(Pedido pedido, Usuario usuario, String ipAddress, String userAgent) {
        return PedidoAuditoria.builder()
                .pedido(pedido)
                .usuario(usuario)
                .accion("CREADO")
                .estadoNuevo(pedido.getEstado().name())
                .observaciones("Pedido creado")
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .fechaCambio(LocalDateTime.now())
                .build();
    }

    /**
     * Método de utilidad para crear un registro de auditoría de cambio de estado
     */
    public static PedidoAuditoria crearRegistroCambioEstado(
            Pedido pedido,
            Usuario usuario,
            String estadoAnterior,
            String estadoNuevo,
            String observaciones,
            String ipAddress,
            String userAgent) {
        return PedidoAuditoria.builder()
                .pedido(pedido)
                .usuario(usuario)
                .accion("CAMBIO_ESTADO")
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .observaciones(observaciones)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .fechaCambio(LocalDateTime.now())
                .build();
    }

    /**
     * Método de utilidad para crear un registro de auditoría de modificación
     */
    public static PedidoAuditoria crearRegistroModificacion(
            Pedido pedido,
            Usuario usuario,
            String campoModificado,
            String valorAnterior,
            String valorNuevo,
            String ipAddress,
            String userAgent) {
        return PedidoAuditoria.builder()
                .pedido(pedido)
                .usuario(usuario)
                .accion("MODIFICADO")
                .campoModificado(campoModificado)
                .valorAnterior(valorAnterior)
                .valorNuevo(valorNuevo)
                .observaciones("Campo modificado: " + campoModificado)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .fechaCambio(LocalDateTime.now())
                .build();
    }
}
