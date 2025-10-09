package com.club.management.repository;

import com.club.management.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findByCodigo(String codigo);

    List<Producto> findByActivoTrue();

    List<Producto> findByCategoria(String categoria);

    List<Producto> findByProveedorId(Long proveedorId);

    @Query("SELECT DISTINCT p.categoria FROM Producto p ORDER BY p.categoria")
    List<String> findAllCategorias();

    @Query("SELECT p FROM Producto p WHERE p.stockActual < p.stockMinimo AND p.activo = true")
    List<Producto> findProductosBajoStock();

    @Query("SELECT p FROM Producto p WHERE p.stockActual <= 0 AND p.activo = true")
    List<Producto> findProductosSinStock();

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.codigo) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Producto> searchProductos(String searchTerm);
}
