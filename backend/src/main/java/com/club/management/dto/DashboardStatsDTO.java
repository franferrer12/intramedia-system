package com.club.management.dto;

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
public class DashboardStatsDTO {
    private Integer eventosActivos;
    private Integer totalUsuarios;
    private Integer totalProveedores;
    private BigDecimal ingresosMes;
    private List<ProximoEventoDTO> proximosEventos;
    private List<ActividadRecienteDTO> actividadReciente;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProximoEventoDTO {
        private Long id;
        private String nombre;
        private String fecha;
        private String hora;
        private String estado;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActividadRecienteDTO {
        private String tipo; // EVENTO_CREADO, USUARIO_CREADO, TRANSACCION_CREADA, etc.
        private String descripcion;
        private String fechaHora;
        private String tiempoRelativo; // "Hace 2 horas"
    }
}
