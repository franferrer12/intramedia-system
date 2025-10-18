package com.club.management.repository;

import com.club.management.entity.PedidoRecurrente;
import com.club.management.entity.PlantillaPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRecurrenteRepository extends JpaRepository<PedidoRecurrente, Long> {

    // Obtener todos los pedidos recurrentes activos
    List<PedidoRecurrente> findByActivoTrue();

    // Obtener pedidos recurrentes por plantilla
    List<PedidoRecurrente> findByPlantilla(PlantillaPedido plantilla);

    // Obtener pedidos recurrentes activos por plantilla
    List<PedidoRecurrente> findByPlantillaAndActivoTrue(PlantillaPedido plantilla);

    // Obtener pedidos recurrentes que deben ejecutarse
    @Query("SELECT pr FROM PedidoRecurrente pr WHERE pr.activo = true " +
           "AND pr.proximaEjecucion <= :ahora ORDER BY pr.proximaEjecucion ASC")
    List<PedidoRecurrente> findPendientesDeEjecucion(@Param("ahora") LocalDateTime ahora);

    // Obtener pedidos recurrentes que deben notificarse pronto
    @Query("SELECT pr FROM PedidoRecurrente pr WHERE pr.activo = true " +
           "AND pr.notificarAntesHoras IS NOT NULL " +
           "AND pr.proximaEjecucion BETWEEN :desde AND :hasta")
    List<PedidoRecurrente> findParaNotificar(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    // Obtener pedidos recurrentes por frecuencia
    List<PedidoRecurrente> findByFrecuencia(PedidoRecurrente.Frecuencia frecuencia);

    // Obtener pedidos recurrentes activos por frecuencia
    List<PedidoRecurrente> findByFrecuenciaAndActivoTrue(PedidoRecurrente.Frecuencia frecuencia);

    // Obtener pedidos recurrentes por usuario creador
    @Query("SELECT pr FROM PedidoRecurrente pr WHERE pr.creadoPor.id = :usuarioId " +
           "ORDER BY pr.fechaCreacion DESC")
    List<PedidoRecurrente> findByUsuarioCreador(@Param("usuarioId") Long usuarioId);

    // Contar pedidos recurrentes activos
    long countByActivoTrue();

    // Contar pedidos recurrentes por plantilla
    long countByPlantilla(PlantillaPedido plantilla);

    // Obtener próximas ejecuciones (próximos N días)
    @Query("SELECT pr FROM PedidoRecurrente pr WHERE pr.activo = true " +
           "AND pr.proximaEjecucion BETWEEN :desde AND :hasta " +
           "ORDER BY pr.proximaEjecucion ASC")
    List<PedidoRecurrente> findProximasEjecuciones(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );
}
