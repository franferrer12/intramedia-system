package com.club.management.repository;

import com.club.management.entity.InversionInicial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface InversionInicialRepository extends JpaRepository<InversionInicial, Long> {

    List<InversionInicial> findByCategoria(InversionInicial.CategoriaInversion categoria);

    List<InversionInicial> findAllByOrderByFechaDesc();

    @Query("SELECT SUM(i.monto) FROM InversionInicial i")
    BigDecimal calcularInversionTotal();

    @Query("SELECT i.categoria, SUM(i.monto) FROM InversionInicial i GROUP BY i.categoria")
    List<Object[]> calcularInversionPorCategoria();

    @Query("SELECT SUM(i.monto) FROM InversionInicial i WHERE i.categoria = :categoria")
    BigDecimal calcularInversionPorCategoria(InversionInicial.CategoriaInversion categoria);

    @Query("SELECT i FROM InversionInicial i WHERE i.fecha BETWEEN :fechaInicio AND :fechaFin ORDER BY i.fecha DESC")
    List<InversionInicial> findByFechaBetween(@Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);
}
