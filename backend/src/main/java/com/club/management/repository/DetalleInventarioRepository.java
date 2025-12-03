package com.club.management.repository;

import com.club.management.entity.DetalleInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleInventarioRepository extends JpaRepository<DetalleInventario, Long> {

    List<DetalleInventario> findByInventarioId(Long inventarioId);

    List<DetalleInventario> findByProductoId(Long productoId);
}
