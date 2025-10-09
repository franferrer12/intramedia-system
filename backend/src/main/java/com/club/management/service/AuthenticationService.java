package com.club.management.service;

import com.club.management.dto.request.LoginRequest;
import com.club.management.dto.response.LoginResponse;
import com.club.management.dto.response.UsuarioDTO;
import com.club.management.entity.Usuario;
import com.club.management.repository.UsuarioRepository;
import com.club.management.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Servicio de autenticación
 * Maneja login, refresh token y obtención de usuario actual
 */
@Service
public class AuthenticationService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Autentica un usuario y genera un token JWT
     */
    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        // Autenticar usuario
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generar token
        String token = tokenProvider.generateToken(authentication);

        // Actualizar último acceso
        Usuario usuario = usuarioRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        // Retornar respuesta
        return new LoginResponse(
                token,
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRol().name()
        );
    }

    /**
     * Obtiene el usuario actualmente autenticado
     */
    @Transactional(readOnly = true)
    public UsuarioDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        return mapToDTO(usuario);
    }

    /**
     * Refresca el token JWT
     */
    public String refreshToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return tokenProvider.generateToken(authentication);
    }

    /**
     * Mapea Usuario a UsuarioDTO
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
                .build();
    }
}
