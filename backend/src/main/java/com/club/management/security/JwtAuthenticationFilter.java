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
            path.startsWith("/api/auth/device/") ||  // Device pairing endpoints
            path.startsWith("/api/auth/pos/") ||      // POS authentication endpoints
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
}
