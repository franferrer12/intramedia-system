package com.club.management.repository;

import com.club.management.model.ConfiguracionSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracionSistemaRepository extends JpaRepository<ConfiguracionSistema, Long> {

    // Find by key (unique)
    Optional<ConfiguracionSistema> findByClave(String clave);

    // Find by category
    List<ConfiguracionSistema> findByCategoria(String categoria);

    // Find by category ordered by key
    @Query("SELECT c FROM ConfiguracionSistema c WHERE c.categoria = :categoria ORDER BY c.clave")
    List<ConfiguracionSistema> findByCategoriaOrdered(@Param("categoria") String categoria);

    // Get all distinct categories
    @Query("SELECT DISTINCT c.categoria FROM ConfiguracionSistema c ORDER BY c.categoria")
    List<String> findDistinctCategorias();

    // Check if key exists
    boolean existsByClave(String clave);

    // Find by type
    List<ConfiguracionSistema> findByTipo(ConfiguracionSistema.TipoValor tipo);

    // Search by key or description
    @Query("SELECT c FROM ConfiguracionSistema c WHERE " +
            "LOWER(c.clave) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
            "LOWER(c.descripcion) LIKE LOWER(CONCAT('%', :busqueda, '%'))")
    List<ConfiguracionSistema> buscar(@Param("busqueda") String busqueda);
}
