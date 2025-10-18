package com.club.management.repository;

import com.club.management.entity.CategoriaTransaccion;
import com.club.management.entity.CategoriaTransaccion.TipoTransaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaTransaccionRepository extends JpaRepository<CategoriaTransaccion, Long> {

    List<CategoriaTransaccion> findByActivaTrue();

    List<CategoriaTransaccion> findByTipo(TipoTransaccion tipo);

    List<CategoriaTransaccion> findByTipoAndActivaTrue(TipoTransaccion tipo);

    CategoriaTransaccion findByNombreAndTipo(String nombre, TipoTransaccion tipo);
}
