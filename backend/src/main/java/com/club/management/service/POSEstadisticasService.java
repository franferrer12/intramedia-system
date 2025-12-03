package com.club.management.service;

import com.club.management.dto.EstadisticasPOSDTO;
import com.club.management.dto.SesionCajaDTO;
import com.club.management.entity.Venta;
import com.club.management.repository.DetalleVentaRepository;
import com.club.management.repository.SesionCajaRepository;
import com.club.management.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para estadísticas del dashboard POS
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class POSEstadisticasService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final SesionCajaRepository sesionCajaRepository;
    private final SesionCajaService sesionCajaService;

    /**
     * Obtiene estadísticas completas del POS para un rango de fechas
     */
    @Transactional(readOnly = true)
    public EstadisticasPOSDTO getEstadisticas(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        log.info("Calculando estadísticas POS desde {} hasta {}", fechaInicio, fechaFin);

        // Estadísticas generales
        Long totalVentas = ventaRepository.countVentasEntreFechas(fechaInicio, fechaFin);
        BigDecimal totalIngresos = ventaRepository.calcularTotalVentasEntreFechas(fechaInicio, fechaFin);
        Long productosVendidos = detalleVentaRepository.calcularTotalUnidadesVendidas(fechaInicio, fechaFin);
        BigDecimal ticketPromedio = totalVentas > 0 ?
                totalIngresos.divide(BigDecimal.valueOf(totalVentas), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // Desglose por método de pago
        BigDecimal totalEfectivo = ventaRepository.calcularTotalPorMetodoPago(
                Venta.MetodoPago.EFECTIVO, fechaInicio, fechaFin);
        BigDecimal totalTarjeta = ventaRepository.calcularTotalPorMetodoPago(
                Venta.MetodoPago.TARJETA, fechaInicio, fechaFin);
        BigDecimal totalMixto = ventaRepository.calcularTotalPorMetodoPago(
                Venta.MetodoPago.MIXTO, fechaInicio, fechaFin);

        // Top productos más vendidos
        List<EstadisticasPOSDTO.ProductoVendidoDTO> topProductos = getTopProductos(fechaInicio, fechaFin, 10);

        // Ventas por hora
        List<EstadisticasPOSDTO.VentaPorHoraDTO> ventasPorHora = getVentasPorHora(fechaInicio, fechaFin);

        // Sesiones activas
        List<SesionCajaDTO> sesionesActivas = sesionCajaService.findSesionesAbiertas();

        return EstadisticasPOSDTO.builder()
                .totalVentas(totalVentas.intValue())
                .totalIngresos(totalIngresos)
                .productosVendidos(productosVendidos.intValue())
                .ticketPromedio(ticketPromedio)
                .totalEfectivo(totalEfectivo)
                .totalTarjeta(totalTarjeta)
                .totalMixto(totalMixto)
                .topProductos(topProductos)
                .ventasPorHora(ventasPorHora)
                .sesionesAbiertas(sesionesActivas.size())
                .sesionesActivasDetalle(sesionesActivas)
                .build();
    }

    /**
     * Obtiene estadísticas de hoy
     */
    @Transactional(readOnly = true)
    public EstadisticasPOSDTO getEstadisticasHoy() {
        LocalDateTime inicioHoy = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime finHoy = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        return getEstadisticas(inicioHoy, finHoy);
    }

    /**
     * Obtiene estadísticas de la última semana
     */
    @Transactional(readOnly = true)
    public EstadisticasPOSDTO getEstadisticasSemana() {
        LocalDateTime hace7Dias = LocalDateTime.now().minusDays(7);
        LocalDateTime ahora = LocalDateTime.now();
        return getEstadisticas(hace7Dias, ahora);
    }

    /**
     * Obtiene estadísticas del último mes
     */
    @Transactional(readOnly = true)
    public EstadisticasPOSDTO getEstadisticasMes() {
        LocalDateTime hace30Dias = LocalDateTime.now().minusDays(30);
        LocalDateTime ahora = LocalDateTime.now();
        return getEstadisticas(hace30Dias, ahora);
    }

    /**
     * Obtiene los productos más vendidos
     */
    @Transactional(readOnly = true)
    public List<EstadisticasPOSDTO.ProductoVendidoDTO> getTopProductos(
            LocalDateTime fechaInicio, LocalDateTime fechaFin, int limit) {

        List<Object[]> results = detalleVentaRepository.findProductosMasVendidos(fechaInicio, fechaFin);

        return results.stream()
                .limit(limit)
                .map(row -> EstadisticasPOSDTO.ProductoVendidoDTO.builder()
                        .productoId((Long) row[0])
                        .nombre((String) row[1])
                        .cantidadVendida((Long) row[2])
                        .totalIngresos((BigDecimal) row[3])
                        .numeroVentas(((Number) row[4]).intValue())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Obtiene ventas agrupadas por hora del día
     */
    @Transactional(readOnly = true)
    public List<EstadisticasPOSDTO.VentaPorHoraDTO> getVentasPorHora(
            LocalDateTime fechaInicio, LocalDateTime fechaFin) {

        List<Object[]> results = ventaRepository.getEstadisticasPorHora(fechaInicio, fechaFin);

        return results.stream()
                .map(row -> EstadisticasPOSDTO.VentaPorHoraDTO.builder()
                        .hora((Integer) row[0])
                        .cantidad(((Number) row[1]).intValue())
                        .total((BigDecimal) row[2])
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Obtiene estadísticas de una sesión de caja específica
     */
    @Transactional(readOnly = true)
    public EstadisticasPOSDTO getEstadisticasSesion(Long sesionId) {
        List<Venta> ventas = ventaRepository.findAllBySesionCajaId(sesionId);

        // Calcular totales
        int totalVentas = ventas.size();
        BigDecimal totalIngresos = ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int productosVendidos = ventas.stream()
                .flatMap(v -> v.getDetalles().stream())
                .mapToInt(d -> d.getCantidad())
                .sum();

        BigDecimal ticketPromedio = totalVentas > 0 ?
                totalIngresos.divide(BigDecimal.valueOf(totalVentas), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // Desglose por método de pago
        BigDecimal totalEfectivo = ventas.stream()
                .filter(v -> v.getMetodoPago() == Venta.MetodoPago.EFECTIVO)
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTarjeta = ventas.stream()
                .filter(v -> v.getMetodoPago() == Venta.MetodoPago.TARJETA)
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalMixto = ventas.stream()
                .filter(v -> v.getMetodoPago() == Venta.MetodoPago.MIXTO)
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return EstadisticasPOSDTO.builder()
                .totalVentas(totalVentas)
                .totalIngresos(totalIngresos)
                .productosVendidos(productosVendidos)
                .ticketPromedio(ticketPromedio)
                .totalEfectivo(totalEfectivo)
                .totalTarjeta(totalTarjeta)
                .totalMixto(totalMixto)
                .topProductos(new ArrayList<>())
                .ventasPorHora(new ArrayList<>())
                .sesionesAbiertas(0)
                .sesionesActivasDetalle(new ArrayList<>())
                .build();
    }
}
