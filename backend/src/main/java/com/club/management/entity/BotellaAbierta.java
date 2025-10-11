package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa una botella abierta en barra
 * Permite tracking de copas servidas y control de stock dual (cerrado + abierto)
 */
@Entity
@Table(name = "botellas_abiertas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BotellaAbierta {

    /**
     * Estado de la botella abierta
     */
    public enum EstadoBotella {
        ABIERTA,        // En uso, disponible para servir
        CERRADA,        // Terminada, sin copas restantes
        DESPERDICIADA   // Rota, derramada o desperdiciada
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== RELACIONES ==========

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sesion_caja_id")
    private SesionCaja sesionCaja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abierta_por")
    private Empleado abiertaPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cerrada_por")
    private Empleado cerradaPor;

    // ========== UBICACIÓN FÍSICA ==========

    @Column(name = "ubicacion", nullable = false, length = 100)
    private String ubicacion;  // BARRA_PRINCIPAL, BARRA_VIP, COCTELERIA, etc.

    // ========== CAPACIDAD Y TRACKING DE COPAS ==========

    @Column(name = "copas_totales", nullable = false)
    private Integer copasTotales;

    @Column(name = "copas_servidas", nullable = false)
    @Builder.Default
    private Integer copasServidas = 0;

    @Column(name = "copas_restantes", nullable = false)
    private Integer copasRestantes;

    // ========== CONTROL TEMPORAL ==========

    @Column(name = "fecha_apertura", nullable = false)
    @Builder.Default
    private LocalDateTime fechaApertura = LocalDateTime.now();

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    // ========== ESTADO ==========

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoBotella estado = EstadoBotella.ABIERTA;

    // ========== METADATOS ==========

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    // ========== TIMESTAMPS ==========

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== MÉTODOS CALCULADOS ==========

    /**
     * Calcula el porcentaje de consumo de la botella
     * @return Porcentaje consumido (0-100)
     */
    @Transient
    public Double getPorcentajeConsumido() {
        if (copasTotales == null || copasTotales == 0) {
            return 0.0;
        }
        return (copasServidas.doubleValue() / copasTotales.doubleValue()) * 100.0;
    }

    /**
     * Calcula las horas que la botella ha estado abierta
     * @return Horas transcurridas desde apertura
     */
    @Transient
    public Long getHorasAbierta() {
        LocalDateTime fin = (fechaCierre != null) ? fechaCierre : LocalDateTime.now();
        return java.time.Duration.between(fechaApertura, fin).toHours();
    }

    /**
     * Verifica si la botella está casi vacía (≤ 3 copas restantes)
     * @return true si está casi vacía
     */
    @Transient
    public Boolean isCasiVacia() {
        return estado == EstadoBotella.ABIERTA && copasRestantes != null && copasRestantes <= 3;
    }

    /**
     * Verifica si la botella está vacía (0 copas restantes)
     * @return true si está vacía
     */
    @Transient
    public Boolean isVacia() {
        return copasRestantes != null && copasRestantes == 0;
    }

    /**
     * Verifica si la botella lleva abierta más de 24 horas
     * @return true si lleva más de 24h abierta
     */
    @Transient
    public Boolean isAbiertaMas24Horas() {
        return estado == EstadoBotella.ABIERTA && getHorasAbierta() > 24;
    }

    /**
     * Obtiene el nivel de alerta de la botella
     * @return VACIA, CASI_VACIA, ABIERTA_MAS_24H, o null si no hay alerta
     */
    @Transient
    public String getNivelAlerta() {
        if (estado != EstadoBotella.ABIERTA) {
            return null;
        }

        if (isVacia()) {
            return "VACÍA";
        }

        if (isCasiVacia()) {
            return "CASI_VACÍA";
        }

        if (isAbiertaMas24Horas()) {
            return "ABIERTA_MAS_24H";
        }

        return null;
    }

    /**
     * Valida que la botella tenga datos coherentes
     */
    public void validar() {
        if (producto == null) {
            throw new IllegalStateException("La botella debe tener un producto asociado");
        }

        if (copasTotales == null || copasTotales <= 0) {
            throw new IllegalStateException("Las copas totales deben ser mayores a 0");
        }

        if (copasServidas == null || copasServidas < 0) {
            throw new IllegalStateException("Las copas servidas no pueden ser negativas");
        }

        if (copasRestantes == null || copasRestantes < 0) {
            throw new IllegalStateException("Las copas restantes no pueden ser negativas");
        }

        if (copasServidas + copasRestantes != copasTotales) {
            throw new IllegalStateException(
                String.format("Copas incoherentes: servidas(%d) + restantes(%d) ≠ totales(%d)",
                    copasServidas, copasRestantes, copasTotales)
            );
        }

        if (ubicacion == null || ubicacion.isBlank()) {
            throw new IllegalStateException("La ubicación es obligatoria");
        }
    }

    /**
     * Sirve copas de la botella (valida disponibilidad)
     * @param cantidad Número de copas a servir
     */
    public void servirCopas(int cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad de copas debe ser mayor a 0");
        }

        if (estado != EstadoBotella.ABIERTA) {
            throw new IllegalStateException("No se pueden servir copas de una botella " + estado);
        }

        if (copasRestantes < cantidad) {
            throw new IllegalStateException(
                String.format("No hay suficientes copas. Restantes: %d, solicitadas: %d",
                    copasRestantes, cantidad)
            );
        }

        this.copasServidas += cantidad;
        this.copasRestantes -= cantidad;

        // Auto-cerrar si se vacía (el trigger también lo hace, pero por seguridad)
        if (copasRestantes == 0) {
            cerrar(EstadoBotella.CERRADA);
        }
    }

    /**
     * Cierra la botella con un estado específico
     * @param estadoCierre Estado final (CERRADA o DESPERDICIADA)
     */
    public void cerrar(EstadoBotella estadoCierre) {
        if (estado != EstadoBotella.ABIERTA) {
            throw new IllegalStateException("La botella ya está cerrada");
        }

        if (estadoCierre != EstadoBotella.CERRADA && estadoCierre != EstadoBotella.DESPERDICIADA) {
            throw new IllegalArgumentException("Estado de cierre no válido: " + estadoCierre);
        }

        this.estado = estadoCierre;
        this.fechaCierre = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (fechaApertura == null) {
            fechaApertura = LocalDateTime.now();
        }

        if (copasServidas == null) {
            copasServidas = 0;
        }

        if (estado == null) {
            estado = EstadoBotella.ABIERTA;
        }

        // Validar coherencia antes de insertar
        validar();
    }

    @PreUpdate
    protected void onUpdate() {
        // Validar coherencia antes de actualizar
        validar();
    }
}
