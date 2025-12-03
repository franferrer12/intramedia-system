package com.club.management.repository;

import com.club.management.entity.ConsumoSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsumoSesionRepository extends JpaRepository<ConsumoSesion, Long> {

    @Query("SELECT c FROM ConsumoSesion c LEFT JOIN FETCH c.producto WHERE c.sesion.id = :sesionId ORDER BY c.fechaRegistro DESC")
    List<ConsumoSesion> findBySesionIdOrderByFechaRegistroDesc(Long sesionId);

    @Query("SELECT COUNT(c) FROM ConsumoSesion c WHERE c.sesion.id = :sesionId")
    Long countBySesionId(Long sesionId);

    void deleteBySesionId(Long sesionId);
}
