package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa el detalle de productos en un pedido
 */
@Entity
@Table(name = "detalle_pedido",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pedido_id", "producto_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // Cantidades
    @Column(name = "cantidad_pedida", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadPedida;

    @Column(name = "cantidad_recibida", precision = 10, scale = 2)
    private BigDecimal cantidadRecibida = BigDecimal.ZERO;

    // Precios
    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    // Información adicional
    @Column(columnDefinition = "TEXT")
    private String notas;

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Métodos de utilidad

    /**
     * Calcular subtotal del detalle
     */
    public void calcularSubtotal() {
        this.subtotal = this.precioUnitario.multiply(this.cantidadPedida);
    }

    /**
     * Obtener diferencia entre cantidad pedida y recibida
     */
    @Transient
    public BigDecimal getDiferencia() {
        return cantidadPedida.subtract(cantidadRecibida);
    }

    /**
     * Verificar si el detalle está completamente recibido
     */
    @Transient
    public Boolean isCompletamenteRecibido() {
        return cantidadRecibida.compareTo(cantidadPedida) >= 0;
    }

    /**
     * Verificar si el detalle está parcialmente recibido
     */
    @Transient
    public Boolean isParcialmenteRecibido() {
        return cantidadRecibida.compareTo(BigDecimal.ZERO) > 0 &&
               cantidadRecibida.compareTo(cantidadPedida) < 0;
    }

    /**
     * Obtener porcentaje recibido
     */
    @Transient
    public BigDecimal getPorcentajeRecibido() {
        if (cantidadPedida.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return cantidadRecibida
                .divide(cantidadPedida, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}
