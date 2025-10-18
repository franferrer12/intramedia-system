package com.club.management.repository;

import com.club.management.entity.EstadoPedido;
import com.club.management.entity.Pedido;
import com.club.management.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    /**
     * Buscar pedido por número
     */
    Optional<Pedido> findByNumeroPedido(String numeroPedido);

    /**
     * Buscar pedidos por proveedor
     */
    List<Pedido> findByProveedorOrderByFechaPedidoDesc(Proveedor proveedor);

    /**
     * Buscar pedidos por estado
     */
    List<Pedido> findByEstadoOrderByFechaPedidoDesc(EstadoPedido estado);

    /**
     * Buscar pedidos por proveedor y estado
     */
    List<Pedido> findByProveedorAndEstadoOrderByFechaPedidoDesc(Proveedor proveedor, EstadoPedido estado);

    /**
     * Buscar pedidos por rango de fechas
     */
    @Query("SELECT p FROM Pedido p WHERE p.fechaPedido BETWEEN :fechaInicio AND :fechaFin ORDER BY p.fechaPedido DESC")
    List<Pedido> findByFechaPedidoBetween(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Buscar pedidos pendientes de recepción
     */
    @Query("SELECT p FROM Pedido p WHERE p.estado IN ('ENVIADO', 'CONFIRMADO', 'EN_TRANSITO', 'PARCIAL') ORDER BY p.fechaEsperada")
    List<Pedido> findPedidosPendientesRecepcion();

    /**
     * Buscar pedidos por usuario que los creó
     */
    @Query("SELECT p FROM Pedido p WHERE p.usuario.id = :usuarioId ORDER BY p.fechaPedido DESC")
    List<Pedido> findByUsuarioId(@Param("usuarioId") Long usuarioId);

    /**
     * Contar pedidos por estado
     */
    Long countByEstado(EstadoPedido estado);

    /**
     * Obtener últimos N pedidos
     */
    List<Pedido> findTop10ByOrderByFechaPedidoDesc();

    /**
     * Buscar pedidos con total mayor a un monto
     */
    @Query("SELECT p FROM Pedido p WHERE p.total >= :montoMinimo ORDER BY p.total DESC")
    List<Pedido> findByTotalGreaterThanEqual(@Param("montoMinimo") java.math.BigDecimal montoMinimo);

    /**
     * Obtener pedidos recibidos en un rango de fechas (para reportes)
     */
    @Query("SELECT p FROM Pedido p WHERE p.estado = 'RECIBIDO' AND p.fechaRecepcion BETWEEN :fechaInicio AND :fechaFin ORDER BY p.fechaRecepcion DESC")
    List<Pedido> findPedidosRecibidosBetween(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );
}
