package com.club.management.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "pedidos_recurrentes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plantilla_id", nullable = false)
    private PlantillaPedido plantilla;

    @Column(name = "frecuencia", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Frecuencia frecuencia;

    @Column(name = "dia_ejecucion")
    private Integer diaEjecucion;

    @Column(name = "dias_ejecucion", length = 50)
    private String diasEjecucion;

    @Column(name = "hora_ejecucion", nullable = false)
    private LocalTime horaEjecucion;

    @Column(name = "proxima_ejecucion", nullable = false)
    private LocalDateTime proximaEjecucion;

    @Column(name = "ultima_ejecucion")
    private LocalDateTime ultimaEjecucion;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @Column(name = "notificar_antes_horas")
    private Integer notificarAntesHoras;

    @Column(name = "emails_notificacion", columnDefinition = "TEXT")
    private String emailsNotificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_id", nullable = false)
    private Usuario creadoPor;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_modificacion", nullable = false)
    private LocalDateTime fechaModificacion;

    public enum Frecuencia {
        SEMANAL,      // Cada semana en el día especificado
        QUINCENAL,    // Días 1 y 15 de cada mes
        MENSUAL,      // Cada mes en el día especificado
        TRIMESTRAL    // Cada 3 meses en el día especificado
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (fechaCreacion == null) {
            fechaCreacion = now;
        }
        if (fechaModificacion == null) {
            fechaModificacion = now;
        }
        if (activo == null) {
            activo = true;
        }
        if (horaEjecucion == null) {
            horaEjecucion = LocalTime.of(9, 0);
        }
        if (notificarAntesHoras == null) {
            notificarAntesHoras = 24;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }

    /**
     * Verificar si debe ejecutarse ahora
     */
    public boolean debeEjecutarseAhora() {
        if (!activo || proximaEjecucion == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(proximaEjecucion) ||
               LocalDateTime.now().isEqual(proximaEjecucion);
    }

    /**
     * Verificar si debe notificarse pronto
     */
    public boolean debeNotificarseAhora() {
        if (!activo || proximaEjecucion == null || notificarAntesHoras == null) {
            return false;
        }
        LocalDateTime tiempoNotificacion = proximaEjecucion.minusHours(notificarAntesHoras);
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(tiempoNotificacion) && now.isBefore(proximaEjecucion);
    }

    /**
     * Obtener descripción legible de la frecuencia
     */
    public String getDescripcionFrecuencia() {
        switch (frecuencia) {
            case SEMANAL:
                return "Cada semana el " + getDiaNombre(diaEjecucion) + " a las " + horaEjecucion;
            case QUINCENAL:
                return "Los días 1 y 15 de cada mes a las " + horaEjecucion;
            case MENSUAL:
                return "Cada mes el día " + diaEjecucion + " a las " + horaEjecucion;
            case TRIMESTRAL:
                return "Cada 3 meses el día " + diaEjecucion + " a las " + horaEjecucion;
            default:
                return "Frecuencia no definida";
        }
    }

    private String getDiaNombre(Integer dia) {
        if (dia == null) return "indefinido";
        String[] dias = {"", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"};
        return (dia >= 1 && dia <= 7) ? dias[dia] : "día " + dia;
    }
}
