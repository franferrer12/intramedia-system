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
@Table(name = "ventas_pendientes_sync")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentaPendienteSync {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relaciones
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispositivo_id", nullable = false)
    private DispositivoPOS dispositivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sesion_caja_id")
    private SesionVenta sesionCaja;

    // Datos de la venta
    @Column(name = "datos_venta", nullable = false, columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> datosVenta;

    @Column(name = "uuid_venta", nullable = false, unique = true, length = 36)
    private String uuidVenta;

    // Estado de sincronización
    @Builder.Default
    private Boolean sincronizada = false;

    @Column(name = "fecha_creacion")
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_sincronizacion")
    private LocalDateTime fechaSincronizacion;

    // Retry logic
    @Column(name = "intentos_sincronizacion")
    @Builder.Default
    private Integer intentosSincronizacion = 0;

    @Column(name = "ultimo_intento")
    private LocalDateTime ultimoIntento;

    @Column(name = "proximo_intento")
    private LocalDateTime proximoIntento;

    @Column(name = "error_sincronizacion", columnDefinition = "TEXT")
    private String errorSincronizacion;

    // Resultado
    @Column(name = "venta_id")
    private Long ventaId;
}
