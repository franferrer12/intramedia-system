package com.club.management.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nivel", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Nivel nivel;

    @Column(name = "modulo", nullable = false, length = 100)
    private String modulo;

    @Column(name = "accion", nullable = false, length = 200)
    private String accion;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Type(JsonBinaryType.class)
    @Column(name = "detalles", columnDefinition = "jsonb")
    private JsonNode detalles;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "stack_trace", columnDefinition = "TEXT")
    private String stackTrace;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    public enum Nivel {
        INFO,
        WARNING,
        ERROR,
        DEBUG
    }

    @PrePersist
    protected void onCreate() {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.now();
        }
    }

    // Factory methods for common log types
    public static SystemLog info(String modulo, String accion, String mensaje) {
        return SystemLog.builder()
                .nivel(Nivel.INFO)
                .modulo(modulo)
                .accion(accion)
                .mensaje(mensaje)
                .fechaHora(LocalDateTime.now())
                .build();
    }

    public static SystemLog warning(String modulo, String accion, String mensaje) {
        return SystemLog.builder()
                .nivel(Nivel.WARNING)
                .modulo(modulo)
                .accion(accion)
                .mensaje(mensaje)
                .fechaHora(LocalDateTime.now())
                .build();
    }

    public static SystemLog error(String modulo, String accion, String mensaje, String stackTrace) {
        return SystemLog.builder()
                .nivel(Nivel.ERROR)
                .modulo(modulo)
                .accion(accion)
                .mensaje(mensaje)
                .stackTrace(stackTrace)
                .fechaHora(LocalDateTime.now())
                .build();
    }

    public static SystemLog debug(String modulo, String accion, String mensaje) {
        return SystemLog.builder()
                .nivel(Nivel.DEBUG)
                .modulo(modulo)
                .accion(accion)
                .mensaje(mensaje)
                .fechaHora(LocalDateTime.now())
                .build();
    }
}
