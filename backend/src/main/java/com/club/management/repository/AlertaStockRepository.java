package com.club.management.repository;

import com.club.management.entity.AlertaStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertaStockRepository extends JpaRepository<AlertaStock, Long> {

    List<AlertaStock> findByActivaTrueOrderByFechaAlertaDesc();

    List<AlertaStock> findByProductoIdAndActivaTrueOrderByFechaAlertaDesc(Long productoId);

    List<AlertaStock> findByLeidaFalseAndActivaTrueOrderByFechaAlertaDesc();

    Long countByLeidaFalseAndActivaTrue();
}
