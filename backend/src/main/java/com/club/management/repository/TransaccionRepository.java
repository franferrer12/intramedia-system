package com.club.management.repository;

import com.club.management.entity.Transaccion;
import com.club.management.entity.Transaccion.TipoTransaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    List<Transaccion> findByTipo(TipoTransaccion tipo);

    List<Transaccion> findByEventoId(Long eventoId);

    List<Transaccion> findByCategoriaId(Long categoriaId);

    List<Transaccion> findByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);

    List<Transaccion> findByTipoAndFechaBetween(TipoTransaccion tipo, LocalDate fechaInicio, LocalDate fechaFin);

    @Query("SELECT SUM(t.monto) FROM Transaccion t WHERE t.tipo = :tipo AND t.fecha BETWEEN :fechaInicio AND :fechaFin")
    BigDecimal sumByTipoAndFechaBetween(@Param("tipo") TipoTransaccion tipo,
                                         @Param("fechaInicio") LocalDate fechaInicio,
                                         @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT SUM(t.monto) FROM Transaccion t WHERE t.evento.id = :eventoId AND t.tipo = :tipo")
    BigDecimal sumByEventoIdAndTipo(@Param("eventoId") Long eventoId, @Param("tipo") TipoTransaccion tipo);
}
