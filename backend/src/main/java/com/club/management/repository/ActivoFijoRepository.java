package com.club.management.repository;

import com.club.management.entity.ActivoFijo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivoFijoRepository extends JpaRepository<ActivoFijo, Long> {

    List<ActivoFijo> findByActivoTrue();

    List<ActivoFijo> findByCategoria(ActivoFijo.CategoriaActivoFijo categoria);

    List<ActivoFijo> findByActivoTrueOrderByFechaAdquisicionDesc();

    List<ActivoFijo> findAllByOrderByFechaAdquisicionDesc();

    @Query("SELECT SUM(a.valorNeto) FROM ActivoFijo a WHERE a.activo = true")
    java.math.BigDecimal calcularValorNetoTotal();

    @Query("SELECT SUM(a.valorInicial) FROM ActivoFijo a WHERE a.activo = true")
    java.math.BigDecimal calcularValorInicialTotal();

    @Query("SELECT SUM(a.amortizacionAcumulada) FROM ActivoFijo a WHERE a.activo = true")
    java.math.BigDecimal calcularAmortizacionAcumuladaTotal();
}
