package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "dispositivos_pos_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispositivoPOSLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispositivo_id", nullable = false)
    private DispositivoPOS dispositivo;

    // Evento
    @Column(name = "tipo_evento", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TipoEvento tipoEvento;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;

    // Contexto
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    // Timestamp
    @Builder.Default
    private LocalDateTime fecha = LocalDateTime.now();

    public enum TipoEvento {
        LOGIN,
        LOGOUT,
        LOGIN_FALLIDO,
        VENTA,
        ERROR,
        SINCRONIZACION,
        ACTUALIZACION,
        CONEXION,
        DESCONEXION
    }
}
