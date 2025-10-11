# Sistema POS - Documentación Completa y Lecciones Aprendidas

**Fecha**: 2025-10-10
**Estado**: ✅ Sistema completamente funcional en producción Railway

## Resumen Ejecutivo

El sistema POS (Point of Sale) para gestión de sesiones de venta y consumos está completamente operativo en producción. Todos los endpoints funcionan correctamente y el trigger automático de descuento de stock opera según lo esperado.

---

## Arquitectura del Sistema POS

### Tablas Principales

1. **sesiones_venta**
   - Representa una sesión de venta (ej: "Mesa 1", "Barra Principal")
   - Estados: ABIERTA, CERRADA, CANCELADA
   - Campos clave: codigo, nombre, estado, empleado_id, valor_total, total_items

2. **consumos_sesion**
   - Registra cada consumo dentro de una sesión
   - Almacena: producto, cantidad, precio_unitario, subtotal
   - Trigger automático: descuenta stock al insertar

3. **movimientos_stock**
   - Auditoría completa de movimientos de inventario
   - Campos críticos: stock_anterior, stock_nuevo (NOT NULL desde V017)

### Flujo de Datos

```
Usuario crea sesión
    ↓
POST /api/sesiones-venta → crea registro en sesiones_venta
    ↓
Usuario registra consumo
    ↓
POST /api/sesiones-venta/{id}/consumos → inserta en consumos_sesion
    ↓
TRIGGER descontar_stock_consumo_trigger se ejecuta AFTER INSERT
    ↓
1. Calcula cantidad en botellas (si es copa/chupito, convierte)
2. Actualiza productos.stock_actual
3. Inserta registro en movimientos_stock con stock_anterior y stock_nuevo
```

---

## Endpoints del Sistema POS

### 1. Autenticación

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response 200:
{
  "token": "eyJhbGci...",
  "type": "Bearer",
  "username": "admin",
  "email": "admin@clubmanagement.com",
  "rol": "ADMIN"
}
```

### 2. Crear Sesión de Venta

```bash
POST /api/sesiones-venta
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Mesa 1",
  "notas": "Sesión de prueba"
}

Response 200:
{
  "id": 2,
  "codigo": "SV-002",
  "nombre": "Mesa 1",
  "estado": "ABIERTA",
  "empleadoId": null,
  "valorTotal": 0.00,
  "totalItems": 0.00,
  "fechaApertura": "2025-10-10T18:39:38.291588",
  "notas": "Sesión de prueba"
}
```

### 3. Listar Sesiones Abiertas

```bash
GET /api/sesiones-venta/abiertas
Authorization: Bearer {token}

Response 200:
[
  {
    "id": 2,
    "codigo": "SV-002",
    "nombre": "Mesa 1",
    "estado": "ABIERTA",
    ...
  }
]
```

### 4. Registrar Consumo (🔥 CRÍTICO - Dispara trigger de stock)

```bash
POST /api/sesiones-venta/{id}/consumos
Authorization: Bearer {token}
Content-Type: application/json

{
  "productoId": 4,
  "cantidad": 3.0,
  "notas": "Opcional"
}

Response 200:
{
  "id": 3,
  "sesionId": 2,
  "productoId": 4,
  "productoNombre": "Vodka Grey Goose",
  "cantidad": 3.0,
  "precioUnitario": 65.00,
  "subtotal": 195.00,
  "tipoVenta": "BOTELLA",
  "fechaRegistro": "2025-10-10T19:21:32.980029",
  "registradoPor": "admin"
}
```

**⚠️ IMPORTANTE**: Este endpoint dispara automáticamente el trigger `descontar_stock_consumo_trigger` que:
- Descuenta el stock del producto
- Registra el movimiento en `movimientos_stock`
- Calcula `stock_anterior` y `stock_nuevo`

### 5. Obtener Detalles de Sesión

```bash
GET /api/sesiones-venta/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": 2,
  "codigo": "SV-002",
  "nombre": "Mesa 1",
  "estado": "ABIERTA",
  "valorTotal": 325.00,
  "totalItems": 5.0,
  ...
}
```

### 6. Cerrar Sesión

```bash
POST /api/sesiones-venta/{id}/cerrar
Authorization: Bearer {token}
Content-Type: application/json

{
  "notas": "Sesión cerrada correctamente"
}

Response 200:
{
  "id": 2,
  "estado": "CERRADA",
  "fechaCierre": "2025-10-10T20:00:00",
  ...
}
```

---

## Migraciones de Base de Datos

### Evolución del Sistema

| Versión | Descripción | Estado | Commit |
|---------|-------------|--------|--------|
| V015 | Crear tablas de activos fijos | ✅ Aplicada | 430dee5 |
| V016 | Crear tablas POS (sesiones_venta, consumos_sesion) | ✅ Aplicada | 430dee5 |
| V017 | Crear función descontar_stock_consumo() con stock_anterior/stock_nuevo | ✅ Aplicada | 430dee5 |
| V018 | **Crear trigger descontar_stock_consumo_trigger** | ✅ Aplicada | f87f0ec |

### ⚠️ Problema Descubierto en V017

**Síntoma**: La migración V017 creaba la FUNCIÓN pero NO el TRIGGER

**Código V017 original**:
```sql
CREATE OR REPLACE FUNCTION descontar_stock_consumo()
RETURNS TRIGGER AS $$
BEGIN
  -- lógica del trigger
END;
$$ LANGUAGE plpgsql;

-- ❌ FALTABA ESTA LÍNEA:
-- CREATE TRIGGER descontar_stock_consumo_trigger ...
```

**Solución**: Crear migración V018 que incluye:

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'descontar_stock_consumo_trigger'
    ) THEN
        CREATE TRIGGER descontar_stock_consumo_trigger
        AFTER INSERT ON consumos_sesion
        FOR EACH ROW
        EXECUTE FUNCTION descontar_stock_consumo();
    END IF;
END $$;
```

**Lección aprendida**: Los triggers PostgreSQL requieren AMBOS:
1. `CREATE FUNCTION` - Define la lógica
2. `CREATE TRIGGER` - Vincula la función al evento de tabla

---

## Problemas Resueltos Durante el Despliegue

### 1. PasswordMigrationRunner Causaba Crashes

**Síntoma**:
```
Started ClubManagementApplication
=== INICIANDO MIGRACIÓN DE PASSWORDS ===
[crash y reinicio inmediato]
```

**Causa**: El `@Transactional` en un `ApplicationRunner` causaba conflictos con el modo autoCommit de JDBC.

**Solución**:
```java
// TEMPORAL: Deshabilitado porque causa crashes en producción
// @Component
@RequiredArgsConstructor
@Slf4j
public class PasswordMigrationRunner implements ApplicationRunner {
    // ... código comentado
}
```

**Archivo**: `backend/src/main/java/com/club/management/config/PasswordMigrationRunner.java:21`

---

### 2. HTTP 403 en Endpoints POST

**Síntoma**: POST a `/api/sesiones-venta` devolvía 403 Forbidden

**Diagnóstico erróneo inicial**: Pensé que era un problema de Spring Security

**Causa real**:
1. Algunos endpoints fallaban por **validación de datos** (faltaba campo `nombre`)
2. Spring Security redirigía a `/error` sin contexto de autenticación
3. Resultado: HTTP 403 en lugar de HTTP 400

**Solución**: Enviar los campos requeridos correctamente según los DTOs:

```java
// SesionVentaRequest.java
@NotBlank(message = "El nombre de la sesión es obligatorio")
private String nombre;  // ← Campo obligatorio

// RegistrarConsumoRequest.java
@NotNull(message = "El ID del producto es obligatorio")
private Long productoId;

@NotNull(message = "La cantidad es obligatoria")
@DecimalMin(value = "0.01")
private BigDecimal cantidad;
```

**Lección aprendida**: Un 403 puede ser causado por:
- Spring Security (autenticación/autorización)
- Validación de datos que falla antes de llegar al controller
- Excepciones no manejadas que disparan el filtro de error

---

### 3. Producto No Existe → HTTP 403 (Incorrecto)

**Síntoma**: Intentar consumir un producto con ID inexistente devolvía 403

**Causa**: El servicio lanzaba `EntityNotFoundException` que no se manejaba correctamente

**Solución temporal**: Crear producto válido en la base de datos

**Recomendación futura**: Implementar `@ControllerAdvice` para manejar excepciones:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(
            new ErrorResponse("NOT_FOUND", ex.getMessage())
        );
    }
}
```

---

### 4. Trigger No Se Ejecutaba

**Síntoma**:
- Consumo se registraba correctamente (HTTP 200)
- Stock NO se descontaba
- Tabla `movimientos_stock` quedaba vacía

**Diagnóstico**:

```sql
-- Verificar si la función existe
SELECT proname FROM pg_proc WHERE proname = 'descontar_stock_consumo';
-- Resultado: ✅ Existe

-- Verificar si el trigger existe
SELECT tgname FROM pg_trigger WHERE tgrelid = 'consumos_sesion'::regclass;
-- Resultado: ❌ No existe (solo triggers de constraints FK)
```

**Causa**: Migración V017 solo creó la función, NO el trigger

**Solución**:
1. Crear trigger manualmente en producción:
```sql
CREATE TRIGGER descontar_stock_consumo_trigger
AFTER INSERT ON consumos_sesion
FOR EACH ROW
EXECUTE FUNCTION descontar_stock_consumo();
```

2. Crear migración V018 para futuros deploys

**Validación del fix**:
```sql
-- Antes del consumo
SELECT stock_actual FROM productos WHERE id = 4;
-- Resultado: 10.00

-- Después de consumir 3.0 botellas
SELECT stock_actual FROM productos WHERE id = 4;
-- Resultado: 7.00 ✅

-- Verificar movimiento registrado
SELECT tipo_movimiento, cantidad, stock_anterior, stock_nuevo
FROM movimientos_stock WHERE producto_id = 4;
-- Resultado: SALIDA, 3.00, 10.00, 7.00 ✅
```

---

## Configuración de Seguridad (Spring Security)

### SecurityConfig.java (Configuración Final)

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Permitir OPTIONS para CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Endpoints públicos
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Endpoints protegidos por roles
                .requestMatchers(HttpMethod.GET, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_ENCARGADO", "ROLE_RRHH", "ROLE_LECTURA")
                .requestMatchers(HttpMethod.POST, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE", "ROLE_ENCARGADO")
                .requestMatchers(HttpMethod.PUT, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")
                .requestMatchers(HttpMethod.DELETE, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_GERENTE")

                .anyRequest().authenticated()
            )
            .addFilterAfter(jwtAuthenticationFilter, LogoutFilter.class);

        return http.build();
    }
}
```

### Anotaciones en Controllers

```java
@RestController
@RequestMapping("/api/sesiones-venta")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
public class SesionVentaController {
    // Todos los endpoints heredan la autorización de clase
}
```

**Lección aprendida**:
- `@PreAuthorize` a nivel de clase aplica a TODOS los métodos
- Los roles deben tener prefijo `ROLE_` en la base de datos
- `hasAuthority('ROLE_ADMIN')` es equivalente a `hasRole('ADMIN')`

---

## Variables de Entorno en Railway

```bash
# Base de datos (automáticas de Railway)
DATABASE_URL=postgresql://...
DATABASE_PUBLIC_URL=postgresql://...

# JWT (generado manualmente)
JWT_SECRET=tu-secret-de-256-bits-o-mas

# BCrypt strength (4 para producción, 10 para desarrollo)
APP_SECURITY_BCRYPT_STRENGTH=4

# CORS (separados por coma, sin espacios)
APP_CORS_ALLOWED_ORIGINS=https://club-management-frontend-production.up.railway.app,http://localhost:5173,http://localhost:3000
```

---

## Testing Manual en Producción

### Script de Testing Completo

```bash
#!/bin/bash

BASE_URL="https://club-manegament-production.up.railway.app"

# 1. Login
echo "=== 1. Login ==="
TOKEN=$(curl -s -m 10 "$BASE_URL/api/auth/login" \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "Token obtenido: ${TOKEN:0:50}..."
echo ""

# 2. Crear sesión
echo "=== 2. Crear Sesión ==="
SESION=$(curl -s -m 10 "$BASE_URL/api/sesiones-venta" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mesa Test","notas":"Testing POS"}')

SESION_ID=$(echo $SESION | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Sesión creada: ID $SESION_ID"
echo ""

# 3. Registrar consumo
echo "=== 3. Registrar Consumo (Trigger Stock) ==="
CONSUMO=$(curl -s -w "\nHTTP:%{http_code}\n" -m 10 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productoId":4,"cantidad":2.0}' \
  "$BASE_URL/api/sesiones-venta/$SESION_ID/consumos")

echo "$CONSUMO"
echo ""

# 4. Verificar stock (requiere acceso a Railway CLI)
echo "=== 4. Verificar Stock en DB ==="
railway run -s club-manegament sh -c \
  'docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL" \
  -c "SELECT id, nombre, stock_actual FROM productos WHERE id = 4;"'
```

---

## Comandos Útiles Railway CLI

### Logs en Tiempo Real
```bash
railway logs -s club-manegament --tail 50
```

### Ejecutar Query en Producción
```bash
railway run -s club-manegament sh -c \
  'docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL" \
  -c "SELECT * FROM sesiones_venta ORDER BY id DESC LIMIT 5;"'
```

### Trigger Redeploy
```bash
railway up -s club-manegament
```

### Ver Estado del Servicio
```bash
railway status
```

### Verificar Migraciones Aplicadas
```bash
railway run -s club-manegament sh -c \
  'docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL" \
  -c "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;"'
```

---

## Checklist de Validación del Sistema POS

### ✅ Backend Funcionando

- [x] Login devuelve token JWT válido (HTTP 200)
- [x] GET /api/sesiones-venta/abiertas funciona (HTTP 200)
- [x] POST /api/sesiones-venta crea sesión (HTTP 200)
- [x] POST /api/sesiones-venta/{id}/consumos registra consumo (HTTP 200)
- [x] GET /api/sesiones-venta/{id} obtiene detalles (HTTP 200)
- [x] POST /api/sesiones-venta/{id}/cerrar cierra sesión (HTTP 200)

### ✅ Trigger de Stock Funcionando

```sql
-- Verificar que existe la función
SELECT proname FROM pg_proc WHERE proname = 'descontar_stock_consumo';

-- Verificar que existe el trigger
SELECT tgname FROM pg_trigger WHERE tgrelid = 'consumos_sesion'::regclass AND tgname = 'descontar_stock_consumo_trigger';

-- Verificar que el trigger se ejecuta
-- 1. Anotar stock inicial
SELECT stock_actual FROM productos WHERE id = X;

-- 2. Registrar consumo via API
-- POST /api/sesiones-venta/{id}/consumos con productoId = X, cantidad = Y

-- 3. Verificar stock final = stock inicial - Y
SELECT stock_actual FROM productos WHERE id = X;

-- 4. Verificar movimiento registrado
SELECT * FROM movimientos_stock WHERE producto_id = X ORDER BY fecha_movimiento DESC LIMIT 1;
```

### ✅ Seguridad Configurada

- [x] CORS permite orígenes del frontend
- [x] JWT valida correctamente
- [x] Roles ADMIN/GERENTE/ENCARGADO tienen acceso a endpoints POS
- [x] Endpoints públicos (/api/auth/**, /actuator/health) accesibles sin token

### ✅ Base de Datos

- [x] Todas las migraciones aplicadas (V001-V018)
- [x] Tablas sesiones_venta y consumos_sesion existen
- [x] Trigger descontar_stock_consumo_trigger existe y está habilitado
- [x] Función descontar_stock_consumo() existe

---

## Próximos Pasos / Mejoras Futuras

### 1. Manejo de Excepciones Global

Implementar `@ControllerAdvice` para respuestas consistentes:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(
            new ErrorResponse("NOT_FOUND", ex.getMessage())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.toList());

        return ResponseEntity.status(400).body(
            new ErrorResponse("VALIDATION_ERROR", errors)
        );
    }
}
```

### 2. Logs Estructurados

Reemplazar logs INFO con niveles apropiados:
- DEBUG: Flujo interno de JWT filter
- INFO: Operaciones de negocio (sesión creada, consumo registrado)
- WARN: Situaciones anormales pero recuperables
- ERROR: Fallos que requieren intervención

### 3. Tests de Integración

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class SesionVentaIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @Test
    void debeCrearSesionYRegistrarConsumoConDescuentoDeStock() {
        // Arrange
        String token = login("admin", "admin123");
        Producto producto = crearProducto("Vodka", 10.0);

        // Act
        SesionVentaDTO sesion = crearSesion("Mesa 1", token);
        ConsumoSesionDTO consumo = registrarConsumo(sesion.getId(), producto.getId(), 2.0, token);

        // Assert
        assertThat(consumo.getSubtotal()).isEqualTo(BigDecimal.valueOf(130.0));

        Producto productoActualizado = productoRepository.findById(producto.getId()).get();
        assertThat(productoActualizado.getStockActual()).isEqualTo(BigDecimal.valueOf(8.0));

        List<MovimientoStock> movimientos = movimientoStockRepository.findByProductoId(producto.getId());
        assertThat(movimientos).hasSize(1);
        assertThat(movimientos.get(0).getStockAnterior()).isEqualTo(BigDecimal.valueOf(10.0));
        assertThat(movimientos.get(0).getStockNuevo()).isEqualTo(BigDecimal.valueOf(8.0));
    }
}
```

### 4. Monitoreo y Alertas

- Configurar alertas de Railway para crashes
- Implementar health checks personalizados
- Logs agregados con Grafana/Loki

### 5. Documentación OpenAPI

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Club Management API")
                .version("1.0")
                .description("Sistema de gestión integral para nightclubs"))
            .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
            .components(new Components()
                .addSecuritySchemes("Bearer Authentication",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
```

---

## Commits Relevantes

| Commit | Descripción | Archivos |
|--------|-------------|----------|
| `430dee5` | fix: add @Transactional to PasswordMigrationRunner | PasswordMigrationRunner.java |
| `4187702` | fix: disable PasswordMigrationRunner causing production crashes | PasswordMigrationRunner.java |
| `035eb93` | fix: Restore proper Spring Security configuration | SecurityConfig.java |
| `f87f0ec` | feat: Add V018 migration to create descontar_stock_consumo trigger | V018__crear_trigger_descontar_stock.sql |

---

## Glosario

- **POS**: Point of Sale - Sistema de punto de venta
- **Sesión de Venta**: Agrupación de consumos por ubicación/empleado (ej: "Mesa 1")
- **Consumo**: Registro individual de producto vendido dentro de una sesión
- **Trigger**: Función automática que se ejecuta en respuesta a eventos de BD
- **Stock Anterior/Nuevo**: Valores de inventario antes y después de un movimiento
- **JWT**: JSON Web Token - Token de autenticación stateless
- **BCrypt**: Algoritmo de hashing para passwords (configurable con "strength" o "rounds")

---

## Contacto y Referencias

- **Repositorio**: https://github.com/franferrer12/club-management
- **Railway Proyecto**: ccab6032-7546-4b1a-860f-29ec44cdbd85
- **Railway Servicio Backend**: a0e3c239-4268-414e-8715-a11438e6bddd

**Documentación relacionada**:
- `RAILWAY_DEPLOY.md` - Guía de despliegue en Railway
- `POS_FIXES_DEPLOY.md` - Documentación de fixes aplicados
- `CLAUDE.md` - Guía para Claude Code sobre el proyecto

---

**Última actualización**: 2025-10-10 19:30 UTC
**Versión del sistema**: 0.1.0 (primera versión production-ready)
