package com.club.management.repository;

import com.club.management.entity.AdjuntoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para AdjuntoPedido
 */
@Repository
public interface AdjuntoPedidoRepository extends JpaRepository<AdjuntoPedido, Long> {

    /**
     * Buscar todos los adjuntos de un pedido
     */
    List<AdjuntoPedido> findByPedidoIdOrderByFechaSubidaDesc(Long pedidoId);

    /**
     * Buscar adjuntos por tipo
     */
    List<AdjuntoPedido> findByPedidoIdAndTipoArchivoOrderByFechaSubidaDesc(
            Long pedidoId,
            AdjuntoPedido.TipoAdjunto tipoArchivo
    );

    /**
     * Buscar adjunto por nombre de archivo único
     */
    Optional<AdjuntoPedido> findByNombreArchivo(String nombreArchivo);

    /**
     * Contar adjuntos de un pedido
     */
    long countByPedidoId(Long pedidoId);

    /**
     * Calcular tamaño total de adjuntos de un pedido
     */
    @Query("SELECT COALESCE(SUM(a.tamanioBytes), 0) FROM AdjuntoPedido a WHERE a.pedido.id = :pedidoId")
    Long calcularTamanioTotalPedido(@Param("pedidoId") Long pedidoId);

    /**
     * Buscar adjuntos subidos por un usuario
     */
    List<AdjuntoPedido> findBySubidoPorIdOrderByFechaSubidaDesc(Long usuarioId);

    /**
     * Verificar si existe un adjunto con un nombre específico
     */
    boolean existsByNombreArchivo(String nombreArchivo);
}
