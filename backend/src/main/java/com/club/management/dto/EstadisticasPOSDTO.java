package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para estadísticas del dashboard POS
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadisticasPOSDTO {

    // Estadísticas generales
    private Integer totalVentas;
    private BigDecimal totalIngresos;
    private Integer productosVendidos;
    private BigDecimal ticketPromedio;

    // Desglose por método de pago
    private BigDecimal totalEfectivo;
    private BigDecimal totalTarjeta;
    private BigDecimal totalMixto;

    // Top productos
    private List<ProductoVendidoDTO> topProductos;

    // Ventas por hora
    private List<VentaPorHoraDTO> ventasPorHora;

    // Sesiones activas
    private Integer sesionesAbiertas;
    private List<SesionCajaDTO> sesionesActivasDetalle;

    /**
     * DTO para producto vendido en estadísticas
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductoVendidoDTO {
        private Long productoId;
        private String nombre;
        private Long cantidadVendida;
        private BigDecimal totalIngresos;
        private Integer numeroVentas;
    }

    /**
     * DTO para ventas agrupadas por hora
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VentaPorHoraDTO {
        private Integer hora;
        private Integer cantidad;
        private BigDecimal total;
    }
}
