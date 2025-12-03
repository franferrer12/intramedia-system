package com.club.management.repository;

import com.club.management.entity.SesionVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SesionVentaRepository extends JpaRepository<SesionVenta, Long> {

    List<SesionVenta> findByEstadoOrderByFechaAperturaDesc(SesionVenta.EstadoSesion estado);

    List<SesionVenta> findAllByOrderByFechaAperturaDesc();

    Optional<SesionVenta> findByCodigo(String codigo);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(s.codigo, 4) AS integer)), 0) FROM SesionVenta s WHERE s.codigo LIKE 'SV-%'")
    Integer findMaxCodigoNumber();

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    @Query("SELECT s FROM SesionVenta s LEFT JOIN FETCH s.empleado WHERE s.id = :id")
    Optional<SesionVenta> findByIdWithEmpleado(Long id);
}
