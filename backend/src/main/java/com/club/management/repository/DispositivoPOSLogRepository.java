package com.club.management.repository;

import com.club.management.entity.DispositivoPOSLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DispositivoPOSLogRepository extends JpaRepository<DispositivoPOSLog, Long> {

    List<DispositivoPOSLog> findByDispositivoIdOrderByFechaDesc(Long dispositivoId);

    @Query("SELECT l FROM DispositivoPOSLog l WHERE l.dispositivo.id = :dispositivoId ORDER BY l.fecha DESC LIMIT :limit")
    List<DispositivoPOSLog> findTopNByDispositivoId(@Param("dispositivoId") Long dispositivoId, @Param("limit") int limit);

    List<DispositivoPOSLog> findByDispositivoIdAndTipoEvento(Long dispositivoId, DispositivoPOSLog.TipoEvento tipoEvento);

    @Query("SELECT l FROM DispositivoPOSLog l WHERE l.dispositivo.id = :dispositivoId AND l.fecha BETWEEN :fechaInicio AND :fechaFin ORDER BY l.fecha DESC")
    List<DispositivoPOSLog> findByDispositivoIdAndFechaBetween(
            @Param("dispositivoId") Long dispositivoId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );

    @Query("SELECT COUNT(l) FROM DispositivoPOSLog l WHERE l.dispositivo.id = :dispositivoId AND l.tipoEvento = :tipoEvento AND l.fecha >= :fechaDesde")
    Long countByDispositivoAndTipoEventoSince(
            @Param("dispositivoId") Long dispositivoId,
            @Param("tipoEvento") DispositivoPOSLog.TipoEvento tipoEvento,
            @Param("fechaDesde") LocalDateTime fechaDesde
    );
}
