package com.club.management.repository;

import com.club.management.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    // Find by level
    Page<SystemLog> findByNivel(SystemLog.Nivel nivel, Pageable pageable);

    // Find by module
    Page<SystemLog> findByModulo(String modulo, Pageable pageable);

    // Find by level and module
    Page<SystemLog> findByNivelAndModulo(SystemLog.Nivel nivel, String modulo, Pageable pageable);

    // Find by date range
    @Query("SELECT sl FROM SystemLog sl WHERE sl.fechaHora BETWEEN :fechaInicio AND :fechaFin ORDER BY sl.fechaHora DESC")
    Page<SystemLog> findByFechaRange(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable
    );

    // Advanced search with multiple filters
    @Query("SELECT sl FROM SystemLog sl WHERE " +
            "(:nivel IS NULL OR sl.nivel = :nivel) AND " +
            "(:modulo IS NULL OR sl.modulo = :modulo) AND " +
            "(:usuarioId IS NULL OR sl.usuario.id = :usuarioId) AND " +
            "(:fechaInicio IS NULL OR sl.fechaHora >= :fechaInicio) AND " +
            "(:fechaFin IS NULL OR sl.fechaHora <= :fechaFin) " +
            "ORDER BY sl.fechaHora DESC")
    Page<SystemLog> buscarConFiltros(
            @Param("nivel") SystemLog.Nivel nivel,
            @Param("modulo") String modulo,
            @Param("usuarioId") Long usuarioId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable
    );

    // Count by level
    long countByNivel(SystemLog.Nivel nivel);

    // Count errors in last N hours
    @Query("SELECT COUNT(sl) FROM SystemLog sl WHERE sl.nivel = 'ERROR' AND sl.fechaHora >= :fecha")
    long countErrorsSince(@Param("fecha") LocalDateTime fecha);

    // Get distinct modules
    @Query("SELECT DISTINCT sl.modulo FROM SystemLog sl ORDER BY sl.modulo")
    List<String> findDistinctModulos();

    // Recent logs for dashboard
    @Query("SELECT sl FROM SystemLog sl ORDER BY sl.fechaHora DESC")
    Page<SystemLog> findRecent(Pageable pageable);

    // Find by user
    @Query("SELECT sl FROM SystemLog sl WHERE sl.usuario.id = :usuarioId ORDER BY sl.fechaHora DESC")
    Page<SystemLog> findByUsuarioId(@Param("usuarioId") Long usuarioId, Pageable pageable);

    // Delete old logs (for cleanup jobs)
    @Query("DELETE FROM SystemLog sl WHERE sl.fechaHora < :fecha")
    void deleteOlderThan(@Param("fecha") LocalDateTime fecha);
}
