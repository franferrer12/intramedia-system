package com.club.management.repository;

import com.club.management.entity.Proveedor;
import com.club.management.entity.Proveedor.TipoProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para Proveedor
 */
@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    /**
     * Buscar proveedores activos
     */
    List<Proveedor> findByActivoTrue();

    /**
     * Buscar proveedores por tipo
     */
    List<Proveedor> findByTipo(TipoProveedor tipo);

    /**
     * Buscar proveedores activos por tipo
     */
    List<Proveedor> findByTipoAndActivoTrue(TipoProveedor tipo);

    /**
     * Contar proveedores activos
     */
    long countByActivoTrue();
}
