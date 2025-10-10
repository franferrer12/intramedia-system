package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "consumos_sesion")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumoSesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sesion_id", nullable = false)
    private SesionVenta sesion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "producto_id", insertable = false, updatable = false)
    private Long productoId;

    @Column(name = "producto_nombre", nullable = false, length = 100)
    private String productoNombre;

    @Column(name = "producto_categoria", length = 50)
    private String productoCategoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tipo_venta", length = 20)
    private String tipoVenta;

    @Column(length = 500)
    private String notas;

    @Column(name = "fecha_consumo", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "registrado_por", length = 50)
    private String registradoPor;

    @PrePersist
    protected void onCreate() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }
}
