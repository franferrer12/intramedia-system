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
@Table(name = "dispositivos_pos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispositivoPOS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Identificación
    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Tipo y ubicación
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TipoDispositivo tipo;

    @Column(length = 100)
    private String ubicacion;

    // Configuración
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_asignado_id")
    private Empleado empleadoAsignado;

    @Column(name = "pin_rapido", nullable = false)
    private String pinRapido; // Cifrado con BCrypt

    @Column(name = "categorias_predeterminadas", columnDefinition = "TEXT[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] categoriasPredeterminadas;

    // Hardware
    @Column(name = "config_impresora", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> configImpresora;

    @Column(name = "tiene_lector_barras")
    @Builder.Default
    private Boolean tieneLectorBarras = false;

    @Column(name = "tiene_cajon_dinero")
    @Builder.Default
    private Boolean tieneCajonDinero = false;

    @Column(name = "tiene_pantalla_cliente")
    @Builder.Default
    private Boolean tienePantallaCliente = false;

    // Permisos
    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> permisos;

    // Estado
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "modo_offline_habilitado")
    @Builder.Default
    private Boolean modoOfflineHabilitado = true;

    @Column(name = "modo_tablet_compartida")
    @Builder.Default
    private Boolean modoTabletCompartida = false;

    // Tracking
    @Column(name = "ultima_conexion")
    private LocalDateTime ultimaConexion;

    @Column(name = "ultima_sincronizacion")
    private LocalDateTime ultimaSincronizacion;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    // Auditoría
    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum TipoDispositivo {
        CAJA,
        BARRA,
        MOVIL
    }
}
