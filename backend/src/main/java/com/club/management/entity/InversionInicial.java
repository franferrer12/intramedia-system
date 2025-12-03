package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inversion_inicial")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InversionInicial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String concepto;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategoriaInversion categoria;

    // Valor
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false)
    private LocalDate fecha;

    // Relación con activo fijo (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activo_fijo_id")
    private ActivoFijo activoFijo;

    // Información adicional
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "numero_factura", length = 100)
    private String numeroFactura;

    @Column(name = "forma_pago", length = 50)
    private String formaPago;

    // Auditoría
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void onCreate() {
        creadoEn = LocalDateTime.now();
        actualizadoEn = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        actualizadoEn = LocalDateTime.now();
    }

    public enum CategoriaInversion {
        INFRAESTRUCTURA,
        EQUIPAMIENTO,
        TECNOLOGIA,
        MOBILIARIO,
        LICENCIAS,
        STOCK_INICIAL,
        VEHICULOS,
        MARKETING,
        FORMACION,
        OTROS
    }
}
