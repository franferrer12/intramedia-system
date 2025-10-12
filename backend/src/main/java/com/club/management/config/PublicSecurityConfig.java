package com.club.management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuración de seguridad SEPARADA para endpoints públicos.
 *
 * CRITICAL: Este filtro se ejecuta ANTES del filtro principal (@Order(1))
 * y maneja ÚNICAMENTE los endpoints /public/** sin ninguna autenticación.
 *
 * Esto es necesario porque Spring Security 6.x tiene un bug donde
 * incluso con .permitAll(), algunos requests se bloquean con 403.
 */
@Configuration
@EnableWebSecurity
public class PublicSecurityConfig {

    /**
     * Filtro de seguridad para endpoints públicos.
     *
     * @Order(1) = Se ejecuta ANTES del filtro principal
     * .securityMatchers("/public/**") = Solo aplica a /public/**
     * .authorizeHttpRequests(auth -> auth.anyRequest().permitAll()) = Permite TODO sin autenticación
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/public/**")  // Solo aplica a /public/**
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())  // CORS se maneja en el filtro principal
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth ->
                auth.anyRequest().permitAll()  // Permitir TODO sin verificación
            );

        return http.build();
    }
}
