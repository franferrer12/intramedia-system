# 🔧 TAREAS PENDIENTES DE OPTIMIZACIÓN

**Proyecto:** Club Management System
**Fecha de Auditoría:** 9 de Octubre de 2025
**Versión:** 0.1.0
**Total de Tareas:** 32

---

## 📊 RESUMEN POR PRIORIDAD

```
🔴 CRÍTICAS:  5 tareas → ✅ 3 completadas (2025-10-09) | 🔄 2 pendientes
🟠 ALTAS:     10 tareas → ✅ 2 completadas (2025-10-09) | 🔄 8 pendientes
🟡 MEDIAS:    12 tareas → 🔄 12 pendientes
🟢 BAJAS:     5 tareas → 🔄 5 pendientes

TOTAL: 32 tareas → ✅ 5 completadas (15.6%) | 🔄 27 pendientes (84.4%)
```

**Última actualización:** 2025-10-09
**Tareas completadas en última sesión:**
- ✅ TAREA-001: Eliminar CORS Inseguro (CRÍTICA)
- ✅ TAREA-004: JWT Secret Fuerte (CRÍTICA)
- ✅ TAREA-008: @Valid en Controllers (CRÍTICA)
- ✅ TAREA-007: Logger en JwtTokenProvider (ALTA)
- ✅ TAREA-018-EXTRA: TypeScript type safety en axios (MEDIA)

---

## 🔴 TAREAS CRÍTICAS (Bloqueantes para Producción)

### ✅ TAREA-001: Eliminar CORS Inseguro (COMPLETADA 2025-10-09)
**Prioridad:** CRÍTICA
**Estimación:** 1 hora
**Tiempo real:** 15 minutos
**Ubicación:** Todos los controllers (13 archivos)

**Problema:**
```java
@CrossOrigin(origins = "*")  // ← INSEGURO - Permite cualquier origen
```

**Archivos afectados:**
- `backend/src/main/java/com/club/management/controller/ProductoController.java:21`
- `backend/src/main/java/com/club/management/controller/TransaccionController.java:21`
- `backend/src/main/java/com/club/management/controller/EmpleadoController.java`
- `backend/src/main/java/com/club/management/controller/NominaController.java`
- `backend/src/main/java/com/club/management/controller/JornadaTrabajoController.java`
- `backend/src/main/java/com/club/management/controller/ProveedorController.java`
- `backend/src/main/java/com/club/management/controller/ReportController.java`
- `backend/src/main/java/com/club/management/controller/UsuarioController.java`
- `backend/src/main/java/com/club/management/controller/AnalyticsController.java`
- `backend/src/main/java/com/club/management/controller/MovimientoStockController.java`
- `backend/src/main/java/com/club/management/controller/AlertaStockController.java`
- `backend/src/main/java/com/club/management/controller/InventoryStatsController.java`
- `backend/src/main/java/com/club/management/controller/CategoriaTransaccionController.java`

**Solución:**
1. Eliminar TODAS las anotaciones `@CrossOrigin(origins = "*")` de los controllers
2. La configuración CORS ya está correctamente definida en `SecurityConfig.java:94-105`
3. Verificar que solo los orígenes permitidos están en `application.yml`

**Verificación:**
```bash
# Buscar todas las ocurrencias
cd backend && grep -r "@CrossOrigin" src/

# Debe retornar 0 resultados
```

---

### TAREA-002: Implementar Suite de Tests ⚠️ URGENTE
**Prioridad:** CRÍTICA
**Estimación:** 2-3 semanas
**Ubicación:** Todo el proyecto

**Problema:**
- ❌ 0 tests unitarios en backend
- ❌ 0 tests de integración en backend
- ❌ 0 tests de componentes en frontend

**Solución:**

#### Backend - Tests Unitarios (Prioridad):
```java
// 1. JwtTokenProviderTest.java
backend/src/test/java/com/club/management/security/JwtTokenProviderTest.java

// 2. ProductoServiceTest.java
backend/src/test/java/com/club/management/service/ProductoServiceTest.java

// 3. TransaccionServiceTest.java
backend/src/test/java/com/club/management/service/TransaccionServiceTest.java

// 4. MovimientoStockServiceTest.java
backend/src/test/java/com/club/management/service/MovimientoStockServiceTest.java

// 5. AuthenticationServiceTest.java
backend/src/test/java/com/club/management/service/AuthenticationServiceTest.java
```

#### Backend - Tests de Integración:
```java
// 6. AuthenticationControllerIntegrationTest.java
backend/src/test/java/com/club/management/controller/AuthenticationControllerIntegrationTest.java

// 7. ProductoControllerIntegrationTest.java
backend/src/test/java/com/club/management/controller/ProductoControllerIntegrationTest.java
```

#### Frontend - Tests de Componentes:
```typescript
// 8. ProductoModal.test.tsx
frontend/src/components/productos/__tests__/ProductoModal.test.tsx

// 9. authStore.test.ts
frontend/src/store/__tests__/authStore.test.ts

// 10. auth.api.test.ts
frontend/src/api/__tests__/auth.api.test.ts
```

**Meta de Cobertura:**
- Backend: Mínimo 60% de cobertura en servicios críticos
- Frontend: Mínimo 50% de cobertura en componentes clave

**Comandos:**
```bash
# Backend
cd backend && ./mvnw test
./mvnw verify  # Con cobertura

# Frontend
cd frontend && npm test
npm run test:coverage
```

---

### TAREA-003: Cambiar Contraseña Admin por Defecto ⚠️ URGENTE
**Prioridad:** CRÍTICA
**Estimación:** 30 minutos
**Ubicación:** `backend/src/main/resources/db/migration/V001__create_base_tables.sql:87-88`

**Problema:**
```sql
-- Contraseña: admin123 (según README)
INSERT INTO usuarios (username, password, email, rol) VALUES
    ('admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
     'admin@clubmanagement.com', 'ADMIN');
```

**Solución:**
1. En PRODUCCIÓN, cambiar inmediatamente la contraseña del usuario admin
2. Implementar endpoint de cambio de contraseña forzado en primer login
3. Agregar política de contraseñas fuertes

**Implementación:**
```java
// AuthenticationService.java
public void cambiarPasswordPrimerLogin(String username, String newPassword) {
    Usuario usuario = usuarioRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("Usuario", username));

    if (!usuario.getPrimerLogin()) {
        throw new IllegalStateException("Cambio de password ya realizado");
    }

    // Validar contraseña fuerte
    if (!isPasswordFuerte(newPassword)) {
        throw new IllegalArgumentException("Contraseña no cumple requisitos de seguridad");
    }

    usuario.setPassword(passwordEncoder.encode(newPassword));
    usuario.setPrimerLogin(false);
    usuarioRepository.save(usuario);
}

private boolean isPasswordFuerte(String password) {
    // Mínimo 8 caracteres, mayúscula, minúscula, número, carácter especial
    return password.length() >= 8
        && password.matches(".*[A-Z].*")
        && password.matches(".*[a-z].*")
        && password.matches(".*\\d.*")
        && password.matches(".*[!@#$%^&*()].*");
}
```

**Agregar campo a Usuario:**
```java
// Usuario.java
@Column(name = "primer_login")
@Builder.Default
private Boolean primerLogin = true;
```

**Nueva migración:**
```sql
-- V012__add_primer_login_usuarios.sql
ALTER TABLE usuarios ADD COLUMN primer_login BOOLEAN DEFAULT TRUE;
UPDATE usuarios SET primer_login = FALSE WHERE username != 'admin';
```

---

### ✅ TAREA-004: Generar JWT Secret Fuerte (COMPLETADA 2025-10-09)
**Prioridad:** CRÍTICA
**Estimación:** 15 minutos
**Tiempo real:** 30 minutos
**Ubicación:** `backend/src/main/resources/application.yml:42`, `.env:5`, `.env.prod.example`

**Problema:**
```yaml
jwt:
  secret: ${JWT_SECRET:default-secret-key-change-in-production-minimum-256-bits-required-for-security}
```

**Solución:**
1. Generar secret fuerte de 512 bits:
```bash
openssl rand -base64 64
```

2. Configurar en variables de entorno (NUNCA en código):
```bash
# .env.prod (NO commitear este archivo)
JWT_SECRET=<tu-secret-generado-de-64-bytes>
```

3. En producción, configurar como variable de entorno:
```bash
# Railway / Docker / Kubernetes
export JWT_SECRET="<secret-generado>"
```

4. Remover valor por defecto de application.yml:
```yaml
jwt:
  secret: ${JWT_SECRET}  # Sin default, falla si no está configurado
  expiration: 86400000
```

**Verificación:**
- El backend debe fallar al arrancar si JWT_SECRET no está configurado
- En logs NO debe aparecer el valor del secret

---

### TAREA-005: Agregar Validaciones Jakarta a Entidades ⚠️ URGENTE
**Prioridad:** CRÍTICA
**Estimación:** 4-6 horas
**Ubicación:** Todas las entidades JPA

**Problema:**
Las entidades no tienen validaciones Jakarta, solo constraints de BD.

**Archivos a modificar:**
- `backend/src/main/java/com/club/management/entity/Producto.java`
- `backend/src/main/java/com/club/management/entity/Transaccion.java`
- `backend/src/main/java/com/club/management/entity/Empleado.java`
- `backend/src/main/java/com/club/management/entity/Evento.java`
- `backend/src/main/java/com/club/management/entity/Proveedor.java`
- `backend/src/main/java/com/club/management/entity/Usuario.java`
- Todas las demás entidades

**Ejemplo de solución (Producto.java):**
```java
@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 50, message = "Código máximo 50 caracteres")
    @Column(unique = true, nullable = false, length = 50)
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "Nombre máximo 200 caracteres")
    @Column(nullable = false, length = 200)
    private String nombre;

    @Size(max = 5000, message = "Descripción máximo 5000 caracteres")
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @NotBlank(message = "La categoría es obligatoria")
    @Size(max = 50, message = "Categoría máximo 50 caracteres")
    @Column(nullable = false, length = 50)
    private String categoria;

    @NotNull(message = "Precio de compra es obligatorio")
    @DecimalMin(value = "0.01", message = "Precio de compra debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2, message = "Precio de compra con máximo 2 decimales")
    @Column(name = "precio_compra", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioCompra;

    @NotNull(message = "Precio de venta es obligatorio")
    @DecimalMin(value = "0.01", message = "Precio de venta debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2, message = "Precio de venta con máximo 2 decimales")
    @Column(name = "precio_venta", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioVenta;

    @NotNull(message = "Stock actual es obligatorio")
    @DecimalMin(value = "0.00", message = "Stock actual no puede ser negativo")
    @Column(name = "stock_actual", nullable = false, precision = 10, scale = 2)
    private BigDecimal stockActual = BigDecimal.ZERO;

    @NotNull(message = "Stock mínimo es obligatorio")
    @DecimalMin(value = "0.00", message = "Stock mínimo no puede ser negativo")
    @Column(name = "stock_minimo", nullable = false, precision = 10, scale = 2)
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    // ... resto de campos
}
```

**Aplicar a todas las entidades siguiendo el patrón:**
- `@NotNull` para campos obligatorios
- `@NotBlank` para strings obligatorios
- `@Size` para límites de longitud
- `@DecimalMin` / `@DecimalMax` para números con rangos
- `@Email` para emails
- `@Pattern` para formatos específicos (CIF, teléfono, etc.)

---

## 🟠 TAREAS ALTAS (Resolver en 2-3 Semanas)

### TAREA-006: Crear Excepciones Custom y GlobalExceptionHandler
**Prioridad:** ALTA
**Estimación:** 4 horas
**Ubicación:** Todos los servicios

**Problema:**
```java
throw new RuntimeException("Producto no encontrado");  // Genérico
```

**Solución:**

1. Crear paquete de excepciones:
```java
// backend/src/main/java/com/club/management/exception/ResourceNotFoundException.java
package com.club.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s no encontrado con %s: %s", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        this(resourceName, "id", id);
    }
}

// backend/src/main/java/com/club/management/exception/BadRequestException.java
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}

// backend/src/main/java/com/club/management/exception/UnauthorizedException.java
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}

// backend/src/main/java/com/club/management/exception/ForbiddenException.java
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}

// backend/src/main/java/com/club/management/exception/ConflictException.java
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
```

2. Crear GlobalExceptionHandler:
```java
// backend/src/main/java/com/club/management/exception/GlobalExceptionHandler.java
package com.club.management.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        log.error("Resource not found: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(
            BadRequestException ex, WebRequest request) {
        log.error("Bad request: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.error("Validation error: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ValidationErrorResponse error = new ValidationErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Errores de validación",
                LocalDateTime.now(),
                request.getDescription(false),
                errors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, WebRequest request) {
        log.error("Bad credentials: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Credenciales inválidas",
                LocalDateTime.now(),
                request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, WebRequest request) {
        log.error("Access denied: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Acceso denegado",
                LocalDateTime.now(),
                request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(
            ConflictException ex, WebRequest request) {
        log.error("Conflict: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Unexpected error", ex);
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Error interno del servidor",
                LocalDateTime.now(),
                request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // DTOs para respuestas de error
    @lombok.Data
    @lombok.AllArgsConstructor
    static class ErrorResponse {
        private int status;
        private String message;
        private LocalDateTime timestamp;
        private String path;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    static class ValidationErrorResponse extends ErrorResponse {
        private Map<String, String> errors;

        public ValidationErrorResponse(int status, String message, LocalDateTime timestamp,
                                      String path, Map<String, String> errors) {
            super(status, message, timestamp, path);
            this.errors = errors;
        }
    }
}
```

3. Reemplazar en todos los servicios:
```java
// ANTES:
throw new RuntimeException("Producto no encontrado");

// DESPUÉS:
throw new ResourceNotFoundException("Producto", id);

// ANTES:
throw new RuntimeException("Ya existe un producto con el código: " + codigo);

// DESPUÉS:
throw new ConflictException("Ya existe un producto con el código: " + codigo);

// ANTES:
throw new RuntimeException("La cantidad debe ser mayor a cero");

// DESPUÉS:
throw new BadRequestException("La cantidad debe ser mayor a cero");
```

---

### ✅ TAREA-007: Reemplazar System.err con Logger (COMPLETADA 2025-10-09)
**Prioridad:** ALTA
**Estimación:** 1 hora
**Tiempo real:** 15 minutos
**Ubicación:** `JwtTokenProvider.java:74-82`

**Problema:**
```java
System.err.println("Invalid JWT signature");
```

**Solución:**
```java
package com.club.management.security;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j  // ← Agregar esta anotación de Lombok
public class JwtTokenProvider {

    // ... código existente ...

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }
}
```

**Búsqueda de otros System.out/err:**
```bash
cd backend && grep -r "System\.out\|System\.err" src/
```

---

### ✅ TAREA-008: Agregar @Valid a todos los Controllers (COMPLETADA 2025-10-09)
**Prioridad:** CRÍTICA
**Estimación:** 2 horas
**Tiempo real:** 45 minutos
**Ubicación:** Todos los controllers con @RequestBody (24 endpoints)

**Problema:**
```java
public ResponseEntity<ProductoDTO> crearProducto(@RequestBody ProductoFormData formData) {
    // ← FALTA @Valid
}
```

**Solución:**
Agregar `@Valid` a TODOS los endpoints que reciben `@RequestBody`:

```java
// ProductoController.java
@PostMapping
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
public ResponseEntity<ProductoDTO> crearProducto(@Valid @RequestBody ProductoFormData formData) {
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(productoService.crearProducto(formData));
}

@PutMapping("/{id}")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
public ResponseEntity<ProductoDTO> actualizarProducto(
        @PathVariable Long id,
        @Valid @RequestBody ProductoFormData formData) {
    return ResponseEntity.ok(productoService.actualizarProducto(id, formData));
}
```

**Archivos a revisar:**
- `ProductoController.java`
- `TransaccionController.java`
- `EmpleadoController.java`
- `EventoController.java`
- `NominaController.java`
- `JornadaTrabajoController.java`
- `ProveedorController.java`
- `UsuarioController.java`
- `MovimientoStockController.java`

**Buscar endpoints sin @Valid:**
```bash
cd backend/src/main/java/com/club/management/controller
grep -n "@RequestBody" *.java | grep -v "@Valid"
```

---

### TAREA-009: Implementar Rate Limiting
**Prioridad:** ALTA
**Estimación:** 6 horas
**Ubicación:** `SecurityConfig.java`, controllers críticos

**Problema:**
No hay protección contra:
- Ataques de fuerza bruta en login
- Abuso de API endpoints
- DDoS básicos

**Solución:**

1. Agregar dependencia:
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>

<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-caffeine</artifactId>
    <version>8.7.0</version>
</dependency>
```

2. Crear configuración de rate limiting:
```java
// backend/src/main/java/com/club/management/config/RateLimitConfig.java
package com.club.management.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import io.github.bucket4j.caffeine.CaffeineProxyManager;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class RateLimitConfig {

    @Bean
    public CaffeineProxyManager<String> rateLimitProxyManager() {
        return Bucket4j.extension(Caffeine.class).proxyManagerForCache(
                Caffeine.newBuilder()
                        .expireAfterAccess(10, TimeUnit.MINUTES)
                        .maximumSize(10000)
                        .build()
        );
    }

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000));
        return cacheManager;
    }
}
```

3. Crear filtro de rate limiting:
```java
// backend/src/main/java/com/club/management/security/RateLimitFilter.java
package com.club.management.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import io.github.bucket4j.caffeine.CaffeineProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final CaffeineProxyManager<String> rateLimitProxyManager;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = getClientIP(request);
        String path = request.getRequestURI();

        // Rate limit más estricto para login
        if (path.contains("/api/auth/login")) {
            Bucket bucket = resolveBucket(key + ":login", () ->
                    Bandwidth.simple(5, Duration.ofMinutes(1)) // 5 intentos por minuto
            );

            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded for login from IP: {}", key);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("{\"error\":\"Demasiados intentos de login. Intente en 1 minuto.\"}");
                return;
            }
        }
        // Rate limit general para API
        else if (path.startsWith("/api/")) {
            Bucket bucket = resolveBucket(key + ":api", () ->
                    Bandwidth.simple(100, Duration.ofMinutes(1)) // 100 requests por minuto
            );

            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded for API from IP: {}", key);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("{\"error\":\"Límite de peticiones excedido. Intente en 1 minuto.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private Bucket resolveBucket(String key, Supplier<Bandwidth> bandwidthSupplier) {
        return rateLimitProxyManager.builder().build(key, () -> {
            return Bucket.builder()
                    .addLimit(bandwidthSupplier.get())
                    .build();
        });
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null) {
            return xfHeader.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
```

4. Agregar filtro a SecurityConfig:
```java
// SecurityConfig.java
@Autowired
private RateLimitFilter rateLimitFilter;

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // ... configuración existente ...
        .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

**Límites recomendados:**
- Login: 5 intentos/minuto por IP
- API general: 100 requests/minuto por IP
- Exportaciones: 10 exports/hora por usuario

---

### TAREA-010: Completar Health Checks
**Prioridad:** ALTA
**Estimación:** 3 horas
**Ubicación:** `application.yml`, configuración de Actuator

**Problema:**
Health checks básicos, falta verificación de:
- Conectividad de BD específica
- Estado de Flyway
- Espacio en disco
- Métricas personalizadas

**Solución:**

1. Actualizar application.yml:
```yaml
# application.yml - perfil prod
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: always
      show-components: always
      probes:
        enabled: true
  health:
    db:
      enabled: true
    diskspace:
      enabled: true
      threshold: 10GB
    livenessState:
      enabled: true
    readinessState:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
```

2. Crear custom health indicators:
```java
// backend/src/main/java/com/club/management/health/DatabaseHealthIndicator.java
package com.club.management.health;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseHealthIndicator implements HealthIndicator {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Health health() {
        try {
            // Verificar conexión
            Integer result = jdbcTemplate.queryForObject(
                    "SELECT 1", Integer.class);

            if (result != null && result == 1) {
                // Obtener métricas de BD
                Long tableCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.tables " +
                        "WHERE table_schema = 'public'", Long.class);

                Long connectionCount = jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM pg_stat_activity", Long.class);

                return Health.up()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("tables", tableCount)
                        .withDetail("connections", connectionCount)
                        .build();
            } else {
                return Health.down()
                        .withDetail("error", "Query verification failed")
                        .build();
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}

// backend/src/main/java/com/club/management/health/FlywayHealthIndicator.java
@Component
@RequiredArgsConstructor
public class FlywayHealthIndicator implements HealthIndicator {

    private final Flyway flyway;

    @Override
    public Health health() {
        try {
            var info = flyway.info();
            var current = info.current();
            var pending = info.pending();

            if (pending.length > 0) {
                return Health.down()
                        .withDetail("status", "Pending migrations")
                        .withDetail("current", current != null ? current.getVersion() : "none")
                        .withDetail("pending", pending.length)
                        .build();
            }

            return Health.up()
                    .withDetail("status", "All migrations applied")
                    .withDetail("version", current != null ? current.getVersion() : "none")
                    .withDetail("applied", info.applied().length)
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}

// backend/src/main/java/com/club/management/health/ApplicationHealthIndicator.java
@Component
public class ApplicationHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        double memoryUsagePercent = (double) usedMemory / maxMemory * 100;

        Health.Builder builder = memoryUsagePercent < 90 ? Health.up() : Health.down();

        return builder
                .withDetail("memoryUsagePercent", String.format("%.2f%%", memoryUsagePercent))
                .withDetail("usedMemory", formatBytes(usedMemory))
                .withDetail("maxMemory", formatBytes(maxMemory))
                .withDetail("processors", runtime.availableProcessors())
                .build();
    }

    private String formatBytes(long bytes) {
        return String.format("%.2f MB", bytes / 1024.0 / 1024.0);
    }
}
```

3. Endpoints de health check:
```
GET /actuator/health          # General health
GET /actuator/health/liveness # Liveness probe (K8s)
GET /actuator/health/readiness # Readiness probe (K8s)
GET /actuator/metrics         # Métricas disponibles
GET /actuator/prometheus      # Métricas para Prometheus
```

---

### TAREA-011: Migrar a Constructor Injection
**Prioridad:** ALTA
**Estimación:** 3 horas
**Ubicación:** Clases con @Autowired field injection

**Problema:**
```java
@Autowired
private JwtTokenProvider tokenProvider;  // Field injection
```

**Solución:**
Usar constructor injection con Lombok:

```java
// ANTES:
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;
}

// DESPUÉS:
@Component
@RequiredArgsConstructor  // ← Genera constructor automáticamente
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;
}
```

**Clases a modificar:**
- `JwtAuthenticationFilter.java`
- `SecurityConfig.java` (ya usa @Autowired, cambiar a final + constructor)
- `CustomUserDetailsService.java`
- `AuthenticationController.java`
- Todos los controllers y services que usen @Autowired

**Búsqueda:**
```bash
cd backend && grep -r "@Autowired" src/main/java/
```

**Beneficios:**
- Mejor testabilidad (mockear dependencias)
- Inmutabilidad (final fields)
- Falla en compile-time si faltan dependencias
- Mejor para refactoring

---

### TAREA-012: Agregar @Valid a DTOs de Request
**Prioridad:** ALTA
**Estimación:** 4 horas
**Ubicación:** Paquete `dto/request`

**Problema:**
Algunos DTOs no tienen validaciones Jakarta.

**Solución:**

```java
// backend/src/main/java/com/club/management/dto/request/ProductoFormData.java
package com.club.management.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ProductoFormData {

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 50, message = "Código máximo 50 caracteres")
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "Nombre máximo 200 caracteres")
    private String nombre;

    @Size(max = 5000, message = "Descripción máximo 5000 caracteres")
    private String descripcion;

    @NotBlank(message = "La categoría es obligatoria")
    @Size(max = 50, message = "Categoría máximo 50 caracteres")
    private String categoria;

    @NotBlank(message = "La unidad de medida es obligatoria")
    private String unidadMedida;

    private Long proveedorId;

    @NotNull(message = "Precio de compra obligatorio")
    @DecimalMin(value = "0.01", message = "Precio de compra debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal precioCompra;

    @NotNull(message = "Precio de venta obligatorio")
    @DecimalMin(value = "0.01", message = "Precio de venta debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal precioVenta;

    @NotNull(message = "Stock mínimo obligatorio")
    @DecimalMin(value = "0.00", message = "Stock mínimo no puede ser negativo")
    private BigDecimal stockMinimo;

    @DecimalMin(value = "0.00", message = "Stock máximo no puede ser negativo")
    private BigDecimal stockMaximo;

    @DecimalMin(value = "0.00", message = "Stock actual no puede ser negativo")
    private BigDecimal stockActual;

    private Boolean activo;
    private Boolean perecedero;

    @Positive(message = "Días de caducidad debe ser positivo")
    private Integer diasCaducidad;

    @Size(max = 500, message = "URL de imagen máximo 500 caracteres")
    private String imagenUrl;

    @Size(max = 5000, message = "Notas máximo 5000 caracteres")
    private String notas;

    // Campos ocio nocturno
    @DecimalMin(value = "0.01", message = "Capacidad debe ser mayor a 0")
    private BigDecimal capacidadMl;

    private String tipoVenta;

    @DecimalMin(value = "0.01", message = "ML por servicio debe ser mayor a 0")
    private BigDecimal mlPorServicio;

    @DecimalMin(value = "0.00", message = "Factor de merma no puede ser negativo")
    @DecimalMax(value = "100.00", message = "Factor de merma no puede ser mayor a 100")
    private BigDecimal factorMerma;
}
```

**Aplicar a todos los DTOs de request:**
- `LoginRequest.java`
- `TransaccionRequest.java`
- `EmpleadoRequest.java`
- `EventoRequest.java`
- `JornadaTrabajoRequest.java`
- `NominaRequest.java`
- `MovimientoStockFormData.java`
- Etc.

---

### TAREA-013: Implementar Refresh Token Automático
**Prioridad:** ALTA
**Estimación:** 4 horas
**Ubicación:** Frontend `authStore.ts`, `axios.ts`

**Problema:**
Token JWT expira en 24h y el usuario debe re-loguearse manualmente.

**Solución:**

1. Backend - Agregar refresh token:
```java
// JwtTokenProvider.java - Agregar método
public String refreshToken(String oldToken) {
    try {
        String username = getUsernameFromToken(oldToken);

        // Verificar que el token aún es válido (no expirado hace más de 7 días)
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(oldToken)
                .getPayload();

        Date expiration = claims.getExpiration();
        long daysSinceExpiration = Duration.between(
                expiration.toInstant(),
                Instant.now()
        ).toDays();

        if (daysSinceExpiration > 7) {
            throw new IllegalArgumentException("Token expirado hace más de 7 días");
        }

        return generateTokenFromUsername(username);
    } catch (Exception e) {
        throw new IllegalArgumentException("Token inválido para refresh");
    }
}
```

2. Frontend - Interceptor automático:
```typescript
// frontend/src/api/axios.ts
import axios from 'axios';
import { authApi } from './auth.api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor con refresh automático
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es el endpoint de login o refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Si ya estamos refrescando, poner en cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await authApi.refreshToken();
        const newToken = response.token;

        localStorage.setItem('token', newToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Si el refresh falla, logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

3. Agregar endpoint de refresh al backend:
```java
// AuthenticationController.java - Ya existe pero verificar
@PostMapping("/refresh")
@Operation(summary = "Refresh token", description = "Genera un nuevo token JWT")
public ResponseEntity<LoginResponse> refreshToken(HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        throw new BadRequestException("Token no proporcionado");
    }

    String oldToken = authHeader.substring(7);
    String newToken = jwtTokenProvider.refreshToken(oldToken);
    UsuarioDTO usuario = authenticationService.getCurrentUser();

    LoginResponse response = LoginResponse.builder()
            .token(newToken)
            .type("Bearer")
            .username(usuario.getUsername())
            .email(usuario.getEmail())
            .rol(usuario.getRol())
            .build();

    return ResponseEntity.ok(response);
}
```

---

### TAREA-014: Verificar Usuario Activo en Cada Request
**Prioridad:** ALTA
**Estimación:** 2 horas
**Ubicación:** `JwtAuthenticationFilter.java`

**Problema:**
Si se desactiva un usuario pero tiene un token válido, puede seguir usando la API hasta que expire (24h).

**Solución:**

```java
// JwtAuthenticationFilter.java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {
    // ... código existente ...

    try {
        String jwt = getJwtFromRequest(request);

        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
            String username = tokenProvider.getUsernameFromToken(jwt);

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // ← AGREGAR VERIFICACIÓN DE USUARIO ACTIVO
            if (!userDetails.isEnabled()) {
                logger.warn("Usuario inactivo intentó acceder: {}", username);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Usuario inactivo\"}");
                return;
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    } catch (Exception ex) {
        logger.error("Could not set user authentication in security context", ex);
    }

    filterChain.doFilter(request, response);
}
```

**Nota:** CustomUserDetailsService ya verifica activo en loadByUsername, pero es mejor también verificar en el filtro.

---

### TAREA-015: Forzar HTTPS en Producción
**Prioridad:** ALTA
**Estimación:** 1 hora
**Ubicación:** `SecurityConfig.java`

**Problema:**
No hay configuración para forzar HTTPS en producción.

**Solución:**

```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // ← AGREGAR: Forzar HTTPS en producción
        .requiresChannel(channel -> {
            if (isProdProfile()) {
                channel.anyRequest().requiresSecure();
            }
        })

        .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
                // ... resto de configuración ...
        );

    return http.build();
}

@Autowired
private Environment environment;

private boolean isProdProfile() {
    return Arrays.asList(environment.getActiveProfiles()).contains("prod");
}
```

**Configuración adicional de headers de seguridad:**
```java
http
    .headers(headers -> headers
        .contentSecurityPolicy(csp ->
            csp.policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'")
        )
        .frameOptions(frame -> frame.deny())
        .xssProtection(xss -> xss.block(true))
        .contentTypeOptions(contentType -> contentType.disable())
    );
```

---

## 🟡 TAREAS MEDIAS (Resolver en 1-2 Meses)

### TAREA-016: Agregar Paginación a Endpoints findAll()
**Prioridad:** MEDIA
**Estimación:** 6 horas
**Ubicación:** Todos los servicios con findAll()

**Problema:**
```java
public List<ProductoDTO> getAllProductos() {
    return productoRepository.findAll().stream()  // Sin paginación
        .map(this::toDTO)
        .collect(Collectors.toList());
}
```

**Solución:**

1. Modificar repositories:
```java
// ProductoRepository.java
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Page<Producto> findAll(Pageable pageable);
    Page<Producto> findByActivoTrue(Pageable pageable);
    Page<Producto> findByCategoria(String categoria, Pageable pageable);

    // Mantener métodos sin paginación solo para casos específicos
    List<Producto> findByActivoTrue();
}
```

2. Modificar services:
```java
// ProductoService.java
@Transactional(readOnly = true)
public Page<ProductoDTO> getAllProductos(Pageable pageable) {
    return productoRepository.findAll(pageable)
            .map(this::toDTO);
}

@Transactional(readOnly = true)
public Page<ProductoDTO> getProductosActivos(Pageable pageable) {
    return productoRepository.findByActivoTrue(pageable)
            .map(this::toDTO);
}

@Transactional(readOnly = true)
public Page<ProductoDTO> getByCategoria(String categoria, Pageable pageable) {
    return productoRepository.findByCategoria(categoria, pageable)
            .map(this::toDTO);
}
```

3. Modificar controllers:
```java
// ProductoController.java
@GetMapping
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
public ResponseEntity<Page<ProductoDTO>> getAllProductos(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "id,desc") String[] sort) {

    Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
    return ResponseEntity.ok(productoService.getAllProductos(pageable));
}

private Sort.Order[] parseSort(String[] sortParams) {
    return Arrays.stream(sortParams)
            .map(s -> {
                String[] parts = s.split(",");
                String property = parts[0];
                Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc")
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;
                return new Sort.Order(direction, property);
            })
            .toArray(Sort.Order[]::new);
}
```

4. Frontend - Actualizar API calls:
```typescript
// frontend/src/api/productos.api.ts
export const productosApi = {
  getAll: async (page = 0, size = 20, sort = 'id,desc'): Promise<Page<Producto>> => {
    const response = await api.get(`/productos?page=${page}&size=${size}&sort=${sort}`);
    return response.data;
  },

  // ...
};

// Tipos
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
```

5. Frontend - Componente de paginación:
```tsx
// ProductosPage.tsx
const [page, setPage] = useState(0);
const [size, setSize] = useState(20);

const { data: productosPage, isLoading } = useQuery({
  queryKey: ['productos', page, size],
  queryFn: () => productosApi.getAll(page, size),
});

// Renderizar paginación
<div className="flex justify-between items-center mt-4">
  <button
    disabled={productosPage?.first}
    onClick={() => setPage(p => p - 1)}
  >
    Anterior
  </button>

  <span>
    Página {productosPage?.number + 1} de {productosPage?.totalPages}
  </span>

  <button
    disabled={productosPage?.last}
    onClick={() => setPage(p => p + 1)}
  >
    Siguiente
  </button>
</div>
```

**Aplicar a:**
- ProductoService/Controller
- TransaccionService/Controller
- EmpleadoService/Controller
- EventoService/Controller
- MovimientoStockService/Controller
- Todos los endpoints con listas grandes

---

### TAREA-017: Implementar Auditoría de Cambios
**Prioridad:** MEDIA
**Estimación:** 8 horas
**Ubicación:** Entidades críticas

**Problema:**
No se registra quién modificó qué y cuándo en tablas críticas (Transaccion, Producto, etc.).

**Solución:**

1. Habilitar JPA Auditing:
```java
// backend/src/main/java/com/club/management/ClubManagementApplication.java
@SpringBootApplication
@EnableJpaAuditing  // ← Agregar
public class ClubManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(ClubManagementApplication.class, args);
    }
}
```

2. Crear AuditorAware:
```java
// backend/src/main/java/com/club/management/config/AuditorAwareImpl.java
package com.club.management.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuditorAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.of("SYSTEM");
        }

        return Optional.of(authentication.getName());
    }
}
```

3. Configurar auditing:
```java
// backend/src/main/java/com/club/management/config/JpaConfig.java
package com.club.management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return new AuditorAwareImpl();
    }
}
```

4. Agregar campos de auditoría a entidades:
```java
// Transaccion.java
@Entity
@Table(name = "transacciones")
@Data
@EntityListeners(AuditingEntityListener.class)  // ← Agregar
public class Transaccion {

    // ... campos existentes ...

    @CreatedBy
    @Column(name = "creado_por", updatable = false)
    private String creadoPor;

    @LastModifiedBy
    @Column(name = "modificado_por")
    private String modificadoPor;

    @CreatedDate
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @LastModifiedDate
    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;
}
```

5. Crear migraciones para agregar campos:
```sql
-- V013__add_audit_fields.sql
ALTER TABLE transacciones ADD COLUMN creado_por VARCHAR(100);
ALTER TABLE transacciones ADD COLUMN modificado_por VARCHAR(100);

ALTER TABLE productos ADD COLUMN creado_por VARCHAR(100);
ALTER TABLE productos ADD COLUMN modificado_por VARCHAR(100);
ALTER TABLE productos ADD COLUMN actualizado_por VARCHAR(100);

ALTER TABLE empleados ADD COLUMN creado_por VARCHAR(100);
ALTER TABLE empleados ADD COLUMN modificado_por VARCHAR(100);

ALTER TABLE eventos ADD COLUMN creado_por VARCHAR(100);
ALTER TABLE eventos ADD COLUMN modificado_por VARCHAR(100);

-- Índices para búsquedas de auditoría
CREATE INDEX idx_transacciones_creado_por ON transacciones(creado_por);
CREATE INDEX idx_productos_modificado_por ON productos(modificado_por);
CREATE INDEX idx_empleados_creado_por ON empleados(creado_por);
CREATE INDEX idx_eventos_creado_por ON eventos(creado_por);
```

**Aplicar a entidades críticas:**
- Transaccion
- Producto
- Empleado
- Evento
- JornadaTrabajo
- Nomina
- MovimientoStock

---

### TAREA-018: Optimizar Queries N+1
**Prioridad:** MEDIA
**Estimación:** 6 horas
**Ubicación:** Repositorios con relaciones LAZY

**Problema:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "proveedor_id")
private Proveedor proveedor;
```

Sin `JOIN FETCH`, causa N+1 queries al acceder a la relación.

**Solución:**

1. Agregar queries con JOIN FETCH:
```java
// ProductoRepository.java
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.proveedor")
    List<Producto> findAllWithProveedor();

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.proveedor WHERE p.activo = true")
    List<Producto> findByActivoTrueWithProveedor();

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.proveedor WHERE p.id = :id")
    Optional<Producto> findByIdWithProveedor(@Param("id") Long id);
}

// TransaccionRepository.java
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    @Query("SELECT t FROM Transaccion t " +
           "LEFT JOIN FETCH t.categoria " +
           "LEFT JOIN FETCH t.evento " +
           "LEFT JOIN FETCH t.proveedor")
    List<Transaccion> findAllWithRelations();

    @Query("SELECT t FROM Transaccion t " +
           "LEFT JOIN FETCH t.categoria " +
           "LEFT JOIN FETCH t.evento " +
           "WHERE t.fecha BETWEEN :inicio AND :fin")
    List<Transaccion> findByFechaBetweenWithRelations(
        @Param("inicio") LocalDate inicio,
        @Param("fin") LocalDate fin
    );
}

// MovimientoStockRepository.java
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {

    @Query("SELECT m FROM MovimientoStock m " +
           "LEFT JOIN FETCH m.producto " +
           "LEFT JOIN FETCH m.evento " +
           "LEFT JOIN FETCH m.proveedor " +
           "LEFT JOIN FETCH m.usuario " +
           "WHERE m.producto.id = :productoId " +
           "ORDER BY m.fechaMovimiento DESC")
    List<MovimientoStock> findByProductoIdWithRelations(@Param("productoId") Long productoId);
}
```

2. Usar @EntityGraph como alternativa:
```java
// ProductoRepository.java
@EntityGraph(attributePaths = {"proveedor"})
List<Producto> findAll();

@EntityGraph(attributePaths = {"proveedor"})
Optional<Producto> findById(Long id);
```

3. Activar logging para detectar N+1:
```yaml
# application-dev.yml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    org.hibernate.stat: DEBUG

spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
        format_sql: true
```

4. Test de N+1 queries:
```java
// ProductoServiceTest.java
@Test
void testNoNPlusOneQueries() {
    // Arrange
    Statistics stats = sessionFactory.getStatistics();
    stats.clear();
    stats.setStatisticsEnabled(true);

    // Act
    List<ProductoDTO> productos = productoService.getAllProductos();

    // Assert
    long queryCount = stats.getPrepareStatementCount();

    // Debe ser 1 query (o 2 máximo), no N+1
    assertThat(queryCount).isLessThanOrEqualTo(2);
    assertThat(productos).isNotEmpty();
}
```

---

### TAREA-019: Agregar Índices de BD Faltantes
**Prioridad:** MEDIA
**Estimación:** 2 horas
**Ubicación:** Migraciones Flyway

**Problema:**
Columnas frecuentemente consultadas sin índices: `fecha`, `fecha_movimiento`, etc.

**Solución:**

Crear nueva migración:
```sql
-- V014__add_missing_indexes.sql

-- Transacciones: búsquedas por fecha son MUY frecuentes
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX idx_transacciones_fecha_tipo ON transacciones(fecha, tipo);
CREATE INDEX idx_transacciones_evento_id ON transacciones(evento_id);

-- Movimientos Stock: búsquedas por fecha y producto
CREATE INDEX idx_movimientos_fecha ON movimientos_stock(fecha_movimiento);
CREATE INDEX idx_movimientos_producto_fecha ON movimientos_stock(producto_id, fecha_movimiento DESC);
CREATE INDEX idx_movimientos_tipo ON movimientos_stock(tipo_movimiento);

-- Jornadas Trabajo: búsquedas por empleado y fecha
CREATE INDEX idx_jornadas_empleado_fecha ON jornadas_trabajo(empleado_id, fecha_jornada DESC);
CREATE INDEX idx_jornadas_fecha_rango ON jornadas_trabajo(fecha_jornada);
CREATE INDEX idx_jornadas_evento_id ON jornadas_trabajo(evento_id);
CREATE INDEX idx_jornadas_pagado ON jornadas_trabajo(pagado) WHERE pagado = false;

-- Nóminas: búsquedas por mes y empleado
CREATE INDEX idx_nominas_mes_anio ON nominas(mes, anio);
CREATE INDEX idx_nominas_empleado_periodo ON nominas(empleado_id, anio, mes);

-- Eventos: búsquedas por fecha y estado
CREATE INDEX idx_eventos_fecha_inicio ON eventos(fecha_inicio);
CREATE INDEX idx_eventos_estado ON eventos(estado);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
CREATE INDEX idx_eventos_fecha_estado ON eventos(fecha_inicio, estado);

-- Productos: búsquedas por categoría y stock
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_bajo_stock ON productos(stock_actual, stock_minimo)
    WHERE stock_actual < stock_minimo;

-- Empleados: búsquedas por departamento y estado
CREATE INDEX idx_empleados_departamento ON empleados(departamento);
CREATE INDEX idx_empleados_cargo ON empleados(cargo);
CREATE INDEX idx_empleados_activo ON empleados(activo);

COMMENT ON INDEX idx_transacciones_fecha IS 'Optimiza búsquedas de transacciones por rango de fechas';
COMMENT ON INDEX idx_movimientos_producto_fecha IS 'Optimiza historial de movimientos por producto';
COMMENT ON INDEX idx_jornadas_empleado_fecha IS 'Optimiza consultas de jornadas por empleado';
```

**Verificar impacto de índices:**
```sql
-- Antes de crear índice
EXPLAIN ANALYZE
SELECT * FROM transacciones
WHERE fecha BETWEEN '2025-01-01' AND '2025-12-31';

-- Después de crear índice (debe usar Index Scan)
EXPLAIN ANALYZE
SELECT * FROM transacciones
WHERE fecha BETWEEN '2025-01-01' AND '2025-12-31';
```

---

### TAREA-020: Frontend - Remover cast a `any` en import.meta.env
**Prioridad:** MEDIA
**Estimación:** 15 minutos
**Ubicación:** `frontend/src/api/axios.ts:3`

**Problema:**
```typescript
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';
```

**Solución:**

1. Crear archivo de tipos de entorno:
```typescript
// frontend/src/vite-env.d.ts (actualizar)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Agregar otras variables de entorno aquí
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

2. Actualizar axios.ts:
```typescript
// frontend/src/api/axios.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... resto del código
```

---

### TAREA-021: Actualizar ROADMAP_COMPLETO.md
**Prioridad:** MEDIA
**Estimación:** 30 minutos
**Ubicación:** `ROADMAP_COMPLETO.md`

**Problema:**
- ProductoModal existe pero el roadmap dice que falta (línea 298)
- Migraciones V010 y V011 existen pero no están documentadas
- Porcentajes de completitud incorrectos

**Solución:**

Actualizar `ROADMAP_COMPLETO.md`:

```markdown
# Línea 6: Actualizar número de migraciones
**Base de datos:** V011 (11 migraciones)

# Línea 298-304: Actualizar estado de ProductoModal
### ✅ Productos - **100%** ✅
**Backend:**
- ✅ ProductoController completo
- ✅ ProductoService
- ✅ ProductoRepository
- ✅ ProductoCalculationService (cálculos de ocio nocturno)
- ✅ CRUD completo
- ✅ Categorías dinámicas
- ✅ Stock actual/mínimo/máximo
- ✅ Precio compra/venta
- ✅ Cálculo de margen
- ✅ Modelo de ocio nocturno completo
- ✅ Productos bajo stock query

**Frontend:**
- ✅ ProductosPage con tabla
- ✅ ProductoModal completo (768 líneas) ✅✅✅
- ✅ Resumen de alertas (visual)
- ✅ Filtros por categoría
- ✅ Exportación Excel
- ✅ Cálculos en tiempo real
- ✅ Modal de detalles
- ✅ Historial de movimientos por producto

**Endpoints:** 14/14 ✅
**Datos:** 28 productos de ejemplo
**Completitud:** Backend 100% | Frontend 100% ✅

# Línea 438: Actualizar número de migraciones
- **Migraciones:** 11 (V001 - V011)

# Línea 279: Actualizar porcentaje de Inventario
## ✅ FASE 5: INVENTARIO - **80% COMPLETADO** (actualizado)
```

Agregar en sección de migraciones:
```markdown
# Línea 438: Después de V009
- **V010:** Tabla evento_productos para relación eventos-productos
- **V011:** Campos de pricing para modelo de ocio nocturno
```

---

### TAREA-022: Documentar API con Swagger Completo
**Prioridad:** MEDIA
**Estimación:** 4 horas
**Ubicación:** Todos los controllers

**Problema:**
Solo algunos endpoints tienen `@Operation`, falta documentación completa.

**Solución:**

Agregar anotaciones Swagger a todos los endpoints:

```java
// ProductoController.java
@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "API de gestión de productos e inventario")
public class ProductoController {

    @Operation(
        summary = "Listar todos los productos",
        description = "Obtiene la lista completa de productos con paginación",
        responses = {
            @ApiResponse(responseCode = "200", description = "Lista obtenida correctamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado")
        }
    )
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<Page<ProductoDTO>> getAllProductos(
            @Parameter(description = "Número de página (0-indexed)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Tamaño de página")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Ordenamiento (ej: 'nombre,asc' o 'precio,desc')")
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        return ResponseEntity.ok(productoService.getAllProductos(pageable));
    }

    @Operation(
        summary = "Crear nuevo producto",
        description = "Crea un nuevo producto en el inventario con validaciones completas",
        responses = {
            @ApiResponse(responseCode = "201", description = "Producto creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "409", description = "Código de producto ya existe")
        }
    )
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<ProductoDTO> crearProducto(
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Datos del producto a crear",
                required = true
            )
            ProductoFormData formData) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productoService.crearProducto(formData));
    }

    // ... resto de endpoints con documentación similar
}
```

Configurar Swagger UI:
```java
// backend/src/main/java/com/club/management/config/OpenApiConfig.java
package com.club.management.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Club Management API")
                        .version("0.1.0")
                        .description("Sistema integral de gestión para discoteca - API REST completa")
                        .contact(new Contact()
                                .name("Club Management Team")
                                .email("support@clubmanagement.com"))
                        .license(new License()
                                .name("Uso Privado")
                                .url("https://clubmanagement.com/license")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Ingresar token JWT obtenido del endpoint /api/auth/login")));
    }
}
```

**Aplicar a todos los controllers:**
- AuthenticationController
- ProductoController
- TransaccionController
- EmpleadoController
- EventoController
- JornadaTrabajoController
- NominaController
- MovimientoStockController
- AlertaStockController
- AnalyticsController
- DashboardController
- ReportController
- UsuarioController
- ProveedorController
- CategoriaTransaccionController

---

### TAREA-023: Implementar Control de Concurrencia Optimista
**Prioridad:** MEDIA
**Estimación:** 3 horas
**Ubicación:** Entidades con actualizaciones concurrentes

**Problema:**
Sin control de versión, dos usuarios pueden sobrescribirse cambios simultáneos.

**Solución:**

1. Agregar campo de versión a entidades:
```java
// Producto.java
@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version  // ← Agregar
    @Column(name = "version")
    private Long version;

    // ... resto de campos
}
```

2. Crear migración:
```sql
-- V015__add_version_control.sql
ALTER TABLE productos ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;
ALTER TABLE transacciones ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;
ALTER TABLE empleados ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;
ALTER TABLE eventos ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;
ALTER TABLE movimientos_stock ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;

COMMENT ON COLUMN productos.version IS 'Control de concurrencia optimista';
COMMENT ON COLUMN transacciones.version IS 'Control de concurrencia optimista';
```

3. Manejar excepciones de concurrencia:
```java
// GlobalExceptionHandler.java - Agregar
@ExceptionHandler(OptimisticLockingFailureException.class)
public ResponseEntity<ErrorResponse> handleOptimisticLocking(
        OptimisticLockingFailureException ex, WebRequest request) {
    log.warn("Optimistic locking failure: {}", ex.getMessage());
    ErrorResponse error = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            "El registro fue modificado por otro usuario. Por favor, recargue y vuelva a intentar.",
            LocalDateTime.now(),
            request.getDescription(false)
    );
    return new ResponseEntity<>(error, HttpStatus.CONFLICT);
}
```

4. Frontend - Manejar error 409:
```typescript
// En el manejo de errores de axios
if (error.response?.status === 409) {
  notify.error('El registro fue modificado por otro usuario. Se recargará la información.');
  // Refrescar datos
  queryClient.invalidateQueries(['productos']);
}
```

**Aplicar a:**
- Producto
- Transaccion
- Empleado
- Evento
- MovimientoStock
- Nomina
- JornadaTrabajo

---

### TAREA-024: Cachear Cálculos Frecuentes en Entidades
**Prioridad:** MEDIA
**Estimación:** 4 horas
**Ubicación:** `Producto.java`, métodos @Transient

**Problema:**
Métodos `@Transient` calculan valores en cada acceso:
```java
@Transient
public BigDecimal getMargenBeneficio() {
    // Cálculos complejos en cada llamada
}
```

En consultas masivas (listar 1000 productos), esto es ineficiente.

**Solución:**

**Opción 1: Triggers de BD para cálculos** (Recomendado)
```sql
-- V016__add_calculated_triggers.sql

-- Ya existe en V011 para productos, verificar que funciona:
CREATE OR REPLACE FUNCTION actualizar_calculos_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- Unidades teóricas
    IF NEW.capacidad_ml IS NOT NULL AND NEW.ml_por_servicio IS NOT NULL
       AND NEW.ml_por_servicio > 0 THEN
        NEW.unidades_teoricas := NEW.capacidad_ml / NEW.ml_por_servicio;
    END IF;

    -- Unidades reales (con merma)
    IF NEW.unidades_teoricas IS NOT NULL AND NEW.factor_merma IS NOT NULL THEN
        NEW.unidades_reales := NEW.unidades_teoricas * (1 - NEW.factor_merma / 100);
    END IF;

    -- Ingreso total estimado
    IF NEW.tipo_venta = 'BOTELLA' THEN
        NEW.ingreso_total_estimado := NEW.precio_venta;
    ELSIF NEW.unidades_reales IS NOT NULL THEN
        NEW.ingreso_total_estimado := NEW.unidades_reales * NEW.precio_venta;
    END IF;

    -- Beneficio unitario
    IF NEW.ingreso_total_estimado IS NOT NULL THEN
        NEW.beneficio_unitario := NEW.ingreso_total_estimado - NEW.precio_compra;
    END IF;

    -- Margen porcentaje
    IF NEW.precio_compra > 0 AND NEW.beneficio_unitario IS NOT NULL THEN
        NEW.margen_porcentaje := (NEW.beneficio_unitario / NEW.precio_compra) * 100;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calculos_producto
    BEFORE INSERT OR UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_calculos_producto();
```

**Opción 2: Spring Cache**
```java
// CacheConfig.java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "productos", "transacciones", "empleados"
        );
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000));
        return cacheManager;
    }
}

// ProductoService.java
@Cacheable(value = "productos", key = "#id")
public ProductoDTO getProductoById(Long id) {
    // ...
}

@CacheEvict(value = "productos", key = "#id")
public ProductoDTO actualizarProducto(Long id, ProductoFormData formData) {
    // ...
}
```

---

### TAREA-025: Desactivar show-sql en DEV por Defecto
**Prioridad:** MEDIA
**Estimación:** 5 minutos
**Ubicación:** `application.yml:24`

**Problema:**
```yaml
jpa:
  show-sql: true  # Genera muchos logs en desarrollo
```

**Solución:**

```yaml
# application-dev.yml
spring:
  jpa:
    show-sql: false  # ← Cambiar a false
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true

# Para debugging específico, usar nivel de logging:
logging:
  level:
    org.hibernate.SQL: INFO  # ← INFO en lugar de DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: INFO  # ← INFO
```

Crear profile de debugging:
```yaml
# application-debug.yml
spring:
  config:
    activate:
      on-profile: debug
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

**Uso:**
```bash
# Normal development
./mvnw spring-boot:run

# Debug SQL
./mvnw spring-boot:run -Dspring-boot.run.profiles=debug
```

---

### TAREA-026: Implementar Blacklist de Tokens JWT
**Prioridad:** MEDIA
**Estimación:** 6 horas
**Ubicación:** `AuthenticationService.java`, nueva funcionalidad

**Problema:**
Si se desactiva un usuario con token válido, puede seguir usándolo hasta expiración (24h).

**Solución:**

1. Crear tabla de tokens revocados:
```sql
-- V017__create_revoked_tokens.sql
CREATE TABLE revoked_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NOT NULL,
    reason VARCHAR(255)
);

CREATE INDEX idx_revoked_tokens_jti ON revoked_tokens(token_jti);
CREATE INDEX idx_revoked_tokens_username ON revoked_tokens(username);
CREATE INDEX idx_revoked_tokens_expiry ON revoked_tokens(expiry_date);

COMMENT ON TABLE revoked_tokens IS 'Tokens JWT revocados manualmente';
COMMENT ON COLUMN revoked_tokens.token_jti IS 'JWT ID (claim jti) único del token';
```

2. Crear entidad y repositorio:
```java
// RevokedToken.java
@Entity
@Table(name = "revoked_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevokedToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_jti", unique = true, nullable = false)
    private String tokenJti;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "revoked_at", nullable = false)
    private LocalDateTime revokedAt;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(length = 255)
    private String reason;
}

// RevokedTokenRepository.java
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {
    boolean existsByTokenJti(String tokenJti);

    @Query("DELETE FROM RevokedToken r WHERE r.expiryDate < :now")
    @Modifying
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
}
```

3. Modificar JwtTokenProvider para incluir JTI:
```java
// JwtTokenProvider.java
public String generateToken(Authentication authentication) {
    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
    return generateTokenFromUsername(userDetails.getUsername());
}

public String generateTokenFromUsername(String username) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpiration);
    String jti = UUID.randomUUID().toString();  // ← Agregar JTI único

    return Jwts.builder()
            .setSubject(username)
            .setId(jti)  // ← Agregar claim JTI
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
}

public String getJtiFromToken(String token) {
    Claims claims = Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();

    return claims.getId();  // Obtener JTI
}
```

4. Verificar token revocado en filtro:
```java
// JwtAuthenticationFilter.java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {
    try {
        String jwt = getJwtFromRequest(request);

        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

            // ← VERIFICAR SI EL TOKEN ESTÁ REVOCADO
            String jti = tokenProvider.getJtiFromToken(jwt);
            if (revokedTokenRepository.existsByTokenJti(jti)) {
                logger.warn("Attempted use of revoked token: {}", jti);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Token revocado\"}");
                return;
            }

            String username = tokenProvider.getUsernameFromToken(jwt);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Verificar usuario activo
            if (!userDetails.isEnabled()) {
                logger.warn("Usuario inactivo intentó acceder: {}", username);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Usuario inactivo\"}");
                return;
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    } catch (Exception ex) {
        logger.error("Could not set user authentication in security context", ex);
    }

    filterChain.doFilter(request, response);
}
```

5. Crear servicio de revocación:
```java
// TokenRevocationService.java
@Service
@RequiredArgsConstructor
@Transactional
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public void revokeToken(String token, String reason) {
        String jti = jwtTokenProvider.getJtiFromToken(token);
        String username = jwtTokenProvider.getUsernameFromToken(token);

        Claims claims = Jwts.parser()
                .verifyWith(jwtTokenProvider.getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        LocalDateTime expiryDate = LocalDateTime.ofInstant(
                claims.getExpiration().toInstant(),
                ZoneId.systemDefault()
        );

        RevokedToken revokedToken = RevokedToken.builder()
                .tokenJti(jti)
                .username(username)
                .revokedAt(LocalDateTime.now())
                .expiryDate(expiryDate)
                .reason(reason)
                .build();

        revokedTokenRepository.save(revokedToken);
    }

    public void revokeAllUserTokens(String username, String reason) {
        // Implementar si se necesita revocar todos los tokens de un usuario
        // (requeriría almacenar todos los tokens activos)
    }

    @Scheduled(cron = "0 0 2 * * ?")  // 2 AM cada día
    public void cleanupExpiredTokens() {
        revokedTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}
```

6. Endpoint de logout con revocación:
```java
// AuthenticationController.java
@PostMapping("/logout")
@Operation(summary = "Logout", description = "Cierra sesión y revoca el token actual")
public ResponseEntity<Void> logout(HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        tokenRevocationService.revokeToken(token, "User logout");
    }
    return ResponseEntity.noContent().build();
}
```

---

### TAREA-027: Protección XSS en Responses
**Prioridad:** MEDIA
**Estimación:** 3 horas
**Ubicación:** Configuración de seguridad

**Problema:**
No hay sanitización de HTML en respuestas, potencial XSS.

**Solución:**

1. Configurar Content-Security-Policy:
```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // ... configuración existente ...

        .headers(headers -> headers
            // Content Security Policy
            .contentSecurityPolicy(csp ->
                csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline'; " +  // Necesario para React
                    "style-src 'self' 'unsafe-inline'; " +   // Necesario para Tailwind
                    "img-src 'self' data: https:; " +
                    "font-src 'self' data:; " +
                    "connect-src 'self'; " +
                    "frame-ancestors 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self'"
                )
            )
            // XSS Protection
            .xssProtection(xss -> xss
                .headerValue("1; mode=block")
            )
            // Prevent MIME sniffing
            .contentTypeOptions(contentType ->
                contentType.disable()
            )
            // Prevent clickjacking
            .frameOptions(frame ->
                frame.deny()
            )
            // HSTS
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000)
            )
        );

    return http.build();
}
```

2. Sanitizar HTML en inputs:
```java
// HtmlSanitizer.java
@Component
public class HtmlSanitizer {

    private final Policy policy = new HtmlPolicyBuilder()
            .allowElements("b", "i", "u", "strong", "em")
            .toFactory();

    public String sanitize(String input) {
        if (input == null) {
            return null;
        }
        return policy.sanitize(input);
    }
}

// Agregar dependencia en pom.xml:
<dependency>
    <groupId>com.googlecode.owasp-java-html-sanitizer</groupId>
    <artifactId>owasp-java-html-sanitizer</artifactId>
    <version>20220608.1</version>
</dependency>
```

3. Usar en servicios donde se acepte HTML:
```java
// ProductoService.java
@Autowired
private HtmlSanitizer htmlSanitizer;

public ProductoDTO crearProducto(ProductoFormData formData) {
    // Sanitizar campos de texto libre
    formData.setDescripcion(htmlSanitizer.sanitize(formData.getDescripcion()));
    formData.setNotas(htmlSanitizer.sanitize(formData.getNotas()));

    // ... resto del código
}
```

---

## 🟢 TAREAS BAJAS (Mejoras Continuas)

### TAREA-028: Agregar ESLint/Prettier Enforcement en CI/CD
**Prioridad:** BAJA
**Estimación:** 2 horas
**Ubicación:** GitHub Actions, configuración de CI/CD

**Solución:**

1. Crear workflow de GitHub Actions:
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Cache Maven packages
        uses: actions/cache@v3
        with:
          path: ~/.m2
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}

      - name: Run tests
        run: cd backend && ./mvnw clean verify

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: backend/target/site/jacoco/jacoco.xml
          flags: backend

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Lint
        run: cd frontend && npm run lint

      - name: Type check
        run: cd frontend && npm run type-check

      - name: Run tests
        run: cd frontend && npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: frontend/coverage/coverage-final.json
          flags: frontend

  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: docker-compose -f docker-compose.prod.yml build
```

2. Agregar script de type-check al frontend:
```json
// frontend/package.json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

3. Configurar pre-commit hooks:
```bash
# Instalar husky
cd frontend
npm install -D husky lint-staged

# Configurar husky
npx husky install

# Crear pre-commit hook
npx husky add .husky/pre-commit "cd frontend && npm run lint-staged"
```

```json
// frontend/package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

### TAREA-029: Configurar Cobertura Mínima Obligatoria
**Prioridad:** BAJA
**Estimación:** 30 minutos
**Ubicación:** `pom.xml`, `package.json`

**Solución:**

1. Backend - JaCoCo:
```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <!-- ← AGREGAR: Check de cobertura mínima -->
        <execution>
            <id>jacoco-check</id>
            <phase>verify</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.60</minimum>  <!-- 60% mínimo -->
                            </limit>
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.50</minimum>  <!-- 50% mínimo -->
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

2. Frontend - Vitest:
```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // ← AGREGAR: Thresholds de cobertura
      lines: 60,
      functions: 60,
      branches: 50,
      statements: 60,
      exclude: [
        'node_modules/',
        'src/main.tsx',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types/**',
      ],
    },
  },
});
```

El build fallará si no se alcanza la cobertura mínima.

---

### TAREA-030: Configurar Monitoreo con Prometheus
**Prioridad:** BAJA
**Estimación:** 4 horas
**Ubicación:** Nueva configuración

**Solución:**

1. Habilitar métricas de Prometheus:
```yaml
# application-prod.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true
    tags:
      application: ${spring.application.name}
```

2. Configurar Prometheus:
```yaml
# prometheus.yml (nuevo archivo)
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'club-management'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8080']
```

3. Agregar a docker-compose.prod.yml:
```yaml
# docker-compose.prod.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - club_network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - club_network
    restart: unless-stopped
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

4. Crear métricas custom:
```java
// backend/src/main/java/com/club/management/config/MetricsConfig.java
@Configuration
public class MetricsConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
                .commonTags("application", "club-management");
    }
}

// Usar en servicios:
@Service
@RequiredArgsConstructor
public class ProductoService {

    private final MeterRegistry meterRegistry;

    public ProductoDTO crearProducto(ProductoFormData formData) {
        Counter counter = meterRegistry.counter("productos.created");
        counter.increment();

        // ... lógica de creación
    }
}
```

---

### TAREA-031: Implementar Logs Centralizados (ELK Stack)
**Prioridad:** BAJA
**Estimación:** 6 horas
**Ubicación:** Nueva configuración

**Solución:**

1. Agregar Logback configuración:
```xml
<!-- backend/src/main/resources/logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>/app/logs/club-management.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>/app/logs/club-management-%d{yyyy-MM-dd}.log</fileNamePattern>
                <maxHistory>30</maxHistory>
                <totalSizeCap>1GB</totalSizeCap>
            </rollingPolicy>
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <customFields>{"app":"club-management"}</customFields>
            </encoder>
        </appender>

        <root level="INFO">
            <appender-ref ref="FILE"/>
        </root>
    </springProfile>
</configuration>
```

2. Agregar dependencia:
```xml
<!-- pom.xml -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

3. Configurar ELK en docker-compose:
```yaml
# docker-compose-monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - ./logs:/logs
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

---

### TAREA-032: Crear Documentación de Contribución
**Prioridad:** BAJA
**Estimación:** 2 horas
**Ubicación:** Nuevo archivo CONTRIBUTING.md

**Solución:**

```markdown
# CONTRIBUTING.md

# Guía de Contribución

## Configuración del Entorno

### Requisitos
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Git

### Setup Local
\`\`\`bash
# 1. Clonar repositorio
git clone <repo-url>
cd club-management

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar base de datos
docker-compose up -d postgres

# 4. Backend
cd backend
./mvnw spring-boot:run

# 5. Frontend
cd frontend
npm install
npm run dev
\`\`\`

## Convenciones de Código

### Backend (Java)
- Usar Lombok para reducir boilerplate
- Constructor injection en lugar de field injection
- Excepciones custom en lugar de RuntimeException
- Validaciones Jakarta en entidades y DTOs
- @Transactional en servicios con escritura

### Frontend (TypeScript)
- Componentes funcionales con hooks
- TanStack Query para API calls
- Zod para validaciones de formularios
- Tailwind para estilos (sin CSS inline)

## Git Workflow

### Branches
- `main` - Producción estable
- `develop` - Development branch
- `feature/nombre-feature` - Nuevas funcionalidades
- `bugfix/nombre-bug` - Correcciones de bugs
- `hotfix/nombre-hotfix` - Fixes urgentes en producción

### Commits
Seguir Conventional Commits:
\`\`\`
feat: Agregar endpoint de exportación de nóminas
fix: Corregir cálculo de horas nocturnas
docs: Actualizar README con instrucciones de deploy
refactor: Migrar a constructor injection
test: Agregar tests para ProductoService
\`\`\`

### Pull Requests
1. Crear branch desde `develop`
2. Hacer commits descriptivos
3. Ejecutar tests antes de PR
4. Crear PR con descripción clara
5. Esperar review y aprobación

## Testing

### Backend
\`\`\`bash
cd backend
./mvnw test                 # Tests unitarios
./mvnw verify              # Tests + cobertura
./mvnw test -Dtest=ClassTest  # Test específico
\`\`\`

Cobertura mínima requerida: **60%**

### Frontend
\`\`\`bash
cd frontend
npm test                   # Tests
npm run test:coverage      # Con cobertura
npm run test:ui            # UI interactiva
\`\`\`

Cobertura mínima requerida: **50%**

## Code Review Checklist

- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] Sin console.log en producción
- [ ] Validaciones en frontend y backend
- [ ] Manejo de errores apropiado
- [ ] Migraciones Flyway si hay cambios de BD
- [ ] Sin warnings de ESLint/SonarLint
- [ ] Build pasa en local

## Seguridad

- ❌ NO commitear secrets (.env, passwords, tokens)
- ✅ Usar variables de entorno
- ✅ Validar inputs en backend
- ✅ Sanitizar HTML en outputs
- ✅ Usar @Valid en controllers

## Contacto

Para dudas: equipo@clubmanagement.com
\`\`\`

---

## 📈 RESUMEN DE PRIORIDADES

### 🔴 INMEDIATO (Esta semana)
1. TAREA-001: Eliminar CORS inseguro
2. TAREA-003: Cambiar password admin
3. TAREA-004: JWT secret fuerte

### 🔴 URGENTE (1-2 semanas)
4. TAREA-002: Implementar tests
5. TAREA-005: Validaciones Jakarta

### 🟠 ALTA (2-4 semanas)
6-15. Tasks 006-015: Excepciones, logging, rate limiting, etc.

### 🟡 MEDIA (1-2 meses)
16-27. Tasks 016-027: Paginación, auditoría, optimizaciones

### 🟢 BAJA (Mejora continua)
28-32. Tasks 028-032: CI/CD, monitoreo, documentación

---

**Última actualización:** 9 de Octubre de 2025
**Total de tareas:** 32
**Estimación total:** ~120-150 horas de trabajo

---
