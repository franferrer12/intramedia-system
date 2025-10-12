package com.club.management.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuración de seguridad pública para autenticación de dispositivos POS.
 * Esta configuración tiene prioridad (@Order(1)) sobre la configuración principal.
 */
@Configuration
@EnableWebSecurity
@Order(1)
@ConditionalOnProperty(name = "app.security.enabled", havingValue = "false", matchIfMissing = false)
public class PublicSecurityConfig {

    @Bean
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        // TEMPORAL: Deshabilitar completamente la seguridad para debugging
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
