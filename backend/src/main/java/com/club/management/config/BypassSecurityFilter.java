package com.club.management.config;

import com.club.management.dto.AuthDispositivoDTO;
import com.club.management.service.DispositivoPOSService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Servlet Filter que intercepta requests de autenticación de dispositivos
 * ANTES de que Spring Security los procese, permitiendo autenticación sin JWT.
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class BypassSecurityFilter implements Filter {

    private final DispositivoPOSService dispositivoPOSService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // Interceptar SOLO requests de autenticación de dispositivos
        if ("POST".equals(method) &&
            (path.contains("/api/dispositivos-pos/autenticar") ||
             path.contains("/api/auth/pos/login"))) {

            try {
                // Extraer parámetros
                String uuid = httpRequest.getParameter("uuid");
                String pin = httpRequest.getParameter("pin");

                if (uuid == null || pin == null) {
                    sendError(httpResponse, 400, "UUID y PIN son requeridos");
                    return;
                }

                // Autenticar directamente, bypassing Spring Security
                AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(uuid, pin);

                // Enviar respuesta exitosa
                httpResponse.setStatus(HttpServletResponse.SC_OK);
                httpResponse.setContentType("application/json");
                httpResponse.setCharacterEncoding("UTF-8");

                // Configurar CORS
                httpResponse.setHeader("Access-Control-Allow-Origin", "*");
                httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

                objectMapper.writeValue(httpResponse.getWriter(), auth);
                return; // NO continuar con el filter chain

            } catch (Exception e) {
                sendError(httpResponse, 401, "Autenticación fallida: " + e.getMessage());
                return;
            }
        }

        // Para todos los demás requests, continuar normalmente
        chain.doFilter(request, response);
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
