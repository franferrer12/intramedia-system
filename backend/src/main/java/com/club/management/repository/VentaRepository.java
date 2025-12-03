package com.club.management.repository;

import com.club.management.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de ventas del POS
 */
@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    /**
     * Busca una venta por su número de ticket
     */
    Optional<Venta> findByNumeroTicket(String numeroTicket);

    /**
     * Obtiene todas las ventas de una sesión de caja
     */
    @Query("SELECT v FROM Venta v WHERE v.sesionCaja.id = :sesionCajaId ORDER BY v.fecha DESC")
    List<Venta> findAllBySesionCajaId(@Param("sesionCajaId") Long sesionCajaId);

    /**
     * Obtiene ventas en un rango de fechas
     */
    @Query("SELECT v FROM Venta v WHERE v.fecha >= :fechaInicio AND v.fecha <= :fechaFin " +
           "ORDER BY v.fecha DESC")
    List<Venta> findVentasEntreFechas(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtiene ventas realizadas por un empleado específico
     */
    @Query("SELECT v FROM Venta v WHERE v.empleado.id = :empleadoId ORDER BY v.fecha DESC")
    List<Venta> findAllByEmpleadoId(@Param("empleadoId") Long empleadoId);

    /**
     * Obtiene ventas asociadas a un evento
     */
    @Query("SELECT v FROM Venta v WHERE v.evento.id = :eventoId ORDER BY v.fecha DESC")
    List<Venta> findAllByEventoId(@Param("eventoId") Long eventoId);

    /**
     * Calcula el total de ventas en un rango de fechas
     */
    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v " +
           "WHERE v.fecha >= :fechaInicio AND v.fecha <= :fechaFin")
    BigDecimal calcularTotalVentasEntreFechas(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Cuenta ventas en un rango de fechas
     */
    @Query("SELECT COUNT(v) FROM Venta v WHERE v.fecha >= :fechaInicio AND v.fecha <= :fechaFin")
    long countVentasEntreFechas(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Calcula el ticket promedio en un rango de fechas
     */
    @Query("SELECT AVG(v.total) FROM Venta v WHERE v.fecha >= :fechaInicio AND v.fecha <= :fechaFin")
    BigDecimal calcularTicketPromedioEntreFechas(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtiene las últimas N ventas
     */
    @Query("SELECT v FROM Venta v ORDER BY v.fecha DESC")
    List<Venta> findTopVentas(@Param("limit") int limit);

    /**
     * Obtiene ventas por método de pago en un rango de fechas
     */
    @Query("SELECT v FROM Venta v WHERE v.metodoPago = :metodoPago " +
           "AND v.fecha >= :fechaInicio AND v.fecha <= :fechaFin " +
           "ORDER BY v.fecha DESC")
    List<Venta> findVentasPorMetodoPago(
        @Param("metodoPago") Venta.MetodoPago metodoPago,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Calcula total de ventas por método de pago
     */
    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v " +
           "WHERE v.metodoPago = :metodoPago " +
           "AND v.fecha >= :fechaInicio AND v.fecha <= :fechaFin")
    BigDecimal calcularTotalPorMetodoPago(
        @Param("metodoPago") Venta.MetodoPago metodoPago,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtiene estadísticas de ventas por hora del día
     */
    @Query("SELECT HOUR(v.fecha) as hora, COUNT(v) as cantidad, SUM(v.total) as total " +
           "FROM Venta v " +
           "WHERE v.fecha >= :fechaInicio AND v.fecha <= :fechaFin " +
           "GROUP BY HOUR(v.fecha) " +
           "ORDER BY hora")
    List<Object[]> getEstadisticasPorHora(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Busca ventas de un cliente por nombre
     */
    @Query("SELECT v FROM Venta v WHERE LOWER(v.clienteNombre) LIKE LOWER(CONCAT('%', :nombre, '%')) " +
           "ORDER BY v.fecha DESC")
    List<Venta> findByClienteNombreContaining(@Param("nombre") String nombre);

    /**
     * Verifica si existe un número de ticket
     */
    boolean existsByNumeroTicket(String numeroTicket);
}
