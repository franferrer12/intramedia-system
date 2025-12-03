package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Entidad que representa los productos consumidos/planificados para un evento
 */
@Entity
@Table(name = "evento_productos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "cantidad_planificada", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadPlanificada;

    @Column(name = "cantidad_consumida", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cantidadConsumida = BigDecimal.ZERO;

    @Column(name = "movimiento_generado", nullable = false)
    @Builder.Default
    private Boolean movimientoGenerado = false;
}
