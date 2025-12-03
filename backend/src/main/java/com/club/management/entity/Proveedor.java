package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entidad Proveedor
 * Representa los proveedores del club
 */
@Entity
@Table(name = "proveedores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String contacto;

    private String telefono;

    private String email;

    private String direccion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoProveedor tipo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreatedDate
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @LastModifiedDate
    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    /**
     * Enum de tipos de proveedor
     */
    public enum TipoProveedor {
        BEBIDAS,
        ALIMENTOS,
        EQUIPAMIENTO,
        SERVICIOS,
        OTRO
    }
}
