package com.club.management.repository;

import com.club.management.entity.DetallePedido;
import com.club.management.entity.Pedido;
import com.club.management.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Long> {

    /**
     * Buscar detalles por pedido
     */
    List<DetallePedido> findByPedidoOrderByProductoNombre(Pedido pedido);

    /**
     * Buscar detalle específico de producto en pedido
     */
    Optional<DetallePedido> findByPedidoAndProducto(Pedido pedido, Producto producto);

    /**
     * Obtener productos más pedidos (para reportes)
     */
    @Query("SELECT d.producto, SUM(d.cantidadPedida) as total FROM DetallePedido d " +
           "GROUP BY d.producto ORDER BY total DESC")
    List<Object[]> findProductosMasPedidos();

    /**
     * Obtener cantidad total pedida de un producto
     */
    @Query("SELECT SUM(d.cantidadPedida) FROM DetallePedido d WHERE d.producto.id = :productoId")
    java.math.BigDecimal sumCantidadPedidaByProducto(@Param("productoId") Long productoId);

    /**
     * Obtener cantidad total recibida de un producto
     */
    @Query("SELECT SUM(d.cantidadRecibida) FROM DetallePedido d WHERE d.producto.id = :productoId")
    java.math.BigDecimal sumCantidadRecibidaByProducto(@Param("productoId") Long productoId);
}
