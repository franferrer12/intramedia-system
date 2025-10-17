package com.club.management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de autenticación JWT
 * Intercepta todas las peticiones y valida el token JWT
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Skip JWT authentication for public endpoints only
        String path = request.getRequestURI();
        String method = request.getMethod();

        logger.info("JWT Filter: " + method + " " + path + " - Processing...");

        // Only skip JWT for truly public endpoints
        if (path.startsWith("/public/") ||
            path.equals("/api/auth/login") ||
            path.equals("/api/auth/register") ||
            path.equals("/api/auth/device/setup") ||     // Public: Device pairing via token
            path.equals("/api/auth/device/pair") ||      // Public: Device pairing via code
            path.equals("/api/auth/device/login") ||     // Public: Device login
            path.equals("/api/auth/device/pairing") ||   // Public: Device pairing token
            path.equals("/api/auth/device/quick-start") || // Public: Quick start
            path.startsWith("/api/auth/pos/") ||         // POS authentication endpoints
            path.equals("/actuator/health")) {
            logger.info("JWT Filter: Skipping public endpoint " + path);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);
            logger.info("JWT Filter: Token extracted: " + (jwt != null ? "YES (length=" + jwt.length() + ")" : "NO"));

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                logger.info("JWT Filter: Token valid, username: " + username);

                // Check if this is a device token (UUID format: 8-4-4-4-12 hex characters)
                // Device tokens contain the device UUID directly
                if (isDeviceUUID(username)) {
                    logger.info("JWT Filter: Device token detected for UUID: " + username);

                    // Create a simple authenticated token for devices
                    // Devices don't need full UserDetails, just authentication
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    username,  // Principal is the device UUID
                                    null,      // No credentials needed
                                    java.util.Collections.singletonList(
                                        new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_DEVICE")
                                    )
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.info("JWT Filter: Device authentication set in SecurityContext");
                } else {
                    // Regular user authentication
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.info("JWT Filter: User loaded, authorities: " + userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.info("JWT Filter: Authentication set in SecurityContext");
                }
            } else {
                logger.warn("JWT Filter: Token validation failed or empty");
            }
        } catch (Exception ex) {
            logger.error("JWT Filter: Exception occurred: " + ex.getMessage(), ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrae el JWT del header Authorization
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Verifica si un string es un UUID válido de dispositivo POS
     * UUID format: 8-4-4-4-12 hex characters (ej: 0ff54a38-ee5f-45bf-850d-ec8c900698f4)
     */
    private boolean isDeviceUUID(String str) {
        if (str == null || str.length() != 36) {
            return false;
        }
        // UUID regex: 8 hex - 4 hex - 4 hex - 4 hex - 12 hex
        return str.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    }
}
