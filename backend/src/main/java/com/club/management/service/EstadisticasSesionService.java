package com.club.management.service;

import com.club.management.dto.response.EstadisticasSesionDTO;
import com.club.management.entity.SesionVenta;
import com.club.management.repository.ConsumoSesionRepository;
import com.club.management.repository.SesionVentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EstadisticasSesionService {

    private final SesionVentaRepository sesionVentaRepository;
    private final ConsumoSesionRepository consumoSesionRepository;

    @Transactional(readOnly = true)
    public EstadisticasSesionDTO obtenerEstadisticas(Long sesionId) {
        log.info("Obteniendo estadísticas para sesión ID: {}", sesionId);

        SesionVenta sesion = sesionVentaRepository.findById(sesionId)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada con ID: " + sesionId));

        // Obtener datos de consumos con join fetch
        var consumos = consumoSesionRepository.findBySesionIdOrderByFechaRegistroDesc(sesionId);

        if (consumos.isEmpty()) {
            return crearEstadisticasVacias();
        }

        // Calcular estadísticas
        var topProductos = calcularTopProductos(consumos, sesion.getValorTotal());
        var ventasPorCategoria = calcularVentasPorCategoria(consumos, sesion.getValorTotal());
        var ventasPorHora = calcularVentasPorHora(consumos);
        var metricas = calcularMetricas(sesion, consumos);

        return EstadisticasSesionDTO.builder()
                .topProductos(topProductos)
                .ventasPorCategoria(ventasPorCategoria)
                .ventasPorHora(ventasPorHora)
                .metricas(metricas)
                .build();
    }

    private List<EstadisticasSesionDTO.TopProductoDTO> calcularTopProductos(
            List<com.club.management.entity.ConsumoSesion> consumos,
            BigDecimal totalSesion) {

        // Agrupar por producto
        Map<Long, Map.Entry<String, List<com.club.management.entity.ConsumoSesion>>> productoMap =
                consumos.stream()
                        .collect(Collectors.groupingBy(
                                com.club.management.entity.ConsumoSesion::getProductoId,
                                Collectors.collectingAndThen(
                                        Collectors.toList(),
                                        list -> new AbstractMap.SimpleEntry<>(
                                                list.get(0).getProductoNombre(),
                                                list
                                        )
                                )
                        ));

        // Calcular totales y crear DTOs
        List<EstadisticasSesionDTO.TopProductoDTO> topProductos = productoMap.entrySet().stream()
                .map(entry -> {
                    Long productoId = entry.getKey();
                    String productoNombre = entry.getValue().getKey();
                    List<com.club.management.entity.ConsumoSesion> consumosProducto = entry.getValue().getValue();

                    BigDecimal cantidad = consumosProducto.stream()
                            .map(com.club.management.entity.ConsumoSesion::getCantidad)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal total = consumosProducto.stream()
                            .map(com.club.management.entity.ConsumoSesion::getSubtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Double porcentaje = totalSesion.compareTo(BigDecimal.ZERO) > 0
                            ? total.divide(totalSesion, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue()
                            : 0.0;

                    return EstadisticasSesionDTO.TopProductoDTO.builder()
                            .productoId(productoId)
                            .productoNombre(productoNombre)
                            .cantidad(cantidad)
                            .total(total)
                            .porcentaje(porcentaje)
                            .build();
                })
                .sorted(Comparator.comparing(EstadisticasSesionDTO.TopProductoDTO::getTotal).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return topProductos;
    }

    private List<EstadisticasSesionDTO.VentaPorCategoriaDTO> calcularVentasPorCategoria(
            List<com.club.management.entity.ConsumoSesion> consumos,
            BigDecimal totalSesion) {

        // Agrupar por categoría
        Map<String, List<com.club.management.entity.ConsumoSesion>> categoriaMap = consumos.stream()
                .collect(Collectors.groupingBy(c ->
                        c.getProducto() != null && c.getProducto().getCategoria() != null
                                ? c.getProducto().getCategoria()
                                : "Sin Categoría"
                ));

        // Calcular totales por categoría
        List<EstadisticasSesionDTO.VentaPorCategoriaDTO> ventasPorCategoria = categoriaMap.entrySet().stream()
                .map(entry -> {
                    String categoria = entry.getKey();
                    List<com.club.management.entity.ConsumoSesion> consumosCategoria = entry.getValue();

                    BigDecimal cantidad = consumosCategoria.stream()
                            .map(com.club.management.entity.ConsumoSesion::getCantidad)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal total = consumosCategoria.stream()
                            .map(com.club.management.entity.ConsumoSesion::getSubtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Double porcentaje = totalSesion.compareTo(BigDecimal.ZERO) > 0
                            ? total.divide(totalSesion, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue()
                            : 0.0;

                    return EstadisticasSesionDTO.VentaPorCategoriaDTO.builder()
                            .categoria(categoria)
                            .cantidad(cantidad)
                            .total(total)
                            .porcentaje(porcentaje)
                            .build();
                })
                .sorted(Comparator.comparing(EstadisticasSesionDTO.VentaPorCategoriaDTO::getTotal).reversed())
                .collect(Collectors.toList());

        return ventasPorCategoria;
    }

    private List<EstadisticasSesionDTO.VentaPorHoraDTO> calcularVentasPorHora(
            List<com.club.management.entity.ConsumoSesion> consumos) {

        // Agrupar por hora
        Map<Integer, List<com.club.management.entity.ConsumoSesion>> horaMap = consumos.stream()
                .collect(Collectors.groupingBy(c -> c.getFechaRegistro().getHour()));

        // Calcular totales por hora
        List<EstadisticasSesionDTO.VentaPorHoraDTO> ventasPorHora = horaMap.entrySet().stream()
                .map(entry -> {
                    Integer hora = entry.getKey();
                    List<com.club.management.entity.ConsumoSesion> consumosHora = entry.getValue();

                    Long cantidad = (long) consumosHora.size();

                    BigDecimal total = consumosHora.stream()
                            .map(com.club.management.entity.ConsumoSesion::getSubtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return EstadisticasSesionDTO.VentaPorHoraDTO.builder()
                            .hora(hora)
                            .cantidad(cantidad)
                            .total(total)
                            .build();
                })
                .sorted(Comparator.comparing(EstadisticasSesionDTO.VentaPorHoraDTO::getHora))
                .collect(Collectors.toList());

        return ventasPorHora;
    }

    private EstadisticasSesionDTO.MetricasSesionDTO calcularMetricas(
            SesionVenta sesion,
            List<com.club.management.entity.ConsumoSesion> consumos) {

        // Ticket promedio (no aplica en sesiones - retornar total)
        BigDecimal ticketPromedio = sesion.getValorTotal();

        // Items por ticket (total de items en la sesión)
        BigDecimal itemsPorTicket = sesion.getTotalItems();

        // Velocidad de venta (items por hora)
        BigDecimal velocidadVenta = BigDecimal.ZERO;
        if (sesion.getFechaApertura() != null) {
            LocalDateTime fechaFin = sesion.getFechaCierre() != null
                    ? sesion.getFechaCierre()
                    : LocalDateTime.now();

            long minutosTranscurridos = Duration.between(sesion.getFechaApertura(), fechaFin).toMinutes();

            if (minutosTranscurridos > 0) {
                BigDecimal horasTranscurridas = BigDecimal.valueOf(minutosTranscurridos)
                        .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

                velocidadVenta = sesion.getTotalItems()
                        .divide(horasTranscurridas, 2, RoundingMode.HALF_UP);
            }
        }

        // Tiempo promedio por consumo (en segundos)
        Long tiempoPromedioPorConsumo = 0L;
        if (consumos.size() > 1 && sesion.getFechaApertura() != null) {
            LocalDateTime fechaFin = sesion.getFechaCierre() != null
                    ? sesion.getFechaCierre()
                    : LocalDateTime.now();

            long segundosTotales = Duration.between(sesion.getFechaApertura(), fechaFin).getSeconds();
            tiempoPromedioPorConsumo = segundosTotales / consumos.size();
        }

        return EstadisticasSesionDTO.MetricasSesionDTO.builder()
                .ticketPromedio(ticketPromedio)
                .itemsPorTicket(itemsPorTicket)
                .velocidadVenta(velocidadVenta)
                .tiempoPromedioPorConsumo(tiempoPromedioPorConsumo)
                .build();
    }

    private EstadisticasSesionDTO crearEstadisticasVacias() {
        return EstadisticasSesionDTO.builder()
                .topProductos(Collections.emptyList())
                .ventasPorCategoria(Collections.emptyList())
                .ventasPorHora(Collections.emptyList())
                .metricas(EstadisticasSesionDTO.MetricasSesionDTO.builder()
                        .ticketPromedio(BigDecimal.ZERO)
                        .itemsPorTicket(BigDecimal.ZERO)
                        .velocidadVenta(BigDecimal.ZERO)
                        .tiempoPromedioPorConsumo(0L)
                        .build())
                .build();
    }
}
