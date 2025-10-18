package com.club.management.repository;

import com.club.management.entity.PedidoAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio para PedidoAuditoria
 */
@Repository
public interface PedidoAuditoriaRepository extends JpaRepository<PedidoAuditoria, Long> {

    /**
     * Buscar todos los registros de auditoría de un pedido ordenados por fecha descendente
     */
    List<PedidoAuditoria> findByPedidoIdOrderByFechaCambioDesc(Long pedidoId);

    /**
     * Buscar registros de auditoría por acción
     */
    List<PedidoAuditoria> findByAccion(String accion);

    /**
     * Buscar registros de auditoría por usuario
     */
    List<PedidoAuditoria> findByUsuarioIdOrderByFechaCambioDesc(Long usuarioId);

    /**
     * Buscar registros de auditoría en un rango de fechas
     */
    List<PedidoAuditoria> findByFechaCambioBetweenOrderByFechaCambioDesc(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin
    );

    /**
     * Buscar registros de auditoría por pedido y acción
     */
    List<PedidoAuditoria> findByPedidoIdAndAccionOrderByFechaCambioDesc(Long pedidoId, String accion);

    /**
     * Buscar registros de cambios de estado de un pedido
     */
    @Query("SELECT a FROM PedidoAuditoria a WHERE a.pedido.id = :pedidoId AND a.accion = 'CAMBIO_ESTADO' ORDER BY a.fechaCambio DESC")
    List<PedidoAuditoria> findCambiosEstadoPorPedido(@Param("pedidoId") Long pedidoId);

    /**
     * Contar registros de auditoría por pedido
     */
    long countByPedidoId(Long pedidoId);

    /**
     * Obtener últimos N cambios de un pedido
     */
    @Query("SELECT a FROM PedidoAuditoria a WHERE a.pedido.id = :pedidoId ORDER BY a.fechaCambio DESC")
    List<PedidoAuditoria> findTopNByPedidoId(@Param("pedidoId") Long pedidoId, @Param("limit") int limit);

    /**
     * Buscar actividad reciente de auditoría (últimos 50 registros)
     */
    List<PedidoAuditoria> findTop50ByOrderByFechaCambioDesc();
}
