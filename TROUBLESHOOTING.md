# Troubleshooting Guide - Club Management System

Este documento detalla todos los problemas encontrados durante el desarrollo y deployment, sus causas raíz, soluciones aplicadas y el proceso de diagnóstico.

## Tabla de Contenidos

1. [Errores de Deployment en Railway](#errores-de-deployment-en-railway)
2. [Errores de Spring Security](#errores-de-spring-security)
3. [Errores de Base de Datos](#errores-de-base-de-datos)
4. [Errores de CORS](#errores-de-cors)
5. [Optimización de Recursos](#optimización-de-recursos)

---

## Errores de Deployment en Railway

### Error 1: Out of Memory (OOM) - Backend No Inicia

**Fecha:** Octubre 2025

**Síntomas:**
- Backend se reinicia continuamente en Railway
- Los logs muestran que la aplicación nunca llega a "Started ClubManagementApplication"
- Se detiene en la fase de inicialización de Hibernate
- Railway logs muestran: `Out of Memory (OOM)`
- Health endpoint retorna `502 Bad Gateway`

**Logs del Error:**
```
2025-10-10T17:57:31.976Z INFO - o.h.e.t.j.p.i.JtaPlatformInitiator : HHH000489: No JTA platform available
[No más logs después de este punto - aplicación muerta]
```

**Causa Raíz:**
Spring Boot con la siguiente configuración consume demasiada memoria durante el inicio:
- Hibernate ORM con múltiples entidades JPA (15+ tablas)
- Flyway migrations (17 migraciones)
- BCrypt password encoding
- MapStruct DTO mapping
- Múltiples servicios con dependencias inyectadas

Railway free tier o plan básico no proporciona suficiente memoria para iniciar la aplicación con la configuración JVM por defecto.

**Proceso de Diagnóstico:**

1. **Verificar que el problema es de memoria:**
```bash
railway logs -s club-manegament --lines 200
# Buscar "Started ClubManagementApplication" → NO encontrado
# Buscar "Out of Memory" → ENCONTRADO
```

2. **Verificar dónde se detiene el inicio:**
```bash
railway logs -s club-manegament --lines 200 | grep -E "(Starting|Hibernate|HHH)"
# Se detiene después de: "HHH000489: No JTA platform available"
```

3. **Verificar health endpoint:**
```bash
curl https://club-manegament-production.up.railway.app/actuator/health
# Resultado: 502 Bad Gateway (aplicación no corriendo)
```

**Solución:**

Configurar límites de memoria JVM mediante variables de entorno en Railway:

```bash
railway variables --set "JAVA_TOOL_OPTIONS=-Xmx512m -Xms256m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=100" -s club-manegament
```

**Explicación de cada parámetro:**

| Parámetro | Valor | Propósito |
|-----------|-------|-----------|
| `-Xmx512m` | 512MB | Memoria máxima del heap. Limita el uso total de memoria. |
| `-Xms256m` | 256MB | Memoria inicial del heap. Evita múltiples redimensionamientos durante el inicio. |
| `-XX:MaxMetaspaceSize=128m` | 128MB | Limita el espacio de metadatos (clases, métodos, constantes). Hibernate carga muchas clases. |
| `-XX:+UseG1GC` | - | Usa G1 Garbage Collector, más eficiente para aplicaciones con heap limitado. |
| `-XX:MaxGCPauseMillis=100` | 100ms | Limita las pausas de GC a 100ms para mejor rendimiento. |

**Verificación de la Solución:**

```bash
# Esperar nuevo deployment
sleep 60

# Verificar que JVM tome las opciones
railway logs -s club-manegament --lines 50 | grep "JAVA_TOOL_OPTIONS"
# Output: Picked up JAVA_TOOL_OPTIONS: -Xmx512m -Xms256m...

# Verificar que la aplicación inicie completamente
railway logs -s club-manegament --lines 200 | grep "Started ClubManagementApplication"
# Output: Started ClubManagementApplication in 39.302 seconds

# Verificar health endpoint
curl https://club-manegament-production.up.railway.app/actuator/health
# Output: {"status":"UP"}
```

**Resultado:**
✅ Backend ahora inicia correctamente en ~40 segundos
✅ Uso de memoria controlado
✅ No más reinicios por OOM

---

## Errores de Spring Security

### Error 2: HTTP 403 Forbidden en `/api/auth/login`

**Fecha:** Octubre 2025

**Síntomas:**
- Login endpoint retorna `403 Forbidden`
- Usuario no puede autenticarse
- Frontend muestra error: "Failed to load resource: 403"
- Swagger UI también rechaza login
- Backend logs NO muestran que el request llegue al controller

**Request que falla:**
```bash
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Resultado: HTTP 403 Forbidden
```

**Causa Raíz:**

Spring Security 6 cambió la forma en que evalúa los `requestMatchers`. Ahora evalúa **en orden de arriba hacia abajo (top-to-bottom)**, y el **primer matcher que coincide es el que se aplica**.

**Configuración INCORRECTA** (que causaba el error):

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            // ❌ PROBLEMA: Los genéricos están PRIMERO
            .requestMatchers(HttpMethod.POST, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")
            .requestMatchers(HttpMethod.GET, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_LECTURA")

            // ❌ Este NUNCA se evalúa porque /api/auth/login ya coincidió con /api/** arriba
            .requestMatchers("/api/auth/**").permitAll()

            .anyRequest().authenticated()
        );
    return http.build();
}
```

**Flujo del problema:**

```
1. Request: POST /api/auth/login
2. Spring Security evalúa matchers en orden:

   ┌──────────────────────────────────────────────────────────┐
   │ .requestMatchers(HttpMethod.POST, "/api/**")            │
   │   .hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")        │
   │                                                          │
   │ ✅ COINCIDE con /api/auth/login                         │
   │ ❌ Usuario NO tiene token → NO tiene roles              │
   │ 🚫 RESULTADO: 403 Forbidden                             │
   └──────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────┐
   │ .requestMatchers("/api/auth/**").permitAll()            │
   │                                                          │
   │ ❌ NUNCA se evalúa porque ya coincidió arriba           │
   └──────────────────────────────────────────────────────────┘
```

**Proceso de Diagnóstico:**

1. **Verificar que el endpoint existe y está mapeado:**
```bash
# Revisar el controller
grep -r "POST.*auth/login" backend/src/main/java/
# Encontrado: AuthenticationController.java tiene @PostMapping("/login")
```

2. **Verificar logs del backend:**
```bash
railway logs -s club-manegament | grep -i "auth/login"
# NO hay logs del controller ejecutándose
# Conclusión: Spring Security bloquea ANTES de llegar al controller
```

3. **Revisar SecurityConfig.java:**
```bash
cat backend/src/main/java/com/club/management/config/SecurityConfig.java
# Encontrado: requestMatchers genéricos antes de específicos
```

4. **Intentar deshabilitar security temporalmente:**
```java
.authorizeHttpRequests(auth -> auth
    .anyRequest().permitAll()  // TEMPORAL para debugging
)
```
```bash
# Resultado después de deployment: HTTP 500 (no 403)
# Conclusión: Spring Security ERA el problema
```

**Solución:**

Reordenar los `requestMatchers` para que los **paths específicos estén ANTES** de los genéricos:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
                // ✅ CORRECTO: OPTIONS primero para CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ✅ CORRECTO: Endpoints públicos específicos PRIMERO
                .requestMatchers("/api/auth/**").permitAll()  // ← SIN restricción de método
                .requestMatchers("/").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // ✅ CORRECTO: Endpoints protegidos genéricos DESPUÉS
                .requestMatchers(HttpMethod.GET, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_ENCARGADO", "ROLE_RRHH", "ROLE_LECTURA")
                .requestMatchers(HttpMethod.POST, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_ENCARGADO")
                .requestMatchers(HttpMethod.PUT, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")

                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
        )
        .authenticationProvider(authenticationProvider())
        .addFilterAfter(jwtAuthenticationFilter, LogoutFilter.class);

    return http.build();
}
```

**Flujo correcto:**

```
1. Request: POST /api/auth/login
2. Spring Security evalúa matchers en orden:

   ┌──────────────────────────────────────────────────────────┐
   │ .requestMatchers(HttpMethod.OPTIONS, "/**")             │
   │   .permitAll()                                           │
   │                                                          │
   │ ❌ NO coincide (no es OPTIONS)                          │
   └──────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────┐
   │ .requestMatchers("/api/auth/**").permitAll()            │
   │                                                          │
   │ ✅ COINCIDE con /api/auth/login                         │
   │ ✅ permitAll() → No requiere autenticación              │
   │ ✅ RESULTADO: Request pasa al controller                │
   └──────────────────────────────────────────────────────────┘
```

**Archivo modificado:**
```
backend/src/main/java/com/club/management/config/SecurityConfig.java
```

**Commit realizado:**
```bash
git add backend/src/main/java/com/club/management/config/SecurityConfig.java
git commit -m "fix: Restore proper Spring Security configuration with correct requestMatcher order"
git push
```

**Verificación de la Solución:**

```bash
# Probar login
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Output exitoso:
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "username": "admin",
  "email": "admin@clubmanagement.com",
  "rol": "ADMIN"
}
# HTTP Status: 200 ✅
```

**Lección Aprendida:**

En Spring Security 6:
1. **El orden importa**: Siempre colocar matchers específicos ANTES de los genéricos
2. **Primera coincidencia gana**: No se evalúan matchers subsecuentes si uno ya coincidió
3. **Sin restricción de método**: `/api/auth/**` permite ALL methods (GET, POST, etc.)
4. **OPTIONS siempre primero**: Para CORS preflight requests

---

## Errores de Base de Datos

### Error 3: "Cannot commit when autoCommit is enabled"

**Fecha:** Octubre 2025

**Síntomas:**
- Login devuelve `500 Internal Server Error`
- Backend está corriendo (health check OK)
- Error en logs: `org.postgresql.util.PSQLException: Cannot commit when autoCommit is enabled`
- Ocurre en métodos con `@Transactional`

**Stack Trace del Error:**
```
2025-10-10T18:06:52.819Z ERROR - o.a.c.c.C.[.[.[/].[dispatcherServlet]
Servlet.service() for servlet [dispatcherServlet] threw exception
[Request processing failed: org.springframework.orm.jpa.JpaSystemException:
Unable to commit against JDBC Connection] with root cause

org.postgresql.util.PSQLException: Cannot commit when autoCommit is enabled.
	at org.postgresql.jdbc.PgConnection.commit(PgConnection.java:849)
	at com.zaxxer.hikari.pool.ProxyConnection.commit(ProxyConnection.java:368)
	at org.hibernate.resource.jdbc.internal.AbstractLogicalConnectionImplementor.commit
	at org.hibernate.engine.transaction.internal.TransactionImpl.commit
	at org.springframework.orm.jpa.JpaTransactionManager.doCommit
	at org.springframework.transaction.support.AbstractPlatformTransactionManager.processCommit
	at org.springframework.transaction.interceptor.TransactionAspectSupport.commitTransactionAfterReturning
	at com.club.management.service.AuthenticationService$$SpringCGLIB$$0.login
	at com.club.management.controller.AuthenticationController.login
```

**Causa Raíz:**

**HikariCP** (el connection pool usado por Spring Boot) tiene `autoCommit=true` por defecto. Esto significa que cada statement SQL se commitea automáticamente.

**Spring JPA** con `@Transactional` necesita controlar manualmente los commits y rollbacks para garantizar:
- Atomicidad (todo o nada)
- Consistencia de datos
- Rollback en caso de error

**Conflicto:**
```
HikariCP:         autoCommit = true  → Cada SQL se commitea inmediatamente
Spring JPA:       Quiere hacer commit manual al final del método @Transactional
PostgreSQL JDBC:  "No puedes hacer commit si autoCommit está enabled"
```

**Ejemplo del flujo problemático:**

```java
@Service
public class AuthenticationService {

    @Transactional  // ← Spring JPA quiere controlar la transacción
    public LoginResponse login(LoginRequest request) {
        // 1. Spring JPA inicia transacción
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername());

        // 2. HikariCP ejecuta SELECT con autoCommit=true
        //    ❌ PostgreSQL commitea automáticamente

        // 3. Generar token...
        String token = jwtTokenProvider.generateToken(usuario);

        // 4. Spring JPA intenta hacer commit manual
        //    ❌ PostgreSQL dice: "Cannot commit when autoCommit is enabled"

        return new LoginResponse(token, usuario);
    }
}
```

**Proceso de Diagnóstico:**

1. **Verificar que el backend está corriendo:**
```bash
curl https://club-manegament-production.up.railway.app/actuator/health
# Output: {"status":"UP"} ✅
```

2. **Intentar login:**
```bash
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Output: HTTP 500 ❌
```

3. **Revisar logs completos del error:**
```bash
railway logs -s club-manegament --lines 300 | grep -A 50 "ERROR"
# Encontrado: "Cannot commit when autoCommit is enabled"
# Encontrado: Stack trace apunta a AuthenticationService.login()
```

4. **Identificar que es problema de transacciones:**
```bash
# Buscar en stack trace
railway logs -s club-manegament --lines 300 | grep -E "(Transaction|commit|autoCommit)"
# Output: org.springframework.orm.jpa.JpaTransactionManager.doCommit
#         org.postgresql.util.PSQLException: Cannot commit when autoCommit is enabled
```

5. **Revisar configuración de HikariCP:**
```bash
# Verificar application.yml
cat backend/src/main/resources/application.yml | grep -A 10 "hikari"
# NO había configuración explícita de auto-commit
# Conclusión: Usa el default (autoCommit=true)
```

**Solución:**

Configurar HikariCP para deshabilitar `autoCommit` mediante variable de entorno en Railway:

```bash
railway variables --set "SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false" -s club-manegament
```

**Cómo funciona:**

Spring Boot convierte automáticamente variables de entorno en propiedades:
```
SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false
    ↓
spring.datasource.hikari.auto-commit=false
    ↓
HikariCP Config: autoCommit = false
```

**Configuración equivalente en application.yml:**
```yaml
spring:
  datasource:
    hikari:
      auto-commit: false
      connection-timeout: 30000
      maximum-pool-size: 10
```

**Flujo correcto después del fix:**

```java
@Service
public class AuthenticationService {

    @Transactional  // ← Spring JPA controla la transacción
    public LoginResponse login(LoginRequest request) {
        // 1. Spring JPA inicia transacción
        //    HikariCP crea conexión con autoCommit=false ✅

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername());

        // 2. SELECT se ejecuta DENTRO de la transacción
        //    ✅ NO se commitea automáticamente

        // 3. Generar token...
        String token = jwtTokenProvider.generateToken(usuario);

        // 4. Spring JPA hace commit manual
        //    ✅ PostgreSQL permite el commit porque autoCommit=false

        return new LoginResponse(token, usuario);

        // Si hay error en cualquier punto, Spring hace ROLLBACK
    }
}
```

**Verificación de la Solución:**

```bash
# Esperar que Railway haga redeploy automático
sleep 60

# Probar login nuevamente
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Output exitoso:
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc2MDExOTgwMSwiZXhwIjoxNzYwMjA2MjAxfQ.4pkjc0futkeqMH7xDHViqJN9VtiuaEXs_0R-1y4viwbVYhoE6JOLsIt-C4A4Pi97cGVDLYtRqU--VEOdARCF2Q",
  "type": "Bearer",
  "username": "admin",
  "email": "admin@clubmanagement.com",
  "rol": "ADMIN"
}
# HTTP Status: 200 ✅
```

**Verificar que endpoints protegidos también funcionan:**
```bash
# Obtener token del login
TOKEN="eyJhbGciOiJIUzUxMiJ9..."

# Probar endpoint protegido
curl -X GET https://club-manegament-production.up.railway.app/api/productos \
  -H "Authorization: Bearer $TOKEN"

# Output: []
# HTTP Status: 200 ✅
```

**Lección Aprendida:**

- **Siempre deshabilitar autoCommit** cuando uses `@Transactional` en Spring JPA
- **HikariCP defaults** no son óptimos para Spring Boot
- **Transacciones JPA** requieren control manual de commits
- **En producción**: Configurar explícitamente las propiedades de HikariCP

**Configuración recomendada para HikariCP:**

```yaml
spring:
  datasource:
    hikari:
      auto-commit: false                  # ← CRÍTICO para @Transactional
      connection-timeout: 30000           # 30 segundos para obtener conexión
      idle-timeout: 600000                # 10 minutos de idle antes de cerrar
      max-lifetime: 1800000               # 30 minutos de vida máxima
      maximum-pool-size: 10               # Máximo 10 conexiones
      minimum-idle: 5                     # Mínimo 5 conexiones idle
      pool-name: ClubManagementHikariPool
```

---

## Errores de CORS

### Error 4: CORS Policy Blocking XMLHttpRequest

**Fecha:** Octubre 2025

**Síntomas:**
- Frontend puede hacer requests al backend en development (localhost)
- En producción, browser bloquea requests con error de CORS
- Console muestra: "Access to XMLHttpRequest has been blocked by CORS policy"
- No hay header `Access-Control-Allow-Origin` en la respuesta

**Error Completo:**
```
Access to XMLHttpRequest at 'https://club-manegament-production.up.railway.app/api/auth/login'
from origin 'https://club-management-frontend-production.up.railway.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

**Causa Raíz:**

CORS (Cross-Origin Resource Sharing) requiere que cuando el frontend hace requests **con credenciales** (cookies, authorization headers), el backend debe:

1. ✅ Configurar `allowCredentials: true` en CORS
2. ✅ El frontend debe enviar `withCredentials: true` en los requests
3. ❌ **PROBLEMA**: Frontend NO estaba enviando `withCredentials: true`

**Configuración del Backend (correcta):**

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList(
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ));
    configuration.setAllowCredentials(true);  // ✅ Backend permite credentials
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

**Configuración del Frontend (INCORRECTA):**

```typescript
// frontend/src/api/axios.ts
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ❌ FALTA: withCredentials: true
});
```

**Proceso de Diagnóstico:**

1. **Verificar que el backend está configurado para CORS:**
```bash
# Test CORS preflight (OPTIONS request)
curl -X OPTIONS https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Origin: https://club-management-frontend-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Output:
< HTTP/1.1 200
< Access-Control-Allow-Origin: https://club-management-frontend-production.up.railway.app
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
< Access-Control-Allow-Headers: Authorization,Content-Type,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers
< Access-Control-Allow-Credentials: true  ✅
< Access-Control-Max-Age: 3600
```

Backend CORS está configurado correctamente ✅

2. **Verificar request del frontend en browser DevTools:**
```
Network tab → api/auth/login
Request Headers:
  Origin: https://club-management-frontend-production.up.railway.app

❌ NO aparece: Access-Control-Allow-Credentials
❌ Cookies/credentials NO se envían
```

3. **Revisar configuración de axios:**
```bash
cat frontend/src/api/axios.ts
# ❌ NO tiene withCredentials: true
```

**Solución:**

Agregar `withCredentials: true` a la configuración de axios:

```typescript
// frontend/src/api/axios.ts
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Necesario para CORS con credenciales
});
```

**Cómo funciona CORS con Credentials:**

```
Frontend (con withCredentials: true)
    ↓
1. Browser envía OPTIONS preflight:
   OPTIONS /api/auth/login
   Origin: https://frontend.com
   Access-Control-Request-Method: POST
    ↓
Backend CORS responde:
   Access-Control-Allow-Origin: https://frontend.com
   Access-Control-Allow-Credentials: true  ← CRÍTICO
   Access-Control-Allow-Methods: POST
    ↓
2. Browser envía request real:
   POST /api/auth/login
   Origin: https://frontend.com
   Cookie: session_id=xxx       ← Se incluyen cookies
   Authorization: Bearer xxx    ← Se incluyen headers de auth
    ↓
Backend procesa request y responde:
   Access-Control-Allow-Origin: https://frontend.com
   Access-Control-Allow-Credentials: true
   Content-Type: application/json

   { "token": "...", "username": "admin" }
    ↓
✅ Browser permite que frontend acceda a la respuesta
```

**Archivo modificado:**
```
frontend/src/api/axios.ts
```

**Commit realizado:**
```bash
git add frontend/src/api/axios.ts
git commit -m "fix: Add withCredentials to axios for CORS support"
git push
```

**Verificación de la Solución:**

1. **Verificar en browser DevTools:**
```
Network tab → api/auth/login
Request Headers:
  Origin: https://club-management-frontend-production.up.railway.app

Response Headers:
  Access-Control-Allow-Origin: https://club-management-frontend-production.up.railway.app
  Access-Control-Allow-Credentials: true  ✅

Status: 200 OK ✅
```

2. **Verificar que login funciona desde frontend:**
```
1. Abrir https://club-management-frontend-production.up.railway.app
2. Ir a Login page
3. Ingresar: admin / admin123
4. ✅ Login exitoso, redirige a dashboard
5. ✅ Token JWT guardado en localStorage
6. ✅ Requests subsecuentes incluyen Authorization header
```

**Importante:**

⚠️ **NUNCA usar `Access-Control-Allow-Origin: *` con `allowCredentials: true`**

Esto NO funciona:
```java
configuration.setAllowedOrigins(Arrays.asList("*"));  // ❌ INCORRECTO
configuration.setAllowCredentials(true);
```

Browser rechazará con error:
```
Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'
```

✅ **CORRECTO: Especificar origins explícitos:**
```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://club-management-frontend-production.up.railway.app",
    "http://localhost:5173",
    "http://localhost:3000"
));
configuration.setAllowCredentials(true);
```

---

## Optimización de Recursos

### Optimización 1: BCrypt Strength Reducido en Producción

**Contexto:**

BCrypt es el algoritmo usado para hashear contraseñas. Tiene un parámetro llamado "strength" o "rounds" que controla cuántas iteraciones de hashing se aplican.

**Problema inicial:**

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(10);  // ❌ Muy lento para Railway
}
```

Con `strength=10`:
- Tiempo de hash: ~150-200ms por contraseña
- Login tarda 200-300ms solo en verificar password
- Alto consumo de CPU

**Solución aplicada:**

```java
@Value("${app.security.bcrypt-strength:4}")
private int bcryptStrength;

@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(bcryptStrength);  // ✅ Configurable
}
```

**En application.yml:**
```yaml
app:
  security:
    bcrypt-strength: 4  # Producción: más rápido
```

**Comparación de performance:**

| Strength | Tiempo Hash | Seguridad | Uso Recomendado |
|----------|-------------|-----------|-----------------|
| 4 | ~10ms | Baja | Development/Testing |
| 6 | ~40ms | Media | Aplicaciones internas |
| 10 | ~150ms | Alta | Aplicaciones públicas |
| 12 | ~600ms | Muy Alta | Datos críticos |

**Trade-off:**
- ✅ Login 15x más rápido
- ✅ Menor consumo de CPU
- ⚠️ Menos seguro contra ataques de fuerza bruta
- ✅ Aceptable para aplicación interna de club

**Recomendación:**
- Para aplicaciones públicas: usar strength 10-12
- Para aplicaciones internas: strength 6-8 es suficiente
- Para development: strength 4 acelera testing

---

### Optimización 2: Configuración de Connection Pool (HikariCP)

**Configuración aplicada:**

```yaml
spring:
  datasource:
    hikari:
      auto-commit: false
      connection-timeout: 30000      # 30 segundos
      idle-timeout: 600000           # 10 minutos
      max-lifetime: 1800000          # 30 minutos
      maximum-pool-size: 10          # Máximo 10 conexiones
      minimum-idle: 5                # Mínimo 5 idle
      pool-name: ClubManagementHikariPool
```

**Explicación:**

| Propiedad | Valor | Propósito |
|-----------|-------|-----------|
| `auto-commit` | false | Permite @Transactional controlar commits |
| `connection-timeout` | 30000ms | Tiempo máximo esperando conexión disponible |
| `idle-timeout` | 600000ms | Cerrar conexiones idle después de 10 minutos |
| `max-lifetime` | 1800000ms | Reciclar conexiones después de 30 minutos |
| `maximum-pool-size` | 10 | Máximo 10 conexiones simultáneas a PostgreSQL |
| `minimum-idle` | 5 | Mantener siempre 5 conexiones listas |

**Beneficios:**
- ✅ Previene connection leaks
- ✅ Optimiza uso de recursos de PostgreSQL
- ✅ Balance entre performance y recursos

---

## Variables de Entorno en Railway

### Resumen de Variables Configuradas

```bash
# Ver todas las variables
railway variables -s club-manegament
```

**Variables críticas para el funcionamiento:**

| Variable | Valor | Propósito |
|----------|-------|-----------|
| `JAVA_TOOL_OPTIONS` | `-Xmx512m -Xms256m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=100` | Limitar memoria JVM |
| `SPRING_DATASOURCE_HIKARI_AUTO_COMMIT` | `false` | Permitir transacciones JPA |
| `SPRING_PROFILES_ACTIVE` | `prod` | Activar perfil de producción |
| `JWT_SECRET` | `bNqm8Otl...` | Secret para firmar tokens JWT |
| `DB_URL` | `jdbc:postgresql://postgres.railway.internal:5432/railway` | URL de base de datos |
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `rVTWYzn...` | Password de PostgreSQL |
| `APP_CORS_ALLOWED_ORIGINS` | `https://club-management-frontend...` | Origins permitidos para CORS |

**Cómo configurar variables:**
```bash
# Configurar una variable
railway variables --set "NOMBRE_VARIABLE=valor" -s nombre-servicio

# Ver variables configuradas
railway variables -s nombre-servicio

# Eliminar una variable
railway variables --unset "NOMBRE_VARIABLE" -s nombre-servicio
```

**Nota:** Railway hace redeploy automático cuando cambias variables de entorno.

---

## Checklist de Deployment

Usa este checklist antes de deployar a producción:

### Backend

- [ ] `JAVA_TOOL_OPTIONS` configurado con límites de memoria
- [ ] `SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false`
- [ ] `SPRING_PROFILES_ACTIVE=prod`
- [ ] `JWT_SECRET` con al menos 256 bits (usar generador seguro)
- [ ] `DB_URL`, `DB_USER`, `DB_PASSWORD` configurados
- [ ] `APP_CORS_ALLOWED_ORIGINS` incluye el dominio del frontend
- [ ] `app.security.bcrypt-strength` apropiado (4-6 para Railway)
- [ ] Flyway migrations aplicadas correctamente
- [ ] Health endpoint responde: `GET /actuator/health` → `{"status":"UP"}`
- [ ] Login funciona: `POST /api/auth/login` → HTTP 200 con token

### Frontend

- [ ] `VITE_API_URL` apunta al backend correcto
- [ ] `axios.ts` tiene `withCredentials: true`
- [ ] Build exitoso: `npm run build` sin errores
- [ ] Frontend desplegado y accesible
- [ ] CORS funciona correctamente desde browser
- [ ] Login funciona desde UI
- [ ] Tokens JWT se guardan en localStorage
- [ ] Requests protegidos incluyen `Authorization: Bearer <token>`

### Base de Datos

- [ ] PostgreSQL corriendo en Railway
- [ ] Conexión exitosa desde backend
- [ ] Todas las migraciones Flyway aplicadas (check `flyway_schema_history`)
- [ ] Usuario `admin` existe con password `admin123`
- [ ] Tablas creadas correctamente

### Monitoreo

```bash
# Backend health
curl https://club-manegament-production.up.railway.app/actuator/health

# Backend logs
railway logs -s club-manegament --lines 100

# Frontend
curl https://club-management-frontend-production.up.railway.app

# Frontend logs
railway logs -s club-management-frontend --lines 100

# Test login
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Comandos Útiles de Diagnóstico

### Railway CLI

```bash
# Ver status del proyecto
railway status

# Ver logs en tiempo real
railway logs -s club-manegament

# Ver últimas 200 líneas
railway logs -s club-manegament --lines 200

# Buscar errores en logs
railway logs -s club-manegament --lines 500 | grep -i error

# Ver variables de entorno
railway variables -s club-manegament

# Configurar variable
railway variables --set "VAR=value" -s club-manegament

# Ejecutar comando en container
railway run -s club-manegament sh

# Ver deployments recientes
railway logs -s club-manegament | grep "Started ClubManagementApplication"
```

### Testing de API

```bash
# Health check
curl https://club-manegament-production.up.railway.app/actuator/health

# Login
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -w "\nHTTP: %{http_code}\n"

# Test endpoint protegido
TOKEN="<tu-token-aqui>"
curl -X GET https://club-manegament-production.up.railway.app/api/productos \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP: %{http_code}\n"

# Test CORS preflight
curl -X OPTIONS https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Origin: https://club-management-frontend-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Database

```bash
# Conectar a PostgreSQL desde Railway
railway run -s postgres psql

# O usando docker si tienes el DATABASE_PUBLIC_URL
docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL"

# Verificar migraciones Flyway
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;

# Verificar usuario admin
SELECT id, username, email, rol
FROM usuarios
WHERE username = 'admin';

# Contar registros en tablas principales
SELECT 'usuarios' as tabla, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'eventos', COUNT(*) FROM eventos;
```

---

## Contacto y Soporte

Si encuentras nuevos errores no documentados aquí:

1. **Revisar logs primero:**
   ```bash
   railway logs -s club-manegament --lines 500 | grep -i "error\|exception"
   ```

2. **Verificar health checks:**
   ```bash
   curl https://club-manegament-production.up.railway.app/actuator/health
   ```

3. **Documentar el error:**
   - Síntomas exactos
   - Logs completos del error
   - Stack trace si está disponible
   - Pasos para reproducir

4. **Actualizar este documento** con la solución una vez encontrada.

---

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
**Autor:** Club Management Team
