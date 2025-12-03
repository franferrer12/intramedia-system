package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO para estadísticas del inventario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryStatsDTO {

    // Estadísticas generales
    private Long totalProductos;
    private Long productosActivos;
    private Long productosInactivos;
    private Long productosBajoStock;
    private Long productosSinStock;

    // Valor del inventario
    private BigDecimal valorTotalInventario;
    private BigDecimal valorProductosBajoStock;

    // Movimientos recientes
    private Long movimientosHoy;
    private Long movimientosSemana;
    private Long movimientosMes;

    // Alertas
    private Long alertasActivas;
    private Long alertasCriticas;

    // Productos más movidos (últimos 30 días)
    private List<ProductoMovimientoDTO> productosMasMovidos;

    // Distribución por categoría
    private Map<String, ProductoCategoriaStatsDTO> distribucionPorCategoria;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductoMovimientoDTO {
        private Long productoId;
        private String productoNombre;
        private String productoCodigo;
        private Long totalMovimientos;
        private BigDecimal cantidadTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductoCategoriaStatsDTO {
        private String categoria;
        private Long cantidadProductos;
        private BigDecimal valorTotal;
        private BigDecimal stockTotal;
    }
}
