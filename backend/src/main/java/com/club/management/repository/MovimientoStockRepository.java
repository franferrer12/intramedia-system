package com.club.management.repository;

import com.club.management.entity.MovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {

    List<MovimientoStock> findByProductoIdOrderByFechaMovimientoDesc(Long productoId);

    List<MovimientoStock> findByEventoId(Long eventoId);

    List<MovimientoStock> findByTipoMovimiento(String tipoMovimiento);

    @Query("SELECT m FROM MovimientoStock m WHERE m.fechaMovimiento BETWEEN :desde AND :hasta ORDER BY m.fechaMovimiento DESC")
    List<MovimientoStock> findByFechaBetween(LocalDateTime desde, LocalDateTime hasta);

    @Query("SELECT m FROM MovimientoStock m WHERE m.fechaMovimiento BETWEEN :desde AND :hasta ORDER BY m.fechaMovimiento DESC")
    List<MovimientoStock> findByFechaMovimientoBetween(LocalDateTime desde, LocalDateTime hasta);

    @Query("SELECT m FROM MovimientoStock m WHERE m.producto.id = :productoId AND m.fechaMovimiento BETWEEN :desde AND :hasta ORDER BY m.fechaMovimiento DESC")
    List<MovimientoStock> findByProductoAndFechaBetween(Long productoId, LocalDateTime desde, LocalDateTime hasta);

    Long countByFechaMovimientoAfter(LocalDateTime fecha);

    List<MovimientoStock> findByFechaMovimientoAfterOrderByFechaMovimientoDesc(LocalDateTime fecha);
}
