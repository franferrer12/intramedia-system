package com.club.management.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Configuración para excluir completamente /public/** de Spring Security.
 *
 * CRITICAL: Esta es la única forma garantizada de bypasear COMPLETAMENTE
 * Spring Security para ciertos paths. WebSecurityCustomizer se ejecuta
 * ANTES de cualquier SecurityFilterChain y excluye los paths del
 * procesamiento de seguridad por completo.
 *
 * Esto es diferente a .permitAll() que aún pasa por los filtros de seguridad.
 * Con WebSecurityCustomizer, Spring Security IGNORA completamente estos paths.
 */
@Configuration
public class PublicSecurityConfig {

    /**
     * Excluye /public/** de TODO el procesamiento de Spring Security.
     *
     * Esto significa:
     * - No pasa por ningún SecurityFilterChain
     * - No pasa por JwtAuthenticationFilter
     * - No pasa por AuthorizationFilter
     * - Va directamente al controller
     *
     * Es como si estos endpoints no tuvieran Spring Security habilitado.
     *
     * IMPORTANTE: NO excluir /api/auth/** porque algunos endpoints
     * requieren autenticación (/api/auth/me, /api/auth/device/{id}/qr, etc.)
     * Solo se excluyen endpoints públicos específicos manejados por JwtAuthenticationFilter.
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
            .requestMatchers("/public/**")
            .requestMatchers("/actuator/health");
    }

    /**
     * Filtro CORS para endpoints públicos que están excluidos de Spring Security.
     *
     * Como /public/** se salta Spring Security con web.ignoring(),
     * necesitamos un filtro separado para manejar CORS solo para esos endpoints.
     *
     * IMPORTANTE: NO aplicar a /api/auth/** porque esos endpoints ahora
     * pasan por Spring Security y usan la configuración CORS de SecurityConfig.
     */
    @Component
    @Order(Integer.MIN_VALUE)  // Ejecuta PRIMERO
    public static class PublicCorsFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            String path = request.getRequestURI();

            // Solo aplicar a endpoints que están excluidos de Spring Security
            if (path.startsWith("/public/") || path.equals("/actuator/health")) {
                // Configurar headers CORS con wildcard (solo para endpoints verdaderamente públicos)
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
                response.setHeader("Access-Control-Max-Age", "3600");

                // Si es preflight (OPTIONS), responder inmediatamente
                if ("OPTIONS".equals(request.getMethod())) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    return;
                }
            }

            filterChain.doFilter(request, response);
        }
    }
}
