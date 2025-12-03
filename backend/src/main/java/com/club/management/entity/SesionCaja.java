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
 * Entidad que representa una sesión de caja (apertura y cierre)
 * Controla el flujo de dinero en cada terminal POS/barra
 */
@Entity
@Table(name = "sesiones_caja")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_caja", nullable = false, length = 100)
    private String nombreCaja;  // Ej: "Barra Principal", "Barra VIP"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_apertura_id", nullable = false)
    private Empleado empleadoApertura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_cierre_id")
    private Empleado empleadoCierre;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "monto_inicial", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal montoInicial = BigDecimal.ZERO;

    @Column(name = "monto_esperado", precision = 10, scale = 2)
    private BigDecimal montoEsperado;  // Calculado al cierre

    @Column(name = "monto_real", precision = 10, scale = 2)
    private BigDecimal montoReal;  // Contado físicamente al cierre

    @Column(name = "diferencia", precision = 10, scale = 2)
    private BigDecimal diferencia;  // montoReal - montoEsperado

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoSesionCaja estado = EstadoSesionCaja.ABIERTA;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relación con ventas (una sesión tiene muchas ventas)
    @OneToMany(mappedBy = "sesionCaja", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Venta> ventas = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (fechaApertura == null) {
            fechaApertura = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Calcula el total de ventas de esta sesión
     */
    public BigDecimal calcularTotalVentas() {
        return ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula el monto esperado (inicial + ventas)
     */
    public BigDecimal calcularMontoEsperado() {
        return montoInicial.add(calcularTotalVentas());
    }

    /**
     * Enumera los estados posibles de una sesión
     */
    public enum EstadoSesionCaja {
        ABIERTA,
        CERRADA
    }
}
