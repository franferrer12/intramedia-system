package com.club.management.repository;

import com.club.management.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    List<Inventario> findByEstadoOrderByFechaInventarioDesc(String estado);

    List<Inventario> findByFechaInventarioBetweenOrderByFechaInventarioDesc(LocalDate desde, LocalDate hasta);

    List<Inventario> findByUsuarioResponsableIdOrderByFechaInventarioDesc(Long usuarioId);
}
