package com.club.management.service;

import com.club.management.dto.request.UsuarioRequest;
import com.club.management.dto.response.UsuarioDTO;
import com.club.management.entity.Usuario;
import com.club.management.entity.Usuario.RolUsuario;
import com.club.management.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de Usuarios
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Obtener todos los usuarios
     */
    @Transactional(readOnly = true)
    public List<UsuarioDTO> getAllUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener usuario por ID
     */
    @Transactional(readOnly = true)
    public UsuarioDTO getUsuarioById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        return mapToDTO(usuario);
    }

    /**
     * Obtener usuarios activos
     */
    @Transactional(readOnly = true)
    public List<UsuarioDTO> getUsuariosActivos() {
        return usuarioRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener usuarios por rol
     */
    @Transactional(readOnly = true)
    public List<UsuarioDTO> getUsuariosByRol(RolUsuario rol) {
        return usuarioRepository.findByRol(rol).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crear nuevo usuario
     */
    @Transactional
    public UsuarioDTO createUsuario(UsuarioRequest request) {
        // Validar que el username no exista
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El username ya existe: " + request.getUsername());
        }

        // Validar que el email no exista
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya existe: " + request.getEmail());
        }

        // Validar que se proporcione contraseña para nuevo usuario
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new RuntimeException("La contraseña es obligatoria para crear un usuario");
        }

        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .rol(request.getRol())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .build();

        Usuario savedUsuario = usuarioRepository.save(usuario);
        return mapToDTO(savedUsuario);
    }

    /**
     * Actualizar usuario existente
     */
    @Transactional
    public UsuarioDTO updateUsuario(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        // Validar username único (si cambió)
        if (!usuario.getUsername().equals(request.getUsername()) &&
                usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El username ya existe: " + request.getUsername());
        }

        // Validar email único (si cambió)
        if (!usuario.getEmail().equals(request.getEmail()) &&
                usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya existe: " + request.getEmail());
        }

        usuario.setUsername(request.getUsername());
        usuario.setEmail(request.getEmail());
        usuario.setRol(request.getRol());
        usuario.setActivo(request.getActivo());

        // Solo actualizar contraseña si se proporciona
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Usuario updatedUsuario = usuarioRepository.save(usuario);
        return mapToDTO(updatedUsuario);
    }

    /**
     * Eliminar usuario (soft delete - marcarlo como inactivo)
     */
    @Transactional
    public void deleteUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    /**
     * Eliminar usuario permanentemente
     */
    @Transactional
    public void deleteUsuarioPermanente(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado con id: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    /**
     * Cambiar rol de usuario
     */
    @Transactional
    public UsuarioDTO cambiarRol(Long id, RolUsuario nuevoRol) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        usuario.setRol(nuevoRol);
        Usuario updatedUsuario = usuarioRepository.save(usuario);
        return mapToDTO(updatedUsuario);
    }

    /**
     * Activar/Desactivar usuario
     */
    @Transactional
    public UsuarioDTO toggleActivo(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        usuario.setActivo(!usuario.getActivo());
        Usuario updatedUsuario = usuarioRepository.save(usuario);
        return mapToDTO(updatedUsuario);
    }

    /**
     * Get current authenticated user ID from security context
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String username = authentication.getName();
        return usuarioRepository.findByUsername(username)
                .map(Usuario::getId)
                .orElse(null);
    }

    /**
     * Update user role (wrapper for cambiarRol that accepts String)
     */
    @Transactional
    public UsuarioDTO updateRol(Long id, String rol) {
        RolUsuario rolUsuario = RolUsuario.valueOf(rol);
        return cambiarRol(id, rolUsuario);
    }

    /**
     * Reset user password and generate a temporary one
     */
    @Transactional
    public String resetPassword(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        // Generate temporary password (8 characters: letters + numbers)
        String tempPassword = generateTemporaryPassword(8);

        usuario.setPassword(passwordEncoder.encode(tempPassword));
        usuarioRepository.save(usuario);

        return tempPassword;
    }

    /**
     * Get user statistics for admin dashboard
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getEstadisticas() {
        List<Usuario> allUsers = usuarioRepository.findAll();

        Map<String, Object> stats = new HashMap<>();

        // Total users
        stats.put("totalUsuarios", allUsers.size());

        // Active/Inactive counts
        long activos = allUsers.stream().filter(Usuario::getActivo).count();
        stats.put("usuariosActivos", activos);
        stats.put("usuariosInactivos", allUsers.size() - activos);

        // Count by role
        Map<String, Long> usuariosPorRol = allUsers.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getRol().name(),
                        Collectors.counting()
                ));
        stats.put("usuariosPorRol", usuariosPorRol);

        return stats;
    }

    /**
     * Generate a random temporary password
     */
    private String generateTemporaryPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < length; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }

        return password.toString();
    }

    /**
     * Mapear Usuario a UsuarioDTO
     */
    private UsuarioDTO mapToDTO(Usuario usuario) {
        return UsuarioDTO.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .rol(usuario.getRol().name())
                .activo(usuario.getActivo())
                .ultimoAcceso(usuario.getUltimoAcceso())
                .creadoEn(usuario.getCreadoEn())
                .actualizadoEn(usuario.getActualizadoEn())
                .build();
    }
}
