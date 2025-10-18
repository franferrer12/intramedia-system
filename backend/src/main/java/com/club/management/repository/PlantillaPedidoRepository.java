package com.club.management.repository;

import com.club.management.model.PlantillaPedido;
import com.club.management.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantillaPedidoRepository extends JpaRepository<PlantillaPedido, Long> {

    // Obtener todas las plantillas activas
    List<PlantillaPedido> findByActivaTrue();

    // Obtener plantillas por proveedor
    List<PlantillaPedido> findByProveedor(Proveedor proveedor);

    // Obtener plantillas activas por proveedor
    List<PlantillaPedido> findByProveedorAndActivaTrue(Proveedor proveedor);

    // Obtener plantillas por usuario creador
    @Query("SELECT p FROM PlantillaPedido p WHERE p.creadoPor.id = :usuarioId ORDER BY p.fechaCreacion DESC")
    List<PlantillaPedido> findByUsuarioCreador(@Param("usuarioId") Long usuarioId);

    // Buscar plantillas por nombre
    @Query("SELECT p FROM PlantillaPedido p WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) " +
           "OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :busqueda, '%'))")
    List<PlantillaPedido> buscarPorNombreODescripcion(@Param("busqueda") String busqueda);

    // Buscar plantillas activas por nombre
    @Query("SELECT p FROM PlantillaPedido p WHERE p.activa = true AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) " +
           "OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :busqueda, '%')))")
    List<PlantillaPedido> buscarActivasPorNombreODescripcion(@Param("busqueda") String busqueda);

    // Contar plantillas por proveedor
    long countByProveedor(Proveedor proveedor);

    // Contar plantillas activas
    long countByActivaTrue();

    // Obtener plantillas ordenadas por fecha de creación
    List<PlantillaPedido> findAllByOrderByFechaCreacionDesc();

    // Obtener plantillas activas ordenadas por nombre
    List<PlantillaPedido> findByActivaTrueOrderByNombreAsc();
}
