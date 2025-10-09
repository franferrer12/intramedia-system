package com.club.management.repository;

import com.club.management.entity.Nomina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NominaRepository extends JpaRepository<Nomina, Long> {

    // Buscar por empleado
    List<Nomina> findByEmpleadoId(Long empleadoId);

    // Buscar por periodo
    List<Nomina> findByPeriodo(String periodo);

    // Buscar por empleado y periodo
    Optional<Nomina> findByEmpleadoIdAndPeriodo(Long empleadoId, String periodo);

    // Buscar por estado
    List<Nomina> findByEstado(String estado);

    // Buscar por rango de fechas
    List<Nomina> findByFechaPagoBetween(LocalDate fechaInicio, LocalDate fechaFin);

    // Buscar pendientes
    List<Nomina> findByEstadoOrderByFechaPagoAsc(String estado);

    // Buscar por empleado ordenadas por periodo descendente
    List<Nomina> findByEmpleadoIdOrderByPeriodoDesc(Long empleadoId);

    // Obtener periodos únicos
    @Query("SELECT DISTINCT n.periodo FROM Nomina n ORDER BY n.periodo DESC")
    List<String> findAllPeriodos();

    // Contar nóminas por estado
    @Query("SELECT COUNT(n) FROM Nomina n WHERE n.estado = :estado")
    Long countByEstado(@Param("estado") String estado);

    // Calcular total pagado por periodo
    @Query("SELECT COALESCE(SUM(n.salarioNeto), 0) FROM Nomina n WHERE n.periodo = :periodo AND n.estado = 'PAGADA'")
    Double getTotalPagadoPorPeriodo(@Param("periodo") String periodo);

    // Calcular total pendiente por periodo
    @Query("SELECT COALESCE(SUM(n.salarioNeto), 0) FROM Nomina n WHERE n.periodo = :periodo AND n.estado = 'PENDIENTE'")
    Double getTotalPendientePorPeriodo(@Param("periodo") String periodo);

    // Obtener nóminas de empleados activos para un periodo
    @Query("SELECT n FROM Nomina n JOIN n.empleado e WHERE n.periodo = :periodo AND e.activo = true")
    List<Nomina> findByPeriodoAndEmpleadoActivo(@Param("periodo") String periodo);
}
