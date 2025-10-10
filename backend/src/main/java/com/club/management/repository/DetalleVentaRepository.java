package com.club.management.repository;

import com.club.management.entity.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio para gestión de detalles de venta
 */
@Repository
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {

    /**
     * Obtiene todos los detalles de una venta específica
     */
    @Query("SELECT d FROM DetalleVenta d WHERE d.venta.id = :ventaId ORDER BY d.id")
    List<DetalleVenta> findAllByVentaId(@Param("ventaId") Long ventaId);

    /**
     * Obtiene todos los detalles de ventas de un producto específico
     */
    @Query("SELECT d FROM DetalleVenta d WHERE d.producto.id = :productoId ORDER BY d.createdAt DESC")
    List<DetalleVenta> findAllByProductoId(@Param("productoId") Long productoId);

    /**
     * Obtiene los productos más vendidos en un rango de fechas
     */
    @Query("SELECT d.producto.id, d.producto.nombre, SUM(d.cantidad) as total_cantidad, " +
           "SUM(d.total) as total_ingresos, COUNT(DISTINCT d.venta.id) as num_ventas " +
           "FROM DetalleVenta d " +
           "WHERE d.venta.fecha >= :fechaInicio AND d.venta.fecha <= :fechaFin " +
           "GROUP BY d.producto.id, d.producto.nombre " +
           "ORDER BY total_cantidad DESC")
    List<Object[]> findProductosMasVendidos(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Calcula cantidad total vendida de un producto en un rango de fechas
     */
    @Query("SELECT COALESCE(SUM(d.cantidad), 0) FROM DetalleVenta d " +
           "WHERE d.producto.id = :productoId " +
           "AND d.venta.fecha >= :fechaInicio AND d.venta.fecha <= :fechaFin")
    Long calcularCantidadVendidaProducto(
        @Param("productoId") Long productoId,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtiene productos vendidos en una sesión de caja
     */
    @Query("SELECT d FROM DetalleVenta d " +
           "WHERE d.venta.sesionCaja.id = :sesionCajaId " +
           "ORDER BY d.createdAt")
    List<DetalleVenta> findAllBySesionCajaId(@Param("sesionCajaId") Long sesionCajaId);

    /**
     * Calcula total de unidades vendidas en un rango de fechas
     */
    @Query("SELECT COALESCE(SUM(d.cantidad), 0) FROM DetalleVenta d " +
           "WHERE d.venta.fecha >= :fechaInicio AND d.venta.fecha <= :fechaFin")
    Long calcularTotalUnidadesVendidas(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtiene productos vendidos agrupados por categoría
     */
    @Query("SELECT p.categoria.nombre, SUM(d.cantidad) as cantidad, SUM(d.total) as ingresos " +
           "FROM DetalleVenta d " +
           "JOIN d.producto p " +
           "WHERE d.venta.fecha >= :fechaInicio AND d.venta.fecha <= :fechaFin " +
           "GROUP BY p.categoria.nombre " +
           "ORDER BY ingresos DESC")
    List<Object[]> findVentasPorCategoria(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Busca detalles con descuentos aplicados
     */
    @Query("SELECT d FROM DetalleVenta d WHERE d.descuento > 0 ORDER BY d.createdAt DESC")
    List<DetalleVenta> findDetallesConDescuento();
}
