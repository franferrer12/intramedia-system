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

    // ========== CAMPOS PARA SISTEMA BOTELLAS VIP ==========

    @Column(name = "tipo_venta", length = 20)
    @Builder.Default
    private String tipoVenta = "NORMAL";  // NORMAL, BOTELLA_COMPLETA, COPA_INDIVIDUAL, PACK_VIP

    @Column(name = "es_copa_individual")
    @Builder.Default
    private Boolean esCopaIndividual = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "botella_abierta_id")
    private BotellaAbierta botellaAbierta;

    @Column(name = "copas_vendidas")
    private Integer copasVendidas;

    @Column(name = "descuento_pack_vip", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal descuentoPackVip = BigDecimal.ZERO;

    @Column(name = "notas_venta", columnDefinition = "TEXT")
    private String notasVenta;

    // ========== FIN CAMPOS BOTELLAS VIP ==========

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

        // Nota: La validación de stock se hace a nivel de base de datos
        // mediante el trigger descontar_stock_venta que verifica stock disponible
        // antes de descontar. Si no hay stock, el trigger lanzará una excepción.
    }

    /**
     * Valida toda la línea de detalle
     */
    public void validar() {
        if (venta == null) {
            throw new IllegalStateException("Debe asociar el detalle a una venta");
        }

        validarStock();
        validarVentaBotella();
        calcularTotales();
    }

    // ========== MÉTODOS SISTEMA BOTELLAS VIP ==========

    /**
     * Valida la configuración de venta de botellas/copas
     */
    public void validarVentaBotella() {
        // Si es copa individual, debe tener botella abierta y copas vendidas
        if (Boolean.TRUE.equals(esCopaIndividual)) {
            if (botellaAbierta == null) {
                throw new IllegalStateException("Venta de copa individual debe tener una botella abierta asociada");
            }
            if (copasVendidas == null || copasVendidas <= 0) {
                throw new IllegalStateException("Debe especificar el número de copas vendidas");
            }
        }
    }

    /**
     * Configura el precio según el tipo de venta de botella
     */
    public void configurarPrecioBotella() {
        if (producto == null || !Boolean.TRUE.equals(producto.getEsBotella())) {
            return;
        }

        switch (tipoVenta) {
            case "COPA_INDIVIDUAL":
                if (producto.getPrecioCopa() != null) {
                    this.precioUnitario = producto.getPrecioCopa();
                }
                break;
            case "PACK_VIP":
            case "BOTELLA_COMPLETA":
                if (producto.getPrecioBotellaVip() != null) {
                    this.precioUnitario = producto.getPrecioBotellaVip();
                }
                break;
            default:
                // NORMAL: usar precio de venta estándar
                setPrecioDesdeProducto();
        }
    }

    /**
     * Verifica si es una venta de botella VIP
     */
    @Transient
    public Boolean isVentaBotella() {
        return "BOTELLA_COMPLETA".equals(tipoVenta) || "PACK_VIP".equals(tipoVenta);
    }

    /**
     * Verifica si es una venta de copa individual
     */
    @Transient
    public Boolean isVentaCopa() {
        return "COPA_INDIVIDUAL".equals(tipoVenta) && Boolean.TRUE.equals(esCopaIndividual);
    }
}
