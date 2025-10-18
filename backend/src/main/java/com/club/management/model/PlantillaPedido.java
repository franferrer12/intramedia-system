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
@Table(name = "plantillas_pedido")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    /**
     * Detalles de la plantilla en formato JSON
     * Estructura: [{"productoId": 1, "cantidad": 10, "precioUnitario": 5.50}]
     */
    @Type(JsonBinaryType.class)
    @Column(name = "detalles", nullable = false, columnDefinition = "jsonb")
    private JsonNode detalles;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "activa", nullable = false)
    private Boolean activa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_id", nullable = false)
    private Usuario creadoPor;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_modificacion", nullable = false)
    private LocalDateTime fechaModificacion;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (fechaCreacion == null) {
            fechaCreacion = now;
        }
        if (fechaModificacion == null) {
            fechaModificacion = now;
        }
        if (activa == null) {
            activa = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }

    /**
     * Factory method para crear plantilla desde un pedido existente
     */
    public static PlantillaPedido crearDesdePedido(
            Pedido pedido,
            String nombre,
            String descripcion,
            Usuario usuario,
            JsonNode detalles
    ) {
        return PlantillaPedido.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .proveedor(pedido.getProveedor())
                .detalles(detalles)
                .observaciones(pedido.getObservaciones())
                .activa(true)
                .creadoPor(usuario)
                .fechaCreacion(LocalDateTime.now())
                .fechaModificacion(LocalDateTime.now())
                .build();
    }

    /**
     * Verificar si la plantilla puede ser usada
     */
    public boolean esUsable() {
        return activa != null && activa && detalles != null;
    }
}
