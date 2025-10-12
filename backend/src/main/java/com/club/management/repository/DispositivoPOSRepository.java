package com.club.management.repository;

import com.club.management.entity.DispositivoPOS;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DispositivoPOSRepository extends JpaRepository<DispositivoPOS, Long> {

    Optional<DispositivoPOS> findByUuid(String uuid);

    List<DispositivoPOS> findByActivoTrue();

    List<DispositivoPOS> findByTipo(DispositivoPOS.TipoDispositivo tipo);

    List<DispositivoPOS> findByActivoTrueAndTipo(DispositivoPOS.TipoDispositivo tipo);

    @Query("SELECT d FROM DispositivoPOS d WHERE d.empleadoAsignado.id = :empleadoId AND d.activo = true")
    List<DispositivoPOS> findByEmpleadoAsignado(@Param("empleadoId") Long empleadoId);

    @Query("SELECT d FROM DispositivoPOS d WHERE d.ultimaConexion < :fechaLimite AND d.activo = true")
    List<DispositivoPOS> findInactivosPorTiempo(@Param("fechaLimite") LocalDateTime fechaLimite);

    @Query("SELECT COUNT(d) FROM DispositivoPOS d WHERE d.activo = true")
    Long countActivos();

    @Query("SELECT COUNT(d) FROM DispositivoPOS d WHERE d.activo = true AND d.ultimaConexion >= :fechaLimite")
    Long countConexionesRecientes(@Param("fechaLimite") LocalDateTime fechaLimite);

    boolean existsByUuid(String uuid);

    boolean existsByNombre(String nombre);
}
