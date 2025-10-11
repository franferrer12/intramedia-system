package com.club.management.repository;

import com.club.management.entity.BotellaAbierta;
import com.club.management.entity.BotellaAbierta.EstadoBotella;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BotellaAbiertaRepository extends JpaRepository<BotellaAbierta, Long> {

    /**
     * Buscar todas las botellas con un estado específico
     */
    List<BotellaAbierta> findByEstado(EstadoBotella estado);

    /**
     * Buscar botellas abiertas (estado = ABIERTA)
     */
    List<BotellaAbierta> findByEstadoOrderByFechaAperturaAsc(EstadoBotella estado);

    /**
     * Buscar botellas abiertas de un producto específico
     */
    List<BotellaAbierta> findByProductoIdAndEstado(Long productoId, EstadoBotella estado);

    /**
     * Buscar botellas abiertas en una ubicación específica
     */
    List<BotellaAbierta> findByUbicacionAndEstado(String ubicacion, EstadoBotella estado);

    /**
     * Buscar botellas de una sesión de caja
     */
    List<BotellaAbierta> findBySesionCajaId(Long sesionCajaId);

    /**
     * Buscar botellas casi vacías (estado ABIERTA y copas restantes <= límite)
     */
    @Query("SELECT b FROM BotellaAbierta b WHERE b.estado = 'ABIERTA' AND b.copasRestantes <= :limite ORDER BY b.copasRestantes ASC")
    List<BotellaAbierta> findBotellasCasiVacias(@Param("limite") Integer limite);

    /**
     * Buscar botellas vacías pendientes de cierre
     */
    @Query("SELECT b FROM BotellaAbierta b WHERE b.estado = 'ABIERTA' AND b.copasRestantes = 0")
    List<BotellaAbierta> findBotellasVacias();

    /**
     * Buscar botellas abiertas hace más de X horas
     */
    @Query("SELECT b FROM BotellaAbierta b WHERE b.estado = 'ABIERTA' AND b.fechaApertura < :fechaLimite")
    List<BotellaAbierta> findBotellasAbiertasAntesDe(@Param("fechaLimite") LocalDateTime fechaLimite);

    /**
     * Calcular total de copas disponibles de un producto (suma de copas_restantes)
     */
    @Query("SELECT COALESCE(SUM(b.copasRestantes), 0) FROM BotellaAbierta b WHERE b.producto.id = :productoId AND b.estado = 'ABIERTA'")
    Integer calcularCopasDisponibles(@Param("productoId") Long productoId);

    /**
     * Contar botellas abiertas de un producto
     */
    @Query("SELECT COUNT(b) FROM BotellaAbierta b WHERE b.producto.id = :productoId AND b.estado = 'ABIERTA'")
    Long contarBotellasAbiertas(@Param("productoId") Long productoId);

    /**
     * Obtener resumen de botellas abiertas por ubicación
     */
    @Query("SELECT b.ubicacion, COUNT(b), SUM(b.copasRestantes) FROM BotellaAbierta b WHERE b.estado = 'ABIERTA' GROUP BY b.ubicacion")
    List<Object[]> resumenPorUbicacion();

    /**
     * Obtener botellas abiertas con información completa (JOIN FETCH para evitar N+1)
     */
    @Query("SELECT b FROM BotellaAbierta b " +
           "LEFT JOIN FETCH b.producto " +
           "LEFT JOIN FETCH b.abiertaPor " +
           "WHERE b.estado = :estado " +
           "ORDER BY b.fechaApertura DESC")
    List<BotellaAbierta> findByEstadoWithDetails(@Param("estado") EstadoBotella estado);

    /**
     * Buscar botellas por rango de fechas
     */
    @Query("SELECT b FROM BotellaAbierta b WHERE b.fechaApertura BETWEEN :fechaInicio AND :fechaFin ORDER BY b.fechaApertura DESC")
    List<BotellaAbierta> findByFechaAperturaBetween(@Param("fechaInicio") LocalDateTime fechaInicio,
                                                     @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Obtener estadísticas de consumo por producto
     */
    @Query("SELECT p.id, p.nombre, COUNT(b), SUM(b.copasServidas), SUM(b.copasRestantes) " +
           "FROM BotellaAbierta b " +
           "JOIN b.producto p " +
           "WHERE b.estado = 'ABIERTA' " +
           "GROUP BY p.id, p.nombre " +
           "ORDER BY SUM(b.copasRestantes) ASC")
    List<Object[]> estadisticasConsumoPorProducto();

    /**
     * Buscar botellas con alertas (casi vacías o abiertas más de 24h)
     */
    @Query("SELECT b FROM BotellaAbierta b " +
           "WHERE b.estado = 'ABIERTA' " +
           "AND (b.copasRestantes <= 3 OR b.fechaApertura < :hace24Horas) " +
           "ORDER BY b.copasRestantes ASC, b.fechaApertura ASC")
    List<BotellaAbierta> findBotellasConAlertas(@Param("hace24Horas") LocalDateTime hace24Horas);
}
