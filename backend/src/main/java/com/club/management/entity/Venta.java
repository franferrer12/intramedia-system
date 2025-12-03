package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa una venta realizada en el POS
 * Contiene información del ticket, pago y detalles de productos
 */
@Entity
@Table(name = "ventas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sesion_caja_id", nullable = false)
    private SesionCaja sesionCaja;

    @Column(name = "numero_ticket", nullable = false, unique = true, length = 50)
    private String numeroTicket;  // AUTO: VTA-20251010-0001

    @Column(name = "fecha", nullable = false)
    @Builder.Default
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "descuento", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 30)
    private MetodoPago metodoPago;

    @Column(name = "monto_efectivo", precision = 10, scale = 2)
    private BigDecimal montoEfectivo;

    @Column(name = "monto_tarjeta", precision = 10, scale = 2)
    private BigDecimal montoTarjeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;  // Cajero

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id")
    private Evento evento;  // Opcional

    @Column(name = "cliente_nombre", length = 200)
    private String clienteNombre;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relación con detalles de venta
    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DetalleVenta> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
    }

    /**
     * Calcula el subtotal sumando todos los detalles
     */
    public BigDecimal calcularSubtotal() {
        return detalles.stream()
                .map(DetalleVenta::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula el descuento total de todos los detalles
     */
    public BigDecimal calcularDescuentoTotal() {
        return detalles.stream()
                .map(DetalleVenta::getDescuento)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula el total final (subtotal - descuentos)
     */
    public BigDecimal calcularTotal() {
        return calcularSubtotal().subtract(calcularDescuentoTotal());
    }

    /**
     * Agrega un detalle de venta y actualiza los totales
     */
    public void addDetalle(DetalleVenta detalle) {
        detalles.add(detalle);
        detalle.setVenta(this);
        recalcularTotales();
    }

    /**
     * Recalcula subtotal, descuento y total
     */
    public void recalcularTotales() {
        this.subtotal = calcularSubtotal();
        this.descuento = calcularDescuentoTotal();
        this.total = calcularTotal();
    }

    /**
     * Valida los montos según método de pago
     */
    public void validarMontosPago() {
        switch (metodoPago) {
            case EFECTIVO:
                if (montoEfectivo == null || montoEfectivo.compareTo(total) < 0) {
                    throw new IllegalStateException("Monto efectivo insuficiente");
                }
                montoTarjeta = BigDecimal.ZERO;
                break;
            case TARJETA:
                if (montoTarjeta == null || montoTarjeta.compareTo(total) < 0) {
                    throw new IllegalStateException("Monto tarjeta insuficiente");
                }
                montoEfectivo = BigDecimal.ZERO;
                break;
            case MIXTO:
                if (montoEfectivo == null || montoTarjeta == null) {
                    throw new IllegalStateException("Deben especificarse ambos montos para pago mixto");
                }
                BigDecimal sumaPagos = montoEfectivo.add(montoTarjeta);
                if (sumaPagos.compareTo(total) < 0) {
                    throw new IllegalStateException("La suma de pagos es insuficiente");
                }
                break;
        }
    }

    /**
     * Enumera los métodos de pago disponibles
     */
    public enum MetodoPago {
        EFECTIVO,
        TARJETA,
        MIXTO
    }
}
