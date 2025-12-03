package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Entidad Evento
 * Representa los eventos/fiestas organizados en la discoteca
 */
@Entity
@Table(name = "eventos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio")
    private LocalTime horaInicio;

    @Column(name = "hora_fin")
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoEvento tipo;

    @Column(name = "aforo_esperado")
    private Integer aforoEsperado;

    @Column(name = "aforo_real")
    private Integer aforoReal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private EstadoEvento estado = EstadoEvento.PLANIFICADO;

    private String artista;

    @Column(name = "cache_artista", precision = 10, scale = 2)
    private BigDecimal cacheArtista;

    @Column(name = "ingresos_estimados", precision = 10, scale = 2)
    private BigDecimal ingresosEstimados;

    @Column(name = "gastos_estimados", precision = 10, scale = 2)
    private BigDecimal gastosEstimados;

    @Column(name = "ingresos_reales", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal ingresosReales = BigDecimal.ZERO;

    @Column(name = "gastos_reales", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal gastosReales = BigDecimal.ZERO;

    @Column(length = 1000)
    private String descripcion;

    @Column(length = 500)
    private String notas;

    @CreatedDate
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @LastModifiedDate
    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    /**
     * Calcula el beneficio neto del evento
     */
    public BigDecimal calcularBeneficio() {
        if (ingresosReales == null || gastosReales == null) {
            return BigDecimal.ZERO;
        }
        return ingresosReales.subtract(gastosReales);
    }

    /**
     * Calcula el margen de beneficio en porcentaje
     */
    public BigDecimal calcularMargen() {
        if (ingresosReales == null || ingresosReales.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal beneficio = calcularBeneficio();
        return beneficio.divide(ingresosReales, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Enum de tipos de evento
     */
    public enum TipoEvento {
        REGULAR,        // Viernes/Sábado normal
        ESPECIAL,       // Festivos, eventos especiales
        CONCIERTO,      // Con artista en vivo
        PRIVADO,        // Evento privado/corporativo
        TEMATICO        // Fiesta temática
    }

    /**
     * Enum de estados de evento
     */
    public enum EstadoEvento {
        PLANIFICADO,    // En planificación
        CONFIRMADO,     // Confirmado, listo para ejecutar
        EN_CURSO,       // Sucediendo ahora
        FINALIZADO,     // Terminado
        CANCELADO       // Cancelado
    }
}
