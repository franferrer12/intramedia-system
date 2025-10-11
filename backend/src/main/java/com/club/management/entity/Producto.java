package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    /**
     * Tipo de venta para productos de ocio nocturno
     * - COPA: Bebidas largas servidas en copas (gin-tonic, cubata) - 6 seg ≈ 90ml
     * - CHUPITO: Shots individuales - 2 seg ≈ 30ml
     * - BOTELLA: Venta de botella completa (reservados VIP)
     */
    public enum TipoVenta {
        COPA,      // 90ml por servicio, merma 10%
        CHUPITO,   // 30ml por servicio, merma 5%
        BOTELLA    // Botella completa, sin merma
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida = "UNIDAD";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "precio_compra", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioCompra = BigDecimal.ZERO;

    @Column(name = "precio_venta", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    // ========== CAMPOS PARA MODELO DE OCIO NOCTURNO ==========

    @Column(name = "capacidad_ml", precision = 10, scale = 2)
    private BigDecimal capacidadMl;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_venta", length = 20)
    private TipoVenta tipoVenta = TipoVenta.BOTELLA;

    @Column(name = "ml_por_servicio", precision = 10, scale = 2)
    private BigDecimal mlPorServicio;

    @Column(name = "factor_merma", precision = 5, scale = 2)
    private BigDecimal factorMerma = BigDecimal.ZERO;

    // Campos calculados automáticamente por trigger de base de datos
    @Column(name = "unidades_teoricas", precision = 10, scale = 2)
    private BigDecimal unidadesTeorica;

    @Column(name = "unidades_reales", precision = 10, scale = 2)
    private BigDecimal unidadesReales;

    @Column(name = "ingreso_total_estimado", precision = 10, scale = 2)
    private BigDecimal ingresoTotalEstimado;

    @Column(name = "beneficio_unitario", precision = 10, scale = 2)
    private BigDecimal beneficioUnitario;

    @Column(name = "margen_porcentaje", precision = 5, scale = 2)
    private BigDecimal margenPorcentaje;

    // ========== FIN CAMPOS OCIO NOCTURNO ==========

    // ========== CAMPOS PARA SISTEMA BOTELLAS VIP ==========

    @Column(name = "copas_por_botella")
    private Integer copasPorBotella;

    @Column(name = "precio_copa", precision = 10, scale = 2)
    private BigDecimal precioCopa;

    @Column(name = "precio_botella_vip", precision = 10, scale = 2)
    private BigDecimal precioBotellaVip;

    @Column(name = "es_botella", nullable = false)
    private Boolean esBotella = false;

    // ========== FIN CAMPOS BOTELLAS VIP ==========

    @Column(name = "stock_actual", nullable = false, precision = 10, scale = 2)
    private BigDecimal stockActual = BigDecimal.ZERO;

    @Column(name = "stock_minimo", nullable = false, precision = 10, scale = 2)
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    @Column(name = "stock_maximo", precision = 10, scale = 2)
    private BigDecimal stockMaximo;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(nullable = false)
    private Boolean perecedero = false;

    @Column(name = "dias_caducidad")
    private Integer diasCaducidad;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    // ========== MÉTODOS CALCULADOS ==========

    /**
     * Obtener margen de beneficio (usa el campo calculado si está disponible)
     */
    @Transient
    public BigDecimal getMargenBeneficio() {
        // Priorizar el margen calculado con modelo de ocio nocturno
        if (margenPorcentaje != null && margenPorcentaje.compareTo(BigDecimal.ZERO) != 0) {
            return margenPorcentaje;
        }

        // Fallback al cálculo simple
        if (precioCompra.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return precioVenta.subtract(precioCompra)
                .divide(precioCompra, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Calcular total de servicios/copas disponibles en el stock actual
     * Para COPA/CHUPITO: stock_actual (botellas) × unidades_reales (copas por botella)
     * Para BOTELLA: stock_actual (botellas)
     */
    @Transient
    public BigDecimal getServiciosDisponibles() {
        if (tipoVenta == TipoVenta.BOTELLA || unidadesReales == null) {
            return stockActual;
        }
        return stockActual.multiply(unidadesReales);
    }

    /**
     * Obtener texto descriptivo del tipo de venta
     */
    @Transient
    public String getTipoVentaDisplay() {
        if (tipoVenta == null) return "Botella";

        return switch (tipoVenta) {
            case COPA -> "Copa (" + (mlPorServicio != null ? mlPorServicio.intValue() + "ml" : "90ml") + ")";
            case CHUPITO -> "Chupito (" + (mlPorServicio != null ? mlPorServicio.intValue() + "ml" : "30ml") + ")";
            case BOTELLA -> "Botella completa";
        };
    }

    /**
     * Obtener ingreso potencial del stock actual
     */
    @Transient
    public BigDecimal getIngresoPotencialStock() {
        if (tipoVenta == TipoVenta.BOTELLA || unidadesReales == null) {
            return stockActual.multiply(precioVenta);
        }
        return getServiciosDisponibles().multiply(precioVenta);
    }

    /**
     * Verificar si el producto es vendido por servicios (no botella completa)
     */
    @Transient
    public Boolean isVentaPorServicio() {
        return tipoVenta != null && (tipoVenta == TipoVenta.COPA || tipoVenta == TipoVenta.CHUPITO);
    }

    // Método para verificar si está por debajo del stock mínimo
    @Transient
    public Boolean isBajoStock() {
        return stockActual.compareTo(stockMinimo) < 0;
    }

    // Método para verificar si está en stock cero
    @Transient
    public Boolean isSinStock() {
        return stockActual.compareTo(BigDecimal.ZERO) <= 0;
    }

    // ========== MÉTODOS SISTEMA BOTELLAS VIP ==========

    /**
     * Verifica si el producto es una botella con venta por copas
     */
    @Transient
    public Boolean isBotella() {
        return esBotella != null && esBotella;
    }

    /**
     * Calcula el ingreso potencial si se vende por copas
     */
    @Transient
    public BigDecimal getIngresoPotencialCopas() {
        if (!isBotella() || precioCopa == null || copasPorBotella == null) {
            return BigDecimal.ZERO;
        }
        return precioCopa.multiply(BigDecimal.valueOf(copasPorBotella));
    }

    /**
     * Calcula la diferencia de ingresos entre venta por copas vs pack VIP
     */
    @Transient
    public BigDecimal getDiferenciaCopasVsVip() {
        if (!isBotella() || precioBotellaVip == null) {
            return BigDecimal.ZERO;
        }
        return getIngresoPotencialCopas().subtract(precioBotellaVip);
    }

    /**
     * Calcula el porcentaje de descuento del pack VIP vs venta por copas
     */
    @Transient
    public BigDecimal getPorcentajeDescuentoVip() {
        if (!isBotella() || precioBotellaVip == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal ingresoCopas = getIngresoPotencialCopas();
        if (ingresoCopas.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getDiferenciaCopasVsVip()
            .divide(ingresoCopas, 4, java.math.RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Valida la configuración de botella VIP
     */
    public void validarConfiguracionBotella() {
        if (isBotella()) {
            if (copasPorBotella == null || copasPorBotella <= 0) {
                throw new IllegalStateException("Una botella debe tener copas_por_botella configurado");
            }
            if (capacidadMl == null || capacidadMl.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Una botella debe tener capacidad_ml configurada");
            }
        }
    }
}
