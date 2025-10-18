package com.club.management.repository;

import com.club.management.model.EjecucionPedidoRecurrente;
import com.club.management.model.PedidoRecurrente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EjecucionPedidoRecurrenteRepository extends JpaRepository<EjecucionPedidoRecurrente, Long> {

    // Obtener ejecuciones por pedido recurrente
    List<EjecucionPedidoRecurrente> findByPedidoRecurrenteOrderByFechaEjecucionDesc(PedidoRecurrente pedidoRecurrente);

    // Obtener ejecuciones exitosas
    List<EjecucionPedidoRecurrente> findByExitosoTrue();

    // Obtener ejecuciones fallidas
    List<EjecucionPedidoRecurrente> findByExitosoFalse();

    // Obtener ejecuciones fallidas por pedido recurrente
    List<EjecucionPedidoRecurrente> findByPedidoRecurrenteAndExitosoFalse(PedidoRecurrente pedidoRecurrente);

    // Obtener ejecuciones en un rango de fechas
    @Query("SELECT e FROM EjecucionPedidoRecurrente e WHERE e.fechaEjecucion BETWEEN :desde AND :hasta " +
           "ORDER BY e.fechaEjecucion DESC")
    List<EjecucionPedidoRecurrente> findByRangoFechas(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    // Contar ejecuciones exitosas por pedido recurrente
    long countByPedidoRecurrenteAndExitosoTrue(PedidoRecurrente pedidoRecurrente);

    // Contar ejecuciones fallidas por pedido recurrente
    long countByPedidoRecurrenteAndExitosoFalse(PedidoRecurrente pedidoRecurrente);

    // Obtener última ejecución de un pedido recurrente
    @Query("SELECT e FROM EjecucionPedidoRecurrente e WHERE e.pedidoRecurrente = :recurrente " +
           "ORDER BY e.fechaEjecucion DESC LIMIT 1")
    EjecucionPedidoRecurrente findUltimaEjecucion(@Param("recurrente") PedidoRecurrente recurrente);

    // Obtener estadísticas de ejecuciones
    @Query("SELECT COUNT(e), SUM(CASE WHEN e.exitoso = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN e.exitoso = false THEN 1 ELSE 0 END) " +
           "FROM EjecucionPedidoRecurrente e WHERE e.pedidoRecurrente = :recurrente")
    Object[] getEstadisticasPorRecurrente(@Param("recurrente") PedidoRecurrente recurrente);
}
