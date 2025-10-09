package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "nominas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Nomina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Column(nullable = false, length = 7)
    private String periodo; // Formato: YYYY-MM

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Column(name = "salario_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal salarioBase;

    @Column(name = "horas_extra", precision = 5, scale = 2)
    private BigDecimal horasExtra = BigDecimal.ZERO;

    @Column(name = "precio_hora_extra", precision = 10, scale = 2)
    private BigDecimal precioHoraExtra = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal bonificaciones = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal deducciones = BigDecimal.ZERO;

    @Column(name = "salario_bruto", nullable = false, precision = 10, scale = 2)
    private BigDecimal salarioBruto;

    @Column(name = "seguridad_social", nullable = false, precision = 10, scale = 2)
    private BigDecimal seguridadSocial;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal irpf;

    @Column(name = "otras_retenciones", precision = 10, scale = 2)
    private BigDecimal otrasRetenciones = BigDecimal.ZERO;

    @Column(name = "salario_neto", nullable = false, precision = 10, scale = 2)
    private BigDecimal salarioNeto;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE"; // PENDIENTE, PAGADA, CANCELADA

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "referencia_pago", length = 100)
    private String referenciaPago;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;
}
