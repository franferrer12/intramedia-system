package com.club.management.repository;

import com.club.management.entity.EventoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventoProductoRepository extends JpaRepository<EventoProducto, Long> {

    List<EventoProducto> findByEventoId(Long eventoId);

    List<EventoProducto> findByEventoIdAndMovimientoGeneradoFalse(Long eventoId);

    List<EventoProducto> findByProductoId(Long productoId);
}
