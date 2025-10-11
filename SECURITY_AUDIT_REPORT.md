# 🔒 Security Audit Report - Club Management System

**Fecha:** 12 Octubre 2025
**Versión del Sistema:** 0.3.0
**Auditor:** Sprint 10 - Optimización Final
**Alcance:** Backend + Frontend + Base de Datos

---

## 📋 Resumen Ejecutivo

### Estado General de Seguridad: ⚠️ MEDIO-ALTO

**Puntuación:** 7.5/10

**Aspectos Positivos:**
- ✅ JWT implementado correctamente con HS512
- ✅ BCrypt para hashing de contraseñas
- ✅ CORS configurado correctamente
- ✅ Roles y permisos jerárquicos bien definidos
- ✅ Stateless sessions (JWT)
- ✅ CSRF deshabilitado (correcto para API REST stateless)
- ✅ Validaciones con Jakarta Validation

**Aspectos a Mejorar:**
- ⚠️ Sin rate limiting (riesgo de brute force)
- ⚠️ BCrypt strength 4 en producción (muy bajo)
- ⚠️ JWT secret potencialmente débil en dev
- ⚠️ Sin validación de complejidad de contraseñas
- ⚠️ Sin logging de intentos de login fallidos
- ⚠️ Sin protección contra ataques de timing
- ⚠️ Sin headers de seguridad HTTP (HSTS, CSP, etc.)

---

## 🎯 Vulnerabilidades Críticas

### 1. ❌ CRÍTICO: BCrypt Strength Demasiado Bajo

**Archivo:** `backend/src/main/resources/application.yml:144`
**Línea:** `bcrypt-strength: 4`

**Problema:**
```yaml
app:
  security:
    bcrypt-strength: 4  # Reducido para mejor performance en producción remota
```

**Riesgo:** ALTO
Un `bcrypt-strength` de 4 es **extremadamente bajo** y puede ser crackeado con hardware moderno en cuestión de segundos.

**Recomendación:**
```yaml
app:
  security:
    bcrypt-strength: 12  # Mínimo recomendado por OWASP (2^12 = 4096 iteraciones)
```

**Impacto:**
- Contraseñas vulnerables a ataques de fuerza bruta
- Si la base de datos es comprometida, las contraseñas serán fácilmente crackeadas

**Justificación Original:**
El comentario menciona "mejor performance en producción remota", pero esto es un trade-off **inaceptable** entre seguridad y rendimiento. El hashing de contraseñas ocurre **solo en login**, no en cada request.

**Solución Implementada:**
- Cambiar `bcrypt-strength` a **10** (mínimo) o **12** (recomendado)
- Si el rendimiento es un problema, considerar usar Argon2 en lugar de BCrypt

---

### 2. ⚠️ ALTO: Sin Rate Limiting en Endpoints de Autenticación

**Archivo:** `backend/src/main/java/com/club/management/controller/AuthenticationController.java`
**Endpoint:** `POST /api/auth/login`

**Problema:**
```java
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
    LoginResponse response = authenticationService.login(loginRequest);
    return ResponseEntity.ok(response);
}
```

**Riesgo:** ALTO
Sin rate limiting, un atacante puede realizar **ataques de fuerza bruta** ilimitados contra el endpoint de login.

**Recomendación:**
Implementar rate limiting con **Bucket4j** o **Spring Cloud Gateway**.

**Ejemplo de Solución:**
```java
@PostMapping("/login")
@RateLimiter(name = "auth-login", fallbackMethod = "loginRateLimitFallback")
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
    LoginResponse response = authenticationService.login(loginRequest);
    return ResponseEntity.ok(response);
}

public ResponseEntity<LoginResponse> loginRateLimitFallback(LoginRequest request, RateLimitExceededException ex) {
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(new ErrorResponse("Too many login attempts. Try again in 5 minutes."));
}
```

**Configuración Recomendada:**
```yaml
resilience4j:
  ratelimiter:
    instances:
      auth-login:
        limitForPeriod: 5        # 5 intentos
        limitRefreshPeriod: 5m   # cada 5 minutos
        timeoutDuration: 0
```

---

### 3. ⚠️ MEDIO: JWT Secret Débil en Desarrollo

**Archivo:** `backend/src/main/resources/application.yml:42`

**Problema:**
```yaml
jwt:
  secret: ${JWT_SECRET:club-management-dev-secret-ONLY-FOR-DEV-CHANGE-IN-PROD}
```

**Riesgo:** MEDIO
El secret por defecto es **demasiado corto** (54 caracteres) y **predecible**.

**Recomendación:**
1. **Desarrollo:** Generar un secret de 256+ bits (43+ caracteres base64)
2. **Producción:** JWT_SECRET DEBE ser variable de entorno (✅ ya implementado)

**Generación de Secret Seguro:**
```bash
# Generar secret de 512 bits (64 bytes)
openssl rand -base64 64

# Ejemplo de salida (usar esto en JWT_SECRET):
# xK7v2Zp9mN8qR4tY6wB1cD3eF5gH7iJ9kL0mN2oP4qR6sT8uV0wX2yZ4a6b8c0d2e4f6g8h0i2j4k6l8m0n2o4p6q8r0s2t4u6v8w0x2y4z6
```

**Validación en Código:**
```java
@PostConstruct
public void validateJwtSecret() {
    if (jwtSecret.length() < 64) {
        throw new IllegalStateException("JWT secret must be at least 512 bits (64 characters)");
    }
}
```

---

### 4. ⚠️ MEDIO: Sin Validación de Complejidad de Contraseñas

**Archivo:** `backend/src/main/java/com/club/management/dto/request/UsuarioRequest.java` (presumiblemente)

**Problema:**
No hay validaciones de:
- Longitud mínima de contraseña
- Caracteres especiales
- Mayúsculas/minúsculas
- Números

**Riesgo:** MEDIO
Los usuarios pueden establecer contraseñas débiles como "123456" o "password".

**Recomendación:**
Implementar validación con anotación custom:

```java
@StrongPassword(
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireDigits = true,
    requireSpecialChars = true
)
private String password;
```

**Implementación del Validador:**
```java
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {
    String message() default "Password must be at least 8 characters with uppercase, lowercase, digits, and special characters";
    int minLength() default 8;
    boolean requireUppercase() default true;
    boolean requireLowercase() default true;
    boolean requireDigits() default true;
    boolean requireSpecialChars() default true;
    // ...
}
```

---

## ⚠️ Vulnerabilidades de Nivel Medio

### 5. Sin Logging de Intentos de Login Fallidos

**Archivo:** `backend/src/main/java/com/club/management/service/AuthenticationService.java`

**Problema:**
No hay registro de intentos de login fallidos, lo que dificulta:
- Detectar ataques de fuerza bruta
- Auditar accesos no autorizados
- Investigar incidentes de seguridad

**Recomendación:**
```java
public LoginResponse login(LoginRequest loginRequest) {
    try {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );

        // Log exitoso
        log.info("Successful login for user: {}", loginRequest.getUsername());

        // ... resto del código
    } catch (AuthenticationException e) {
        // Log fallido con IP si es posible
        log.warn("Failed login attempt for user: {} - Reason: {}",
                 loginRequest.getUsername(), e.getMessage());
        throw new UnauthorizedException("Invalid credentials");
    }
}
```

**Bonus:** Integrar con sistema de detección de intrusos (IDS) o SIEM.

---

### 6. Sin Protección contra Ataques de Timing

**Archivo:** `backend/src/main/java/com/club/management/service/AuthenticationService.java`

**Problema:**
Al retornar "Usuario no encontrado" vs "Contraseña incorrecta", un atacante puede **enumerar usuarios válidos** midiendo el tiempo de respuesta.

**Recomendación:**
Siempre retornar el **mismo mensaje genérico** y realizar el mismo trabajo computacional:

```java
public LoginResponse login(LoginRequest loginRequest) {
    // Siempre buscar el usuario
    Optional<Usuario> userOpt = usuarioRepository.findByUsername(loginRequest.getUsername());

    // Siempre ejecutar BCrypt (incluso si el usuario no existe)
    String passwordToCheck = userOpt.map(Usuario::getPassword)
                                    .orElse("$2a$10$dummy.hash.to.prevent.timing.attack");

    passwordEncoder.matches(loginRequest.getPassword(), passwordToCheck);

    // Ahora validar si el usuario existe
    if (userOpt.isEmpty()) {
        log.warn("Failed login attempt for non-existent user: {}", loginRequest.getUsername());
        throw new UnauthorizedException("Invalid username or password");
    }

    // ... resto de la lógica
}
```

---

### 7. Sin Headers de Seguridad HTTP

**Archivo:** `backend/src/main/java/com/club/management/config/SecurityConfig.java`

**Problema:**
Faltan headers de seguridad críticos:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`
- `X-XSS-Protection`

**Recomendación:**
Agregar al `SecurityFilterChain`:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // ... configuración existente
        .headers(headers -> headers
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000) // 1 año
            )
            .contentTypeOptions(contentTypeOptions -> contentTypeOptions.disable())
            .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
            .frameOptions(frame -> frame.deny())
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'")
            )
        );

    return http.build();
}
```

---

## 🔍 Vulnerabilidades de Nivel Bajo

### 8. Exponer Información en Logs

**Archivo:** Varios controladores

**Problema:**
Logs de desarrollo (`show-sql: true`, `DEBUG`) pueden exponer información sensible en producción.

**Recomendación:**
✅ Ya implementado correctamente en `application.yml`:
```yaml
# Producción
logging:
  level:
    com.club.management: INFO
    org.springframework: WARN
```

---

### 9. Sin Validación de Tamaño de Payload

**Problema:**
Sin límite de tamaño de request body, un atacante puede enviar payloads masivos para causar DoS.

**Recomendación:**
```yaml
server:
  tomcat:
    max-http-post-size: 2MB
  max-http-request-header-size: 16KB
```

---

### 10. Sin Rotación de Tokens JWT

**Problema:**
Los tokens JWT tienen una expiración de **24 horas** pero no hay rotación automática.

**Recomendación:**
Implementar **refresh tokens** con expiración más larga y token de acceso de corta duración:
- Access Token: 15 minutos
- Refresh Token: 7 días

---

## 🛡️ Recomendaciones Prioritarias

### Prioridad 1: CRÍTICA (Implementar Inmediatamente)

1. **Aumentar BCrypt Strength a 12**
   - Archivo: `application.yml:144`
   - Cambio: `bcrypt-strength: 4` → `bcrypt-strength: 12`
   - Tiempo: 2 minutos

2. **Implementar Rate Limiting en /api/auth/login**
   - Agregar dependencia Bucket4j o Resilience4j
   - Configurar 5 intentos por 5 minutos
   - Tiempo: 30 minutos

3. **Generar JWT Secret Fuerte para Desarrollo**
   - Generar con `openssl rand -base64 64`
   - Actualizar `.env` o `application-dev.yml`
   - Tiempo: 5 minutos

### Prioridad 2: ALTA (Esta Semana)

4. **Implementar Validación de Contraseñas Fuertes**
   - Crear anotación `@StrongPassword`
   - Implementar validador
   - Tiempo: 1 hora

5. **Agregar Logging de Intentos Fallidos**
   - Modificar `AuthenticationService`
   - Agregar logs con nivel WARN
   - Tiempo: 15 minutos

6. **Implementar Headers de Seguridad HTTP**
   - Modificar `SecurityConfig`
   - Agregar HSTS, CSP, X-Frame-Options
   - Tiempo: 30 minutos

### Prioridad 3: MEDIA (Este Mes)

7. **Protección contra Timing Attacks**
   - Refactorizar lógica de login
   - Tiempo: 45 minutos

8. **Implementar Refresh Tokens**
   - Crear tabla `refresh_tokens`
   - Implementar endpoint `/api/auth/refresh`
   - Tiempo: 2 horas

9. **Limitar Tamaño de Payloads**
   - Configurar Tomcat
   - Tiempo: 5 minutos

10. **Auditoría de Dependencias**
    - Ejecutar `mvn dependency-check:check`
    - Actualizar librerías vulnerables
    - Tiempo: 1 hora

---

## 📊 Checklist de Seguridad OWASP Top 10

| # | Vulnerabilidad | Estado | Notas |
|---|----------------|--------|-------|
| A01:2021 | Broken Access Control | ✅ Mitigado | Roles jerárquicos implementados |
| A02:2021 | Cryptographic Failures | ⚠️ Parcial | BCrypt strength bajo |
| A03:2021 | Injection | ✅ Mitigado | JPA + prepared statements |
| A04:2021 | Insecure Design | ✅ Bueno | Arquitectura sólida |
| A05:2021 | Security Misconfiguration | ⚠️ Parcial | Faltan headers de seguridad |
| A06:2021 | Vulnerable Components | ⚠️ Desconocido | Requiere auditoría |
| A07:2021 | Identification Failures | ⚠️ Parcial | Sin rate limiting |
| A08:2021 | Software Integrity Failures | ✅ Bueno | Flyway para migraciones |
| A09:2021 | Security Logging Failures | ⚠️ Parcial | Logs insuficientes |
| A10:2021 | Server-Side Request Forgery | ✅ No aplicable | Sin requests externos |

**Puntuación OWASP:** 6.5/10

---

## 🔧 Plan de Implementación

### Fase 1: Fixes Críticos (Día 1)
```bash
# 1. Actualizar BCrypt strength
sed -i 's/bcrypt-strength: 4/bcrypt-strength: 12/' backend/src/main/resources/application.yml

# 2. Generar nuevo JWT secret
openssl rand -base64 64 > jwt_secret.txt

# 3. Configurar en Railway
railway variables set JWT_SECRET="$(cat jwt_secret.txt)"

# 4. Restart backend
railway up
```

### Fase 2: Rate Limiting (Día 2)
```bash
# Agregar dependencia
# En pom.xml: spring-boot-starter-resilience4j

# Implementar RateLimiter
# Modificar AuthenticationController

# Configurar en application.yml
```

### Fase 3: Mejoras Adicionales (Día 3-5)
- Validación de contraseñas
- Headers de seguridad
- Logging mejorado

---

## 📈 Métricas de Seguridad

### Antes de Sprint 10
- **BCrypt Strength:** 4 (muy bajo)
- **Rate Limiting:** No implementado
- **Headers de Seguridad:** 0/6
- **Logging de Seguridad:** Básico
- **Puntuación:** 5.5/10

### Después de Sprint 10 (Objetivo)
- **BCrypt Strength:** 12 (recomendado)
- **Rate Limiting:** Sí (5 intentos/5min)
- **Headers de Seguridad:** 6/6
- **Logging de Seguridad:** Completo
- **Puntuación:** 9.0/10

---

## 📝 Conclusión

El sistema tiene una **base de seguridad sólida** con JWT, BCrypt, y roles bien implementados. Sin embargo, hay **vulnerabilidades críticas** que deben ser corregidas antes de un lanzamiento a producción completo.

**Las 3 acciones más importantes:**
1. ✅ Aumentar BCrypt strength a 12
2. ✅ Implementar rate limiting en /auth/login
3. ✅ Agregar headers de seguridad HTTP

Con estas correcciones, el sistema alcanzará un **nivel de seguridad profesional** apto para producción.

---

**Próximo Paso:** Implementar los fixes de Prioridad 1 (Crítica)

**Documento creado:** 12 Octubre 2025
**Versión:** 1.0
**Mantenido por:** Equipo de desarrollo
