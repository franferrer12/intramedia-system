package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadisticasSesionDTO {

    private List<TopProductoDTO> topProductos;
    private List<VentaPorCategoriaDTO> ventasPorCategoria;
    private List<VentaPorHoraDTO> ventasPorHora;
    private MetricasSesionDTO metricas;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductoDTO {
        private Long productoId;
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal total;
        private Double porcentaje;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VentaPorCategoriaDTO {
        private String categoria;
        private BigDecimal cantidad;
        private BigDecimal total;
        private Double porcentaje;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VentaPorHoraDTO {
        private Integer hora;
        private Long cantidad;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricasSesionDTO {
        private BigDecimal ticketPromedio;
        private BigDecimal itemsPorTicket;
        private BigDecimal velocidadVenta; // items/hora
        private Long tiempoPromedioPorConsumo; // segundos
    }
}
