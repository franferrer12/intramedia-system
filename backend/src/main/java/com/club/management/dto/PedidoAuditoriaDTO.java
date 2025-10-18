package com.club.management.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para respuestas de auditoría de pedidos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoAuditoriaDTO {

    private Long id;
    private Long pedidoId;
    private String numeroPedido;

    // Usuario que realizó el cambio
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;

    // Detalles del cambio
    private String accion; // 'CREADO', 'MODIFICADO', 'CAMBIO_ESTADO', 'ELIMINADO'
    private String estadoAnterior;
    private String estadoNuevo;
    private String campoModificado;
    private String valorAnterior;
    private String valorNuevo;
    private String observaciones;

    // Información técnica
    private String ipAddress;
    private String userAgent;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCambio;

    // Campo calculado para mostrar descripción amigable
    private String descripcion;
}
