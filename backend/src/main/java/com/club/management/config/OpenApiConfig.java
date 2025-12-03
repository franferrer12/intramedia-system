package com.club.management.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuración de OpenAPI/Swagger para documentación de API
 *
 * Acceso a la documentación:
 * - Swagger UI: /swagger-ui/index.html
 * - OpenAPI JSON: /v3/api-docs
 * - OpenAPI YAML: /v3/api-docs.yaml
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:Club Management System}")
    private String applicationName;

    @Value("${app.version:0.3.1}")
    private String version;

    @Bean
    public OpenAPI customOpenAPI() {
        // Definir el esquema de seguridad JWT
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization")
                .description("JWT token obtenido del endpoint /api/auth/login");

        // Requerimiento de seguridad para aplicar globalmente
        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("Bearer Authentication");

        return new OpenAPI()
                .info(new Info()
                        .title(applicationName + " - API Documentation")
                        .version(version)
                        .description("""
                                ## Sistema Integral de Gestión para Discotecas

                                API REST completa para la gestión de eventos, finanzas, personal, inventario,
                                punto de venta (POS) y sistema de botellas VIP.

                                ### Autenticación

                                La mayoría de los endpoints requieren autenticación mediante JWT Bearer token.

                                **Pasos para autenticarse:**
                                1. Obtener token: `POST /api/auth/login` con credenciales
                                2. Usar el token en el header: `Authorization: Bearer {token}`
                                3. El token expira en 24 horas

                                **Credenciales por defecto (desarrollo):**
                                - Usuario: `admin`
                                - Contraseña: `admin123`

                                ### Roles y Permisos

                                - **ADMIN**: Acceso total al sistema
                                - **GERENTE**: Gestión de operaciones (sin usuarios del sistema)
                                - **RRHH**: Gestión de personal y nóminas
                                - **ENCARGADO**: Operaciones limitadas
                                - **LECTURA**: Solo consultas (sin modificaciones)

                                ### Módulos Disponibles

                                1. **Autenticación**: Login, refresh token, usuario actual
                                2. **Eventos**: Gestión de eventos y fiestas
                                3. **Finanzas**: Transacciones, ingresos, gastos, P&L
                                4. **Personal**: Empleados, jornadas laborales, nóminas
                                5. **Inventario**: Productos, stock, movimientos, alertas
                                6. **POS**: Punto de venta, sesiones de caja, consumos
                                7. **Botellas VIP**: Gestión de botellas abiertas, tracking copa por copa
                                8. **Analytics**: Dashboard, estadísticas, reportes
                                9. **Proveedores**: Gestión de proveedores
                                10. **Usuarios**: Gestión de usuarios del sistema

                                ### Formatos de Respuesta

                                - **Éxito**: JSON con datos solicitados
                                - **Error**: JSON con mensaje de error y código HTTP apropiado

                                ### Paginación

                                Algunos endpoints soportan paginación con parámetros:
                                - `page`: Número de página (0-indexed)
                                - `size`: Tamaño de página
                                - `sort`: Campo y dirección de ordenamiento

                                ### Versión

                                Versión actual: **v0.3.1** (Sprint 10 - Security Patch)
                                """)
                        .contact(new Contact()
                                .name("Equipo de Desarrollo")
                                .email("dev@club-management.com")
                                .url("https://github.com/franferrer12/club-management"))
                        .license(new License()
                                .name("Propietario")
                                .url("https://club-management.com/license")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Servidor de Desarrollo Local"),
                        new Server()
                                .url("https://club-manegament-production.up.railway.app")
                                .description("Servidor de Producción (Railway)")
                ))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", securityScheme))
                .addSecurityItem(securityRequirement);
    }
}
