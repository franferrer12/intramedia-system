package com.club.management.repository;

import com.club.management.entity.SesionCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de sesiones de caja
 */
@Repository
public interface SesionCajaRepository extends JpaRepository<SesionCaja, Long> {

    /**
     * Busca si existe alguna sesión abierta para una caja específica
     */
    @Query("SELECT s FROM SesionCaja s WHERE s.nombreCaja = :nombreCaja AND s.estado = 'ABIERTA'")
    Optional<SesionCaja> findSesionAbiertaPorNombreCaja(@Param("nombreCaja") String nombreCaja);

    /**
     * Obtiene todas las sesiones abiertas actualmente
     */
    @Query("SELECT s FROM SesionCaja s WHERE s.estado = 'ABIERTA' ORDER BY s.fechaApertura DESC")
    List<SesionCaja> findAllSesionesAbiertas();

    /**
     * Obtiene sesiones cerradas en un rango de fechas
     */
    @Query("SELECT s FROM SesionCaja s WHERE s.estado = 'CERRADA' " +
           "AND s.fechaCierre >= :fechaInicio AND s.fechaCierre <= :fechaFin " +
           "ORDER BY s.fechaCierre DESC")
    List<SesionCaja> findSesionesCerradasEntreFechas(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtiene todas las sesiones de una caja específica
     */
    @Query("SELECT s FROM SesionCaja s WHERE s.nombreCaja = :nombreCaja ORDER BY s.fechaApertura DESC")
    List<SesionCaja> findAllByNombreCaja(@Param("nombreCaja") String nombreCaja);

    /**
     * Obtiene sesiones de un empleado específico
     */
    @Query("SELECT s FROM SesionCaja s WHERE s.empleadoApertura.id = :empleadoId " +
           "ORDER BY s.fechaApertura DESC")
    List<SesionCaja> findAllByEmpleadoId(@Param("empleadoId") Long empleadoId);

    /**
     * Verifica si existe alguna sesión abierta
     */
    @Query("SELECT COUNT(s) > 0 FROM SesionCaja s WHERE s.estado = 'ABIERTA'")
    boolean existenSesionesAbiertas();

    /**
     * Cuenta sesiones abiertas para una caja específica
     */
    @Query("SELECT COUNT(s) FROM SesionCaja s WHERE s.nombreCaja = :nombreCaja AND s.estado = 'ABIERTA'")
    long countSesionesAbiertasPorCaja(@Param("nombreCaja") String nombreCaja);

    /**
     * Obtiene sesiones con diferencia de dinero (faltante o sobrante)
     */
    @Query("SELECT s FROM SesionCaja s WHERE s.estado = 'CERRADA' " +
           "AND s.diferencia IS NOT NULL AND s.diferencia <> 0 " +
           "ORDER BY ABS(s.diferencia) DESC")
    List<SesionCaja> findSesionesConDiferencia();
}
