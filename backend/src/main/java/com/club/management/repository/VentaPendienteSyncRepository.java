package com.club.management.repository;

import com.club.management.entity.VentaPendienteSync;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VentaPendienteSyncRepository extends JpaRepository<VentaPendienteSync, Long> {

    List<VentaPendienteSync> findByDispositivoIdAndSincronizadaFalse(Long dispositivoId);

    List<VentaPendienteSync> findBySincronizadaFalseAndProximoIntentoBefore(LocalDateTime fecha);

    boolean existsByUuidVentaAndSincronizadaTrue(String uuidVenta);

    Optional<VentaPendienteSync> findByUuidVenta(String uuidVenta);

    @Query("SELECT v FROM VentaPendienteSync v WHERE v.dispositivo.id = :dispositivoId ORDER BY v.fechaCreacion DESC")
    List<VentaPendienteSync> findByDispositivoIdOrderByFechaDesc(@Param("dispositivoId") Long dispositivoId);

    @Query("SELECT COUNT(v) FROM VentaPendienteSync v WHERE v.dispositivo.id = :dispositivoId AND v.sincronizada = false")
    Long countPendientesPorDispositivo(@Param("dispositivoId") Long dispositivoId);

    @Query("SELECT v FROM VentaPendienteSync v WHERE v.sincronizada = false AND v.intentosSincronizacion < 10 ORDER BY v.proximoIntento ASC")
    List<VentaPendienteSync> findPendientesParaReintentar();
}
