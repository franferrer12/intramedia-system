package com.club.management.config;

import com.club.management.security.CustomUserDetailsService;
import com.club.management.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuración de seguridad de Spring Security
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.security.bcrypt-strength:4}")
    private int bcryptStrength;

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Usar strength reducido para producción (4 = mucho más rápido que 10)
        // En local dev puedes usar 10 para mayor seguridad
        return new BCryptPasswordEncoder(bcryptStrength);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Security Headers - Sprint 10 Security Audit
                .headers(headers -> headers
                        // HSTS: Force HTTPS for 1 year including subdomains
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)
                        )
                        // Prevent MIME sniffing attacks
                        .contentTypeOptions(contentType -> {})
                        // Prevent clickjacking attacks
                        .frameOptions(frame -> frame.deny())
                        // XSS Protection (legacy but still useful)
                        .xssProtection(xss -> {})
                        // Content Security Policy
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:")
                        )
                )

                // CRITICAL: Enable anonymous authentication for public endpoints
                .anonymous(anonymous -> anonymous.key("anonymousKey"))

                .authorizeHttpRequests(auth -> auth
                        // PERMITIR TODO - El JwtAuthenticationFilter se encarga de la seguridad
                        .anyRequest().permitAll()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterAfter(jwtAuthenticationFilter, LogoutFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Leer orígenes permitidos desde application.yml (separados por coma)
        String originsStr = allowedOrigins.trim();

        // SEGURIDAD CRÍTICA: Rechazar wildcard "*" cuando allowCredentials está habilitado
        // Esto es incompatible con el estándar CORS y causa errores en los navegadores
        if ("*".equals(originsStr) || originsStr.isEmpty()) {
            // Si viene wildcard o vacío, usar origins seguros por defecto
            System.err.println("⚠️  ADVERTENCIA: CORS_ALLOWED_ORIGINS está configurado como wildcard '*' o vacío.");
            System.err.println("⚠️  Usando origins explícitos de producción como fallback seguro.");
            originsStr = "https://club-management-frontend-b893.onrender.com,https://club-management-frontend.onrender.com";
        }

        List<String> origins = Arrays.asList(originsStr.split(","));
        System.out.println("🔒 CORS Configurado con orígenes: " + origins);

        // IMPORTANTE: Usar setAllowedOriginPatterns en lugar de setAllowedOrigins
        // cuando se usa allowCredentials: true. Esto es más compatible con Spring Boot 3.x
        // y evita que se aplique el wildcard "*" por defecto.
        configuration.setAllowedOriginPatterns(origins);

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // IMPORTANTE: No se puede usar "*" con credentials: true
        // Especificar explícitamente los headers permitidos
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
