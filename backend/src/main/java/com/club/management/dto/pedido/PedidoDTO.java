package com.club.management.dto.pedido;

import com.club.management.entity.EstadoPedido;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta completo para un pedido
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoDTO {

    private Long id;
    private String numeroPedido;

    // Proveedor
    private Long proveedorId;
    private String proveedorNombre;
    private String proveedorContacto;

    // Estado y fechas
    private EstadoPedido estado;
    private String estadoDisplay;
    private LocalDateTime fechaPedido;
    private LocalDate fechaEsperada;
    private LocalDateTime fechaRecepcion;

    // Montos
    private BigDecimal subtotal;
    private BigDecimal impuestos;
    private BigDecimal total;

    // Usuario
    private Long usuarioId;
    private String usuarioNombre;
    private Long recepcionadoPorId;
    private String recepcionadoPorNombre;

    // Transacción financiera asociada
    private Long transaccionId;

    // Notas
    private String notas;

    // Detalles
    private List<DetallePedidoDTO> detalles;

    // Información calculada
    private BigDecimal cantidadTotal;
    private BigDecimal cantidadRecibida;
    private Boolean puedeEditar;
    private Boolean puedeRecepcionar;
    private Boolean puedeCancelar;
    private Boolean completamenteRecibido;
    private Boolean parcialmenteRecibido;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
