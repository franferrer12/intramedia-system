package com.club.management.repository;

import com.club.management.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {

    List<Empleado> findByActivoTrue();

    List<Empleado> findByActivoFalse();

    List<Empleado> findByCargo(String cargo);

    List<Empleado> findByDepartamento(String departamento);

    List<Empleado> findByCargoAndActivoTrue(String cargo);

    List<Empleado> findByDepartamentoAndActivoTrue(String departamento);

    Optional<Empleado> findByDni(String dni);

    @Query("SELECT DISTINCT e.cargo FROM Empleado e ORDER BY e.cargo")
    List<String> findAllCargos();

    @Query("SELECT DISTINCT e.departamento FROM Empleado e WHERE e.departamento IS NOT NULL ORDER BY e.departamento")
    List<String> findAllDepartamentos();

    @Query("SELECT e FROM Empleado e WHERE " +
            "LOWER(e.nombre) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.dni) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.cargo) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Empleado> searchEmpleados(@Param("searchTerm") String searchTerm);

    @Query("SELECT COUNT(e) FROM Empleado e WHERE e.activo = true")
    Long countActivos();
}
