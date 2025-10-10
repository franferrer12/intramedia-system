package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa una línea de producto en una venta
 * Registra producto, cantidad, precio y descuentos aplicados
 */
@Entity
@Table(name = "detalle_venta")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;  // Precio en el momento de la venta

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;  // cantidad * precio_unitario

    @Column(name = "descuento", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total;  // subtotal - descuento

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();

        // Calcular automáticamente si no se especificó
        if (precioUnitario != null && cantidad != null) {
            calcularTotales();
        }
    }

    /**
     * Calcula subtotal, aplica descuento y obtiene total
     */
    public void calcularTotales() {
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalStateException("La cantidad debe ser mayor a 0");
        }

        if (precioUnitario == null || precioUnitario.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("El precio unitario no puede ser negativo");
        }

        // Subtotal = cantidad × precio unitario
        this.subtotal = precioUnitario.multiply(BigDecimal.valueOf(cantidad));

        // Validar descuento
        if (descuento == null) {
            descuento = BigDecimal.ZERO;
        }

        if (descuento.compareTo(subtotal) > 0) {
            throw new IllegalStateException("El descuento no puede ser mayor al subtotal");
        }

        // Total = subtotal - descuento
        this.total = subtotal.subtract(descuento);
    }

    /**
     * Establece el precio unitario desde el producto actual
     */
    public void setPrecioDesdeProducto() {
        if (producto != null && producto.getPrecioVenta() != null) {
            this.precioUnitario = producto.getPrecioVenta();
        }
    }

    /**
     * Valida que haya stock disponible
     */
    public void validarStock() {
        if (producto == null) {
            throw new IllegalStateException("Debe especificar un producto");
        }

        // Si el producto tiene inventario asociado, verificar stock
        if (producto.getInventario() != null) {
            Integer stockActual = producto.getInventario().getCantidadActual();

            if (stockActual != null && stockActual < cantidad) {
                throw new IllegalStateException(
                    String.format("Stock insuficiente para '%s'. Disponible: %d, Solicitado: %d",
                        producto.getNombre(), stockActual, cantidad)
                );
            }
        }
    }

    /**
     * Valida toda la línea de detalle
     */
    public void validar() {
        if (venta == null) {
            throw new IllegalStateException("Debe asociar el detalle a una venta");
        }

        validarStock();
        calcularTotales();
    }
}
