package com.club.management.repository;

import com.club.management.entity.JornadaTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JornadaTrabajoRepository extends JpaRepository<JornadaTrabajo, Long> {

    // Buscar por empleado
    List<JornadaTrabajo> findByEmpleadoId(Long empleadoId);

    // Buscar por empleado ordenadas por fecha descendente
    List<JornadaTrabajo> findByEmpleadoIdOrderByFechaDesc(Long empleadoId);

    // Buscar por fecha
    List<JornadaTrabajo> findByFecha(LocalDate fecha);

    // Buscar por rango de fechas
    List<JornadaTrabajo> findByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);

    // Buscar por empleado y rango de fechas
    List<JornadaTrabajo> findByEmpleadoIdAndFechaBetween(Long empleadoId, LocalDate fechaInicio, LocalDate fechaFin);

    // Buscar por estado de pago
    List<JornadaTrabajo> findByPagado(Boolean pagado);

    // Buscar jornadas pagadas
    List<JornadaTrabajo> findByPagadoTrue();

    // Buscar jornadas pendientes de pago
    List<JornadaTrabajo> findByPagadoFalse();

    // Buscar jornadas pendientes por empleado
    List<JornadaTrabajo> findByEmpleadoIdAndPagadoFalse(Long empleadoId);

    // Buscar jornadas pagadas por empleado
    List<JornadaTrabajo> findByEmpleadoIdAndPagadoTrue(Long empleadoId);

    // Buscar por evento
    List<JornadaTrabajo> findByEventoId(Long eventoId);

    // Buscar jornadas pendientes de pago ordenadas por fecha
    List<JornadaTrabajo> findByPagadoFalseOrderByFechaAsc();

    // Buscar jornadas pendientes de pago ordenadas por empleado y fecha
    @Query("SELECT j FROM JornadaTrabajo j WHERE j.pagado = false ORDER BY j.empleado.nombre, j.fecha ASC")
    List<JornadaTrabajo> findPendientesPorEmpleadoYFecha();

    // Calcular total pendiente de pago por empleado
    @Query("SELECT COALESCE(SUM(j.totalPago), 0) FROM JornadaTrabajo j WHERE j.empleado.id = :empleadoId AND j.pagado = false")
    Double calcularTotalPendientePorEmpleado(@Param("empleadoId") Long empleadoId);

    // Calcular total pagado por empleado en un rango de fechas
    @Query("SELECT COALESCE(SUM(j.totalPago), 0) FROM JornadaTrabajo j WHERE j.empleado.id = :empleadoId AND j.pagado = true AND j.fecha BETWEEN :fechaInicio AND :fechaFin")
    Double calcularTotalPagadoPorEmpleado(@Param("empleadoId") Long empleadoId, @Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);

    // Calcular total de horas trabajadas por empleado en un rango de fechas
    @Query("SELECT COALESCE(SUM(j.horasTrabajadas), 0) FROM JornadaTrabajo j WHERE j.empleado.id = :empleadoId AND j.fecha BETWEEN :fechaInicio AND :fechaFin")
    Double calcularTotalHorasPorEmpleado(@Param("empleadoId") Long empleadoId, @Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);

    // Contar jornadas pendientes de pago
    @Query("SELECT COUNT(j) FROM JornadaTrabajo j WHERE j.pagado = false")
    Long countPendientes();

    // Calcular total general pendiente de pago
    @Query("SELECT COALESCE(SUM(j.totalPago), 0) FROM JornadaTrabajo j WHERE j.pagado = false")
    Double calcularTotalPendienteGeneral();

    // Obtener jornadas por mes (formato YYYY-MM)
    @Query("SELECT j FROM JornadaTrabajo j WHERE FUNCTION('TO_CHAR', j.fecha, 'YYYY-MM') = :periodo ORDER BY j.fecha DESC")
    List<JornadaTrabajo> findByPeriodo(@Param("periodo") String periodo);

    // Obtener jornadas por empleado y mes
    @Query("SELECT j FROM JornadaTrabajo j WHERE j.empleado.id = :empleadoId AND FUNCTION('TO_CHAR', j.fecha, 'YYYY-MM') = :periodo ORDER BY j.fecha DESC")
    List<JornadaTrabajo> findByEmpleadoIdAndPeriodo(@Param("empleadoId") Long empleadoId, @Param("periodo") String periodo);
}
