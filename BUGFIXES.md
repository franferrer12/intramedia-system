# Registro de Errores Solucionados

📖 **Para troubleshooting detallado de errores de deployment, consulta:** [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)

---

## 2025-10-11 - Errores de Compilación en Sistema POS

### 1. Llamadas a Método Inexistente `producto.getInventario()`

**Problema:**
Backend fallaba en compilación al intentar llamar a `producto.getInventario()`, método que no existe en la entidad `Producto`.

**Síntomas:**
```
[ERROR] /app/src/main/java/com/club/management/entity/DetalleVenta.java:[111,21] cannot find symbol
  symbol:   method getInventario()
  location: variable producto of type com.club.management.entity.Producto
```

**Causa Raíz:**
El modelo de datos evolucionó y ya no existe una entidad separada `Inventario`. El stock se maneja directamente en la tabla `productos` con el campo `stock`. El código intentaba acceder a una relación JPA que nunca existió.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/entity/DetalleVenta.java` (líneas 111-112)

**Solución:**
Eliminadas las llamadas a `getInventario()` y simplificada la validación de stock para delegar al trigger de base de datos `descontar_stock_venta` que se encarga de verificar y descontar el stock automáticamente.

```java
// ANTES (INCORRECTO):
if (producto.getInventario() != null) {
    Integer stockActual = producto.getInventario().getCantidadActual();
    if (stockActual != null && stockActual < cantidad) {
        throw new IllegalStateException(...);
    }
}

// DESPUÉS (CORRECTO):
// Nota: La validación de stock se hace a nivel de base de datos
// mediante el trigger descontar_stock_venta
```

**Commit:** `0e2cd67 - fix: Corregir errores de compilación en sistema POS`

---

### 2. Método `isActivo()` No Existe para Boolean

**Problema:**
Backend fallaba en compilación al intentar llamar a `producto.isActivo()` cuando el campo `activo` es de tipo `Boolean` (objeto), no `boolean` (primitivo).

**Síntomas:**
```
[ERROR] /app/src/main/java/com/club/management/service/VentaService.java:[132,26] cannot find symbol
  symbol:   method isActivo()
  location: variable producto of type com.club.management.entity.Producto
```

**Causa Raíz:**
Lombok genera métodos getter diferentes según el tipo del campo:
- Para `boolean` primitivo → `isActivo()`
- Para `Boolean` objeto → `getActivo()`

El campo `activo` en la entidad `Producto` está definido como `Boolean` objeto, por lo que Lombok genera `getActivo()`, no `isActivo()`.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/service/VentaService.java` (línea 132)

**Solución:**
Cambiar de `isActivo()` a `getActivo()` con null-check apropiado:

```java
// ANTES (INCORRECTO):
if (!producto.isActivo()) {
    throw new RuntimeException("El producto '" + producto.getNombre() + "' no está activo");
}

// DESPUÉS (CORRECTO):
if (producto.getActivo() != null && !producto.getActivo()) {
    throw new RuntimeException("El producto '" + producto.getNombre() + "' no está activo");
}
```

**Commit:** `0e2cd67 - fix: Corregir errores de compilación en sistema POS`

---

### 3. Acceso a Método `getNombre()` en String

**Problema:**
Backend intentaba llamar a `.getNombre()` en el campo `categoria` cuando este es un `String`, no un objeto.

**Síntomas:**
Error de compilación al intentar acceder a métodos en un tipo básico.

**Causa Raíz:**
En la entidad `Producto`, el campo `categoria` está definido como `String`:
```java
@Column(nullable = false, length = 50)
private String categoria;
```

No como una relación a una entidad `CategoriaProducto`.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/service/VentaService.java` (línea 210)

**Solución:**
Acceder directamente a `categoria` sin llamar a `.getNombre()`:

```java
// ANTES (INCORRECTO):
.productoCategoria(detalle.getProducto().getCategoria() != null ?
        detalle.getProducto().getCategoria().getNombre() : null)

// DESPUÉS (CORRECTO):
.productoCategoria(detalle.getProducto().getCategoria())
```

**Commit:** `0e2cd67 - fix: Corregir errores de compilación en sistema POS`

---

### 4. Query HQL con Acceso Incorrecto a `categoria.nombre`

**Problema:**
Query JPQL fallaba al intentar acceder a `p.categoria.nombre` cuando `categoria` es un campo de tipo `String`, no una entidad con propiedades navegables.

**Síntomas:**
```
org.hibernate.query.sqm.UnknownPathException: Could not interpret attribute 'nombre'
of basic-valued path 'com.club.management.entity.DetalleVenta(d).producto(p).categoria'
```

**Causa Raíz:**
La query JPQL trataba `categoria` como si fuera una entidad con un campo `nombre`, pero es simplemente un `String` básico. JPQL no permite navegar propiedades de tipos básicos.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/repository/DetalleVentaRepository.java` (líneas 77, 81)

**Solución:**
Cambiar la query para acceder directamente a `p.categoria` sin intentar navegar a `.nombre`:

```java
// ANTES (INCORRECTO):
@Query("SELECT p.categoria.nombre, SUM(d.cantidad) as cantidad, SUM(d.total) as ingresos " +
       "FROM DetalleVenta d " +
       "JOIN d.producto p " +
       "WHERE d.venta.fecha >= :fechaInicio AND d.venta.fecha <= :fechaFin " +
       "GROUP BY p.categoria.nombre " +
       "ORDER BY ingresos DESC")

// DESPUÉS (CORRECTO):
@Query("SELECT p.categoria, SUM(d.cantidad) as cantidad, SUM(d.total) as ingresos " +
       "FROM DetalleVenta d " +
       "JOIN d.producto p " +
       "WHERE d.venta.fecha >= :fechaInicio AND d.venta.fecha <= :fechaFin " +
       "GROUP BY p.categoria " +
       "ORDER BY ingresos DESC")
```

**Commit:** `0d01faa - fix: Corregir query HQL en DetalleVentaRepository`

**Resultado Final:**
✅ Backend compila correctamente
✅ Aplicación inicia en Railway sin errores
✅ Todos los endpoints POS responden HTTP 200

**Documentación Completa:** Ver [`POS_DEPLOYMENT_SUCCESS.md`](./POS_DEPLOYMENT_SUCCESS.md)

---

## 2025-10-10 - Errores Críticos de Deployment en Railway

### 1. Out of Memory (OOM) - Backend No Inicia

**Problema:**
Backend se reiniciaba continuamente en Railway y nunca llegaba a completar el inicio. Health endpoint retornaba 502 Bad Gateway.

**Síntomas:**
- Logs se detenían en la fase de inicialización de Hibernate
- Nunca aparecía el mensaje "Started ClubManagementApplication"
- Railway mostraba errores de OOM (Out of Memory)
- Tiempo de inicio: timeout (>5 minutos)

**Causa Raíz:**
Spring Boot con Hibernate, Flyway y múltiples entidades JPA consume demasiada memoria durante el inicio. Railway free tier no proporciona suficiente memoria para iniciar la aplicación con la configuración JVM por defecto (sin límites).

**Archivos/Configuraciones Afectadas:**
- Railway environment variables (nuevo)

**Solución:**
Configurar límites de memoria JVM mediante variable de entorno en Railway:

```bash
JAVA_TOOL_OPTIONS=-Xmx512m -Xms256m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=100
```

**Parámetros explicados:**
- `-Xmx512m`: Memoria máxima del heap (512MB)
- `-Xms256m`: Memoria inicial del heap (256MB)
- `-XX:MaxMetaspaceSize=128m`: Limitar metaspace (clases, métodos)
- `-XX:+UseG1GC`: Usar G1 Garbage Collector (más eficiente)
- `-XX:MaxGCPauseMillis=100`: Pausas de GC máximo 100ms

**Resultado:**
✅ Backend inicia correctamente en ~40 segundos
✅ Uso de memoria controlado
✅ No más reinicios por OOM

📖 **Diagnóstico completo:** Ver [TROUBLESHOOTING.md - Error 1](./TROUBLESHOOTING.md#error-1-out-of-memory-oom---backend-no-inicia)

---

### 2. HTTP 403 Forbidden en `/api/auth/login`

**Problema:**
El endpoint de login retornaba 403 Forbidden, impidiendo que usuarios se autenticaran.

**Síntomas:**
- POST `/api/auth/login` → HTTP 403
- Frontend mostraba "Failed to load resource: 403"
- Backend logs NO mostraban que el request llegara al controller
- Spring Security bloqueaba antes de llegar a AuthenticationController

**Causa Raíz:**
Spring Security 6 evalúa `requestMatchers` en orden **top-to-bottom**. Los matchers genéricos `/api/**` con restricciones de roles estaban ANTES de los específicos `/api/auth/**` con `permitAll()`, causando que el login fuera bloqueado.

**Flujo problemático:**
```
Request: POST /api/auth/login
   ↓
1. Evalúa: .requestMatchers(HttpMethod.POST, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")
   → ✅ Coincide con /api/auth/login
   → ❌ Usuario NO tiene token → NO tiene roles
   → 🚫 Resultado: 403 Forbidden

2. NUNCA llega a evaluar: .requestMatchers("/api/auth/**").permitAll()
```

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/config/SecurityConfig.java`

**Solución:**
Reordenar los requestMatchers para que los paths **específicos estén ANTES** de los genéricos:

```java
.authorizeHttpRequests(auth -> auth
    // ✅ CORRECTO: OPTIONS primero para CORS preflight
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    // ✅ CORRECTO: Endpoints públicos específicos PRIMERO
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/").permitAll()
    .requestMatchers("/actuator/health").permitAll()

    // ✅ CORRECTO: Endpoints protegidos genéricos DESPUÉS
    .requestMatchers(HttpMethod.GET, "/api/**").hasAnyAuthority("ROLE_ADMIN", ...)
    .requestMatchers(HttpMethod.POST, "/api/**").hasAnyAuthority("ROLE_ADMIN", ...)

    .anyRequest().authenticated()
)
```

**Commit:**
```
035eb93 - fix: Restore proper Spring Security configuration with correct requestMatcher order
```

**Resultado:**
✅ Login funciona correctamente: HTTP 200 con token JWT

📖 **Diagnóstico completo:** Ver [TROUBLESHOOTING.md - Error 2](./TROUBLESHOOTING.md#error-2-http-403-forbidden-en-apiauthlogin)

---

### 3. Error "Cannot commit when autoCommit is enabled"

**Problema:**
Login retornaba HTTP 500 Internal Server Error con excepción de PostgreSQL.

**Síntomas:**
- Backend estaba corriendo (health check OK)
- Login retornaba: HTTP 500
- Stack trace mostraba: `org.postgresql.util.PSQLException: Cannot commit when autoCommit is enabled`
- Ocurría en métodos con `@Transactional`

**Causa Raíz:**
**HikariCP** (connection pool) tiene `autoCommit=true` por defecto, lo que causa que cada SQL statement se commitee automáticamente. **Spring JPA** con `@Transactional` necesita controlar los commits manualmente para garantizar atomicidad y permitir rollbacks.

**Conflicto:**
```
HikariCP:         autoCommit = true  → Cada SQL se commitea inmediatamente
Spring JPA:       Quiere hacer commit manual al final del método @Transactional
PostgreSQL JDBC:  "No puedes hacer commit si autoCommit está enabled"
```

**Archivos/Configuraciones Afectadas:**
- Railway environment variables (nuevo)
- Todos los métodos con `@Transactional` (indirectamente)

**Solución:**
Configurar HikariCP para deshabilitar autoCommit mediante variable de entorno en Railway:

```bash
SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false
```

Spring Boot convierte automáticamente:
```
SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false
    ↓
spring.datasource.hikari.auto-commit=false
    ↓
HikariCP Config: autoCommit = false
```

**Resultado:**
✅ Login funciona correctamente
✅ Todas las transacciones JPA funcionan
✅ Rollbacks automáticos en caso de error

📖 **Diagnóstico completo:** Ver [TROUBLESHOOTING.md - Error 3](./TROUBLESHOOTING.md#error-3-cannot-commit-when-autocommit-is-enabled)

---

### 4. CORS Policy Blocking XMLHttpRequest

**Problema:**
Browser bloqueaba requests del frontend al backend con error de CORS.

**Síntomas:**
- Console mostraba: "Access to XMLHttpRequest blocked by CORS policy"
- No había header `Access-Control-Allow-Origin` en la respuesta
- Funcionaba en localhost pero no en producción

**Causa Raíz:**
CORS con credentials requiere que:
1. ✅ Backend configure `allowCredentials: true` (ya estaba)
2. ✅ Backend especifique origins explícitos (ya estaba)
3. ❌ **Frontend envíe `withCredentials: true`** (FALTABA)

**Archivos Afectados:**
- `frontend/src/api/axios.ts`

**Solución:**
Agregar `withCredentials: true` a la configuración de axios:

```typescript
// ANTES (INCORRECTO):
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ❌ FALTA: withCredentials: true
});

// DESPUÉS (CORRECTO):
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Necesario para CORS con credenciales
});
```

**Resultado:**
✅ CORS funciona correctamente
✅ Cookies y Authorization headers se envían
✅ Backend permite requests del frontend

📖 **Diagnóstico completo:** Ver [TROUBLESHOOTING.md - Error 4](./TROUBLESHOOTING.md#error-4-cors-policy-blocking-xmlhttprequest)

---

## 2025-10-06 - Errores de Autenticación y Exportación Excel

### 1. Error 403 Forbidden en Exportaciones de Excel

**Problema:**
Todas las peticiones a los endpoints de exportación de Excel (`/api/reportes/**/excel`) retornaban error 403 Forbidden, incluso con un usuario admin autenticado correctamente.

**Causa Raíz:**
En `SecurityConfig.java`, las reglas de autorización HTTP globales (líneas 79-82) usaban `hasAnyRole()` en lugar de `hasAnyAuthority()`.

- `hasAnyRole()` añade automáticamente el prefijo "ROLE_" a los roles proporcionados
- `CustomUserDetailsService` ya añadía el prefijo "ROLE_" manualmente
- Esto causaba que Spring Security buscara "ROLE_ROLE_ADMIN" en lugar de "ROLE_ADMIN"

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/config/SecurityConfig.java`

**Solución:**
Cambiar de `hasAnyRole()` a `hasAnyAuthority()` con prefijos `ROLE_` explícitos:

```java
// ANTES (INCORRECTO):
.requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole("ADMIN", "GERENTE", "ENCARGADO", "RRHH", "LECTURA")
.requestMatchers(HttpMethod.POST, "/api/**").hasAnyRole("ADMIN", "GERENTE", "ENCARGADO")
.requestMatchers(HttpMethod.PUT, "/api/**").hasAnyRole("ADMIN", "GERENTE")
.requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("ADMIN", "GERENTE")

// DESPUÉS (CORRECTO):
.requestMatchers(HttpMethod.GET, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_ENCARGADO", "ROLE_RRHH", "ROLE_LECTURA")
.requestMatchers(HttpMethod.POST, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_ENCARGADO")
.requestMatchers(HttpMethod.PUT, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")
.requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")
```

**Nota:** Los `@PreAuthorize` en los controladores ya usaban `hasAnyAuthority()` correctamente.

---

### 2. Token JWT No Enviado en Peticiones

**Problema:**
El token JWT no se estaba enviando en las peticiones HTTP, causando que el backend recibiera peticiones anónimas.

**Causa Raíz:**
Desajuste entre dónde se guardaba el token y dónde se leía:
- `authStore.ts` guardaba el token en: `localStorage.setItem('token', response.token)`
- `axios-interceptor.ts` lo buscaba en: `localStorage.getItem('auth-storage')` con estructura Zustand persist

**Archivos Afectados:**
- `frontend/src/utils/axios-interceptor.ts`

**Solución:**
Simplificar el interceptor para leer directamente del localStorage:

```typescript
// ANTES (INCORRECTO):
const authStorage = localStorage.getItem('auth-storage');
if (authStorage) {
  try {
    const { state } = JSON.parse(authStorage);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  } catch (error) {
    console.error('Error al parsear auth-storage:', error);
  }
}

// DESPUÉS (CORRECTO):
const token = localStorage.getItem('token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

---

### 3. Error CORS con localhost:3001

**Problema:**
El frontend en `localhost:3001` era bloqueado por CORS porque solo se permitían `localhost:3000` y `localhost:5173`.

**Causa Raíz:**
El puerto 3000 estaba ocupado, por lo que Vite inició el frontend en el puerto 3001, pero este puerto no estaba en la configuración CORS del backend.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/config/SecurityConfig.java`

**Solución:**
Añadir `localhost:3001` a los orígenes permitidos:

```java
// ANTES:
configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173"));

// DESPUÉS:
configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001", "http://localhost:5173"));
```

---

### 4. Error al Crear Hoja Excel de Nóminas

**Problema:**
Al exportar nóminas, la petición fallaba con error 500 y excepción:
```
java.lang.IllegalArgumentException: Invalid char (/) found at index (10) in sheet name 'Nóminas 10/2025'
```

**Causa Raíz:**
Apache POI (librería de Excel) no permite el carácter `/` en nombres de hojas. El servicio intentaba crear una hoja llamada "Nóminas 10/2025" con la barra entre mes y año.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/service/reports/ExcelExportService.java` (línea 175)

**Solución:**
Reemplazar `/` por `-` en el nombre de la hoja:

```java
// ANTES:
Sheet sheet = workbook.createSheet("Nóminas " + mes + "/" + anio);

// DESPUÉS:
Sheet sheet = workbook.createSheet("Nóminas " + mes + "-" + anio);
```

---

## Verificación de Soluciones

Todas las exportaciones de Excel ahora funcionan correctamente:
- ✅ Inventario (`/api/reportes/inventario/excel`)
- ✅ Nóminas (`/api/reportes/nominas/excel?mes=10&anio=2025`)
- ✅ Transacciones (`/api/reportes/transacciones/excel?fechaInicio=X&fechaFin=Y`)
- ✅ Eventos (`/api/reportes/eventos/excel?fechaInicio=X&fechaFin=Y`)
- ✅ Movimientos de Stock (`/api/reportes/movimientos-stock/excel?fechaInicio=X&fechaFin=Y`)

## Lecciones Aprendidas

1. **hasAnyRole vs hasAnyAuthority**: Siempre verificar qué método usar según si los roles ya tienen el prefijo "ROLE_" o no.

2. **Consistencia en Storage**: Mantener consistencia entre dónde se guarda y dónde se lee el token de autenticación.

3. **Validación de caracteres especiales**: Los nombres de hojas Excel tienen restricciones. Caracteres inválidos: `\ / ? * [ ]`

4. **CORS en desarrollo**: Considerar múltiples puertos en la configuración CORS para entornos de desarrollo.

## Comandos de Reconstrucción

Para aplicar estos cambios en el backend:

```bash
cd D:\club-management
docker-compose build backend
docker-compose up -d backend
```

Para verificar que los cambios se aplicaron:

```bash
# Verificar que el contenedor usa la nueva imagen
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.CreatedAt}}"

# Ver logs del backend
docker-compose logs backend --tail 50
```
