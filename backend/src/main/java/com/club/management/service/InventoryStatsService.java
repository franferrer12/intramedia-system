package com.club.management.service;

import com.club.management.dto.response.InventoryStatsDTO;
import com.club.management.entity.AlertaStock;
import com.club.management.entity.MovimientoStock;
import com.club.management.entity.Producto;
import com.club.management.repository.AlertaStockRepository;
import com.club.management.repository.MovimientoStockRepository;
import com.club.management.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para obtener estadísticas del inventario
 */
@Service
@RequiredArgsConstructor
public class InventoryStatsService {

    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoRepository;
    private final AlertaStockRepository alertaRepository;

    @Transactional(readOnly = true)
    public InventoryStatsDTO getInventoryStats() {
        List<Producto> productos = productoRepository.findAll();

        // Estadísticas generales
        Long totalProductos = (long) productos.size();
        Long productosActivos = productos.stream().filter(Producto::getActivo).count();
        Long productosInactivos = totalProductos - productosActivos;
        Long productosBajoStock = productos.stream()
                .filter(p -> p.getStockActual().compareTo(p.getStockMinimo()) < 0)
                .count();
        Long productosSinStock = productos.stream()
                .filter(p -> p.getStockActual().compareTo(BigDecimal.ZERO) == 0)
                .count();

        // Valor del inventario
        BigDecimal valorTotalInventario = productos.stream()
                .filter(Producto::getActivo)
                .map(p -> {
                    BigDecimal precio = p.getPrecioCompra() != null ? p.getPrecioCompra() : BigDecimal.ZERO;
                    return precio.multiply(p.getStockActual());
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal valorProductosBajoStock = productos.stream()
                .filter(p -> p.getActivo() && p.getStockActual().compareTo(p.getStockMinimo()) < 0)
                .map(p -> {
                    BigDecimal precio = p.getPrecioCompra() != null ? p.getPrecioCompra() : BigDecimal.ZERO;
                    return precio.multiply(p.getStockActual());
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Movimientos por período
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioHoy = ahora.toLocalDate().atStartOfDay();
        LocalDateTime inicioSemana = ahora.minusDays(7);
        LocalDateTime inicioMes = ahora.minusDays(30);

        Long movimientosHoy = movimientoRepository.countByFechaMovimientoAfter(inicioHoy);
        Long movimientosSemana = movimientoRepository.countByFechaMovimientoAfter(inicioSemana);
        Long movimientosMes = movimientoRepository.countByFechaMovimientoAfter(inicioMes);

        // Alertas
        List<AlertaStock> alertas = alertaRepository.findByActivaTrueOrderByFechaAlertaDesc();
        Long alertasActivas = (long) alertas.size();
        Long alertasCriticas = alertas.stream()
                .filter(a -> "CRITICO".equals(a.getNivel()))
                .count();

        // Productos más movidos (últimos 30 días)
        List<MovimientoStock> movimientosRecientes = movimientoRepository
                .findByFechaMovimientoAfterOrderByFechaMovimientoDesc(inicioMes);

        Map<Long, List<MovimientoStock>> movimientosPorProducto = movimientosRecientes.stream()
                .collect(Collectors.groupingBy(m -> m.getProducto().getId()));

        List<InventoryStatsDTO.ProductoMovimientoDTO> productosMasMovidos = movimientosPorProducto.entrySet().stream()
                .map(entry -> {
                    Producto producto = productoRepository.findById(entry.getKey()).orElse(null);
                    if (producto == null) return null;

                    List<MovimientoStock> movs = entry.getValue();
                    BigDecimal cantidadTotal = movs.stream()
                            .map(MovimientoStock::getCantidad)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return InventoryStatsDTO.ProductoMovimientoDTO.builder()
                            .productoId(producto.getId())
                            .productoNombre(producto.getNombre())
                            .productoCodigo(producto.getCodigo())
                            .totalMovimientos((long) movs.size())
                            .cantidadTotal(cantidadTotal)
                            .build();
                })
                .filter(Objects::nonNull)
                .sorted((a, b) -> b.getTotalMovimientos().compareTo(a.getTotalMovimientos()))
                .limit(10)
                .collect(Collectors.toList());

        // Distribución por categoría
        Map<String, InventoryStatsDTO.ProductoCategoriaStatsDTO> distribucionPorCategoria = productos.stream()
                .filter(Producto::getActivo)
                .collect(Collectors.groupingBy(
                        Producto::getCategoria,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    String categoria = list.get(0).getCategoria();
                                    Long cantidadProductos = (long) list.size();
                                    BigDecimal valorTotal = list.stream()
                                            .map(p -> {
                                                BigDecimal precio = p.getPrecioCompra() != null ? p.getPrecioCompra() : BigDecimal.ZERO;
                                                return precio.multiply(p.getStockActual());
                                            })
                                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                                    BigDecimal stockTotal = list.stream()
                                            .map(Producto::getStockActual)
                                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                                    return InventoryStatsDTO.ProductoCategoriaStatsDTO.builder()
                                            .categoria(categoria)
                                            .cantidadProductos(cantidadProductos)
                                            .valorTotal(valorTotal)
                                            .stockTotal(stockTotal)
                                            .build();
                                }
                        )
                ));

        return InventoryStatsDTO.builder()
                .totalProductos(totalProductos)
                .productosActivos(productosActivos)
                .productosInactivos(productosInactivos)
                .productosBajoStock(productosBajoStock)
                .productosSinStock(productosSinStock)
                .valorTotalInventario(valorTotalInventario)
                .valorProductosBajoStock(valorProductosBajoStock)
                .movimientosHoy(movimientosHoy)
                .movimientosSemana(movimientosSemana)
                .movimientosMes(movimientosMes)
                .alertasActivas(alertasActivas)
                .alertasCriticas(alertasCriticas)
                .productosMasMovidos(productosMasMovidos)
                .distribucionPorCategoria(distribucionPorCategoria)
                .build();
    }
}
