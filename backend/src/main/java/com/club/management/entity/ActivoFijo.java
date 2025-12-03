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
@Table(name = "activos_fijos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivoFijo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategoriaActivoFijo categoria;

    // Valores financieros
    @Column(name = "valor_inicial", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorInicial;

    @Column(name = "fecha_adquisicion", nullable = false)
    private LocalDate fechaAdquisicion;

    @Column(name = "vida_util_anios", nullable = false)
    private Integer vidaUtilAnios;

    @Column(name = "valor_residual", precision = 12, scale = 2)
    private BigDecimal valorResidual = BigDecimal.ZERO;

    // Valores calculados (actualizados por trigger en BD)
    @Column(name = "amortizacion_anual", precision = 12, scale = 2)
    private BigDecimal amortizacionAnual = BigDecimal.ZERO;

    @Column(name = "amortizacion_mensual", precision = 12, scale = 2)
    private BigDecimal amortizacionMensual = BigDecimal.ZERO;

    @Column(name = "amortizacion_acumulada", precision = 12, scale = 2)
    private BigDecimal amortizacionAcumulada = BigDecimal.ZERO;

    @Column(name = "valor_neto", precision = 12, scale = 2)
    private BigDecimal valorNeto = BigDecimal.ZERO;

    // Información adicional
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "numero_factura", length = 100)
    private String numeroFactura;

    @Column(length = 200)
    private String ubicacion;

    // Control
    @Column(nullable = false)
    private Boolean activo = true;

    @Column(columnDefinition = "TEXT")
    private String notas;

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

    public enum CategoriaActivoFijo {
        INFRAESTRUCTURA,    // Obra, reformas, instalaciones
        EQUIPAMIENTO,        // Equipo de sonido, iluminación, barras
        TECNOLOGIA,          // Software, hardware, sistemas
        MOBILIARIO,          // Mesas, sillas, decoración
        LICENCIAS,           // Licencias de negocio, permisos
        STOCK_INICIAL,       // Inventario inicial de productos
        VEHICULOS,           // Vehículos de transporte
        OTROS                // Otros activos
    }
}
