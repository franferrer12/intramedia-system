package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa un pedido realizado a un proveedor
 */
@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_pedido", unique = true, nullable = false, length = 50)
    private String numeroPedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPedido estado = EstadoPedido.BORRADOR;

    // Fechas
    @Column(name = "fecha_pedido", nullable = false)
    private LocalDateTime fechaPedido;

    @Column(name = "fecha_esperada")
    private LocalDate fechaEsperada;

    @Column(name = "fecha_recepcion")
    private LocalDateTime fechaRecepcion;

    // Montos
    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "impuestos", nullable = false, precision = 10, scale = 2)
    private BigDecimal impuestos = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    // Información adicional
    @Column(columnDefinition = "TEXT")
    private String notas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recepcionado_por")
    private Usuario recepcionadoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaccion_id")
    private Transaccion transaccion;

    // Detalles del pedido
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles = new ArrayList<>();

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Métodos de utilidad

    /**
     * Agregar un detalle al pedido
     */
    public void addDetalle(DetallePedido detalle) {
        detalles.add(detalle);
        detalle.setPedido(this);
    }

    /**
     * Remover un detalle del pedido
     */
    public void removeDetalle(DetallePedido detalle) {
        detalles.remove(detalle);
        detalle.setPedido(null);
    }

    /**
     * Calcular totales del pedido
     */
    public void calcularTotales() {
        this.subtotal = detalles.stream()
                .map(DetallePedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Por ahora impuestos en 0, se puede calcular según configuración
        this.impuestos = BigDecimal.ZERO;
        this.total = this.subtotal.add(this.impuestos);
    }

    /**
     * Verificar si el pedido puede ser editado
     */
    @Transient
    public Boolean isPuedeEditar() {
        return estado == EstadoPedido.BORRADOR;
    }

    /**
     * Verificar si el pedido puede ser recepcionado
     */
    @Transient
    public Boolean isPuedeRecepcionar() {
        return estado == EstadoPedido.ENVIADO ||
               estado == EstadoPedido.CONFIRMADO ||
               estado == EstadoPedido.EN_TRANSITO ||
               estado == EstadoPedido.PARCIAL;
    }

    /**
     * Verificar si el pedido puede ser cancelado
     */
    @Transient
    public Boolean isPuedeCancelar() {
        return estado != EstadoPedido.RECIBIDO &&
               estado != EstadoPedido.CANCELADO;
    }

    /**
     * Obtener cantidad total de productos
     */
    @Transient
    public BigDecimal getCantidadTotal() {
        return detalles.stream()
                .map(DetallePedido::getCantidadPedida)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Obtener cantidad total recibida
     */
    @Transient
    public BigDecimal getCantidadRecibida() {
        return detalles.stream()
                .map(DetallePedido::getCantidadRecibida)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Verificar si el pedido está completamente recibido
     */
    @Transient
    public Boolean isCompletamenteRecibido() {
        if (detalles.isEmpty()) {
            return false;
        }
        return detalles.stream()
                .allMatch(d -> d.getCantidadRecibida().compareTo(d.getCantidadPedida()) >= 0);
    }

    /**
     * Verificar si el pedido está parcialmente recibido
     */
    @Transient
    public Boolean isParcialmenteRecibido() {
        if (detalles.isEmpty()) {
            return false;
        }
        boolean algunRecibido = detalles.stream()
                .anyMatch(d -> d.getCantidadRecibida().compareTo(BigDecimal.ZERO) > 0);

        boolean algunFaltante = detalles.stream()
                .anyMatch(d -> d.getCantidadRecibida().compareTo(d.getCantidadPedida()) < 0);

        return algunRecibido && algunFaltante;
    }

    // ========== ALIAS METHODS FOR COMPATIBILITY ==========

    /**
     * Alias para getNotas() - compatibilidad con código que usa "observaciones"
     */
    public String getObservaciones() {
        return this.notas;
    }

    /**
     * Alias para setNotas() - compatibilidad con código que usa "observaciones"
     */
    public void setObservaciones(String observaciones) {
        this.notas = observaciones;
    }

    /**
     * Alias get para isPuedeEditar() - compatibilidad con Lombok getters
     */
    public Boolean getIsPuedeEditar() {
        return isPuedeEditar();
    }

    /**
     * Alias get para isPuedeRecepcionar() - compatibilidad con Lombok getters
     */
    public Boolean getIsPuedeRecepcionar() {
        return isPuedeRecepcionar();
    }

    /**
     * Alias get para isPuedeCancelar() - compatibilidad con Lombok getters
     */
    public Boolean getIsPuedeCancelar() {
        return isPuedeCancelar();
    }

    /**
     * Alias get para isCompletamenteRecibido() - compatibilidad con Lombok getters
     */
    public Boolean getIsCompletamenteRecibido() {
        return isCompletamenteRecibido();
    }

    /**
     * Alias get para isParcialmenteRecibido() - compatibilidad con Lombok getters
     */
    public Boolean getIsParcialmenteRecibido() {
        return isParcialmenteRecibido();
    }
}
