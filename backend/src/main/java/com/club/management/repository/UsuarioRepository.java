package com.club.management.repository;

import com.club.management.entity.Usuario;
import com.club.management.entity.Usuario.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para Usuario
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Buscar usuario por username
     */
    Optional<Usuario> findByUsername(String username);

    /**
     * Buscar usuario por email
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Verificar si existe un usuario con el username dado
     */
    boolean existsByUsername(String username);

    /**
     * Verificar si existe un usuario con el email dado
     */
    boolean existsByEmail(String email);

    /**
     * Buscar todos los usuarios activos
     */
    List<Usuario> findByActivoTrue();

    /**
     * Buscar usuarios por rol
     */
    List<Usuario> findByRol(RolUsuario rol);

    /**
     * Buscar usuarios activos por rol
     */
    List<Usuario> findByRolAndActivoTrue(RolUsuario rol);

    /**
     * Contar usuarios activos
     */
    long countByActivoTrue();

    /**
     * Actualizar password hash del usuario admin (para migración de performance)
     */
    @Modifying
    @Transactional
    @Query("UPDATE Usuario u SET u.password = :newHash WHERE u.username = 'admin'")
    int updateAdminPasswordHash(@Param("newHash") String newHash);
}
