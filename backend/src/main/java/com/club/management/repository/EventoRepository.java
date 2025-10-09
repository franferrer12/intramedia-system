package com.club.management.repository;

import com.club.management.entity.Evento;
import com.club.management.entity.Evento.EstadoEvento;
import com.club.management.entity.Evento.TipoEvento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Repositorio para Evento
 */
@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    /**
     * Buscar eventos por estado
     */
    List<Evento> findByEstado(EstadoEvento estado);

    /**
     * Buscar eventos por tipo
     */
    List<Evento> findByTipo(TipoEvento tipo);

    /**
     * Buscar eventos entre fechas
     */
    List<Evento> findByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);

    /**
     * Buscar eventos por fecha y estado
     */
    List<Evento> findByFechaBetweenAndEstado(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            EstadoEvento estado
    );

    /**
     * Buscar eventos futuros ordenados por fecha
     */
    @Query("SELECT e FROM Evento e WHERE e.fecha >= :fecha ORDER BY e.fecha ASC")
    List<Evento> findEventosFuturos(@Param("fecha") LocalDate fecha);

    /**
     * Buscar eventos pasados ordenados por fecha descendente
     */
    @Query("SELECT e FROM Evento e WHERE e.fecha < :fecha ORDER BY e.fecha DESC")
    List<Evento> findEventosPasados(@Param("fecha") LocalDate fecha);

    /**
     * Buscar eventos con paginación y filtros
     */
    @Query("SELECT e FROM Evento e WHERE " +
           "(:tipo IS NULL OR e.tipo = :tipo) AND " +
           "(:estado IS NULL OR e.estado = :estado) AND " +
           "(:fechaInicio IS NULL OR e.fecha >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR e.fecha <= :fechaFin)")
    Page<Evento> findWithFilters(
            @Param("tipo") TipoEvento tipo,
            @Param("estado") EstadoEvento estado,
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            Pageable pageable
    );

    /**
     * Calcular ingresos totales por rango de fechas
     */
    @Query("SELECT COALESCE(SUM(e.ingresosReales), 0) FROM Evento e " +
           "WHERE e.fecha BETWEEN :fechaInicio AND :fechaFin")
    BigDecimal calcularIngresosTotales(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Calcular gastos totales por rango de fechas
     */
    @Query("SELECT COALESCE(SUM(e.gastosReales), 0) FROM Evento e " +
           "WHERE e.fecha BETWEEN :fechaInicio AND :fechaFin")
    BigDecimal calcularGastosTotales(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Top eventos más rentables
     */
    @Query("SELECT e FROM Evento e " +
           "WHERE e.estado = 'FINALIZADO' " +
           "ORDER BY (e.ingresosReales - e.gastosReales) DESC")
    List<Evento> findTopEventosRentables(Pageable pageable);

    /**
     * Contar eventos por estado
     */
    long countByEstado(EstadoEvento estado);

    /**
     * Contar eventos por tipo en un rango de fechas
     */
    long countByTipoAndFechaBetween(TipoEvento tipo, LocalDate fechaInicio, LocalDate fechaFin);

    /**
     * Contar eventos entre fechas y con estados específicos
     */
    long countByFechaBetweenAndEstadoIn(LocalDate fechaInicio, LocalDate fechaFin, List<EstadoEvento> estados);

    /**
     * Encontrar los próximos 5 eventos entre fechas y con estados específicos
     */
    List<Evento> findTop5ByFechaBetweenAndEstadoInOrderByFechaAsc(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            List<EstadoEvento> estados
    );

    /**
     * Encontrar los últimos 3 eventos creados después de una fecha
     */
    List<Evento> findTop3ByCreadoEnAfterOrderByCreadoEnDesc(java.time.LocalDateTime creadoEn);
}
