# 📚 Swagger/OpenAPI Documentation - Club Management System

**Fecha:** 12 Octubre 2025
**Versión:** 0.3.1
**Sprint:** 10 - Optimización Final y Documentación
**Estado:** ✅ COMPLETADO

---

## 📋 Resumen

Se ha implementado **documentación completa de la API** utilizando **SpringDoc OpenAPI 3** (Swagger UI).

### URLs de Acceso

**Desarrollo Local:**
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs
- **OpenAPI YAML:** http://localhost:8080/v3/api-docs.yaml

**Producción (Railway):**
- **Swagger UI:** https://club-manegament-production.up.railway.app/swagger-ui.html
- **OpenAPI JSON:** https://club-manegament-production.up.railway.app/v3/api-docs

---

## 🎯 Características Implementadas

### 1. Configuración OpenAPI Completa

**Archivo:** `backend/src/main/java/com/club/management/config/OpenApiConfig.java`

**Features:**
- ✅ Información del proyecto (nombre, versión, descripción)
- ✅ Contacto y licencia
- ✅ Servidores (desarrollo y producción)
- ✅ Autenticación JWT Bearer
- ✅ Seguridad aplicada globalmente
- ✅ Descripción detallada de módulos

### 2. Autenticación JWT en Swagger

**Tipo:** HTTP Bearer
**Formato:** JWT
**Header:** `Authorization: Bearer {token}`

**Cómo autenticarse en Swagger UI:**
1. Ir a http://localhost:8080/swagger-ui.html
2. Clic en botón **"Authorize"** (candado verde)
3. Ejecutar endpoint `/api/auth/login` con credenciales:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
4. Copiar el `token` de la respuesta
5. Pegar en el campo "Value" del modal "Authorize"
6. Formato: Solo el token (sin "Bearer ")
7. Clic en **"Authorize"**
8. ✅ Todos los endpoints protegidos ahora funcionarán

### 3. Organización por Tags

Los endpoints están agrupados por módulos:

| Tag | Descripción | Endpoints |
|-----|-------------|-----------|
| **Authentication** | Autenticación y sesión | 3 |
| **Eventos** | Gestión de eventos | 7 |
| **Transacciones** | Finanzas y P&L | 8 |
| **Empleados** | Gestión de personal | 6 |
| **Jornadas** | Turnos laborales | 7 |
| **Nóminas** | Sueldos y pagos | 6 |
| **Productos** | Catálogo de productos | 5 |
| **Inventario** | Control de stock | 4 |
| **Movimientos Stock** | Historial de movimientos | 5 |
| **Alertas Stock** | Notificaciones de stock bajo | 4 |
| **POS - Sesiones Venta** | Punto de venta | 8 |
| **POS - Estadísticas** | Stats de ventas | 2 |
| **Botellas VIP** | Gestión de botellas | 12 |
| **Analytics** | Dashboard y reportes | 6 |
| **Proveedores** | Gestión de proveedores | 5 |
| **Usuarios** | Usuarios del sistema | 5 |
| **Dashboard** | Métricas en tiempo real | 3 |

**Total:** ~87+ endpoints documentados

---

## 📖 Información de la API

### Versión
**v0.3.1** (Sprint 10 - Security Patch)

### Descripción

```markdown
Sistema Integral de Gestión para Discotecas

API REST completa para la gestión de eventos, finanzas, personal, inventario,
punto de venta (POS) y sistema de botellas VIP.

Autenticación:
- JWT Bearer token
- Expiración: 24 horas
- Roles: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

Módulos:
1. Autenticación
2. Eventos
3. Finanzas
4. Personal
5. Inventario
6. POS
7. Botellas VIP
8. Analytics
9. Proveedores
10. Usuarios
```

---

## 🔐 Seguridad en Swagger

### JWT Bearer Authentication

Todos los endpoints (excepto `/api/auth/**`) requieren token JWT.

**Esquema de Seguridad:**
```yaml
securitySchemes:
  Bearer Authentication:
    type: http
    scheme: bearer
    bearerFormat: JWT
    in: header
    name: Authorization
    description: JWT token obtenido del endpoint /api/auth/login
```

**Aplicación Global:**
```yaml
security:
  - Bearer Authentication: []
```

### Endpoints Públicos

Solo estos endpoints NO requieren autenticación:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /actuator/health`
- `GET /swagger-ui.html`
- `GET /v3/api-docs`

---

## 🎨 Features de Swagger UI

### Configuración Aplicada

```yaml
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
    operationsSorter: method          # Ordenar por método HTTP
    tagsSorter: alpha                 # Ordenar tags alfabéticamente
    tryItOutEnabled: true             # Habilitar "Try it out"
    filter: true                      # Barra de búsqueda
    displayRequestDuration: true      # Mostrar tiempo de respuesta
  show-actuator: false                # No mostrar endpoints de Actuator
```

### Features Disponibles

1. **Try It Out:** Ejecutar requests directamente desde Swagger
2. **Filtro/Búsqueda:** Buscar endpoints por nombre
3. **Ordenamiento:** Alfabético por tags y método HTTP
4. **Request Duration:** Ver tiempo de cada request
5. **Schemas:** Ver modelos de datos (DTOs)
6. **Ejemplos:** Request y response examples
7. **Autorización:** Modal para ingresar JWT token

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Autenticación

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc2MDEyMjg4NiwiZXhwIjoxNzYwMjA5Mjg2fQ...",
  "type": "Bearer",
  "username": "admin",
  "email": "admin@club.com",
  "rol": "ADMIN"
}
```

---

### Ejemplo 2: Listar Eventos

**Endpoint:** `GET /api/eventos`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Fiesta de Año Nuevo",
    "descripcion": "Gran celebración de fin de año",
    "fecha": "2025-12-31",
    "estado": "PLANIFICADO",
    "aforoMaximo": 500,
    "precioEntrada": 50.00
  }
]
```

---

### Ejemplo 3: Crear Transacción

**Endpoint:** `POST /api/transacciones`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "tipo": "INGRESO",
  "categoriaId": 1,
  "monto": 1500.00,
  "descripcion": "Venta de entradas - Evento NYE",
  "fecha": "2025-12-31",
  "eventoId": 1
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "tipo": "INGRESO",
  "categoria": {
    "id": 1,
    "nombre": "Ventas de Entradas"
  },
  "monto": 1500.00,
  "descripcion": "Venta de entradas - Evento NYE",
  "fecha": "2025-12-31",
  "eventoId": 1
}
```

---

## 🔍 Endpoints por Módulo

### 1. Autenticación (3 endpoints)
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Refrescar token
- `GET /api/auth/me` - Usuario actual

### 2. Eventos (7 endpoints)
- `GET /api/eventos` - Listar todos
- `GET /api/eventos/{id}` - Obtener por ID
- `POST /api/eventos` - Crear nuevo
- `PUT /api/eventos/{id}` - Actualizar
- `DELETE /api/eventos/{id}` - Eliminar
- `GET /api/eventos/estado/{estado}` - Filtrar por estado
- `PATCH /api/eventos/{id}/estado` - Cambiar estado

### 3. Finanzas (8 endpoints)
- `GET /api/transacciones` - Listar todas
- `GET /api/transacciones/{id}` - Obtener por ID
- `POST /api/transacciones` - Crear nueva
- `PUT /api/transacciones/{id}` - Actualizar
- `DELETE /api/transacciones/{id}` - Eliminar
- `GET /api/transacciones/tipo/{tipo}` - Filtrar por tipo
- `GET /api/transacciones/periodo` - Por período
- `GET /api/transacciones/balance` - Calcular balance

### 4. POS - Sesiones Venta (8 endpoints)
- `POST /api/sesiones-venta` - Abrir sesión
- `GET /api/sesiones-venta/abiertas` - Sesiones abiertas
- `GET /api/sesiones-venta/{id}` - Obtener sesión
- `POST /api/sesiones-venta/{id}/consumos` - Registrar consumo
- `GET /api/sesiones-venta/{id}/consumos` - Listar consumos
- `POST /api/sesiones-venta/{id}/cerrar` - Cerrar sesión
- `DELETE /api/sesiones-venta/{id}` - Eliminar sesión
- `GET /api/sesiones-venta` - Listar todas

### 5. Botellas VIP (12 endpoints)
- `POST /api/botellas-abiertas` - Abrir botella
- `GET /api/botellas-abiertas` - Listar todas
- `GET /api/botellas-abiertas/abiertas` - Solo activas
- `GET /api/botellas-abiertas/cerradas` - Solo cerradas
- `GET /api/botellas-abiertas/{id}` - Obtener detalles
- `POST /api/botellas-abiertas/{id}/consumos` - Registrar copa
- `GET /api/botellas-abiertas/{id}/consumos` - Historial copas
- `PUT /api/botellas-abiertas/{id}/cerrar` - Cerrar botella
- `PUT /api/botellas-abiertas/{id}/cancelar` - Cancelar
- `DELETE /api/botellas-abiertas/{id}` - Eliminar
- `GET /api/botellas-abiertas/estadisticas/hoy` - Stats del día
- `GET /api/botellas-abiertas/estadisticas/mes` - Stats del mes

*(Y así para cada módulo...)*

---

## 🎨 Personalización de Swagger

### Cambiar Tema de Swagger UI

Por defecto, Swagger UI usa tema claro. Para personalizarlo:

**Opción 1: CSS Custom**
```yaml
springdoc:
  swagger-ui:
    url: /custom-swagger.css
```

**Opción 2: External Config**
```java
@Bean
public OpenApiCustomiser customiseOpenApi() {
    return openApi -> openApi.info(openApi.getInfo()
        .addExtension("x-logo", Map.of(
            "url", "https://my-logo.png",
            "altText", "Club Management Logo"
        )));
}
```

### Agregar Ejemplos a Endpoints

```java
@Operation(
    summary = "Crear evento",
    description = "Crea un nuevo evento en el sistema",
    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
        description = "Datos del evento a crear",
        content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(
                name = "Ejemplo: Fiesta de Halloween",
                value = """
                {
                  "nombre": "Halloween Party 2025",
                  "descripcion": "Gran fiesta temática de Halloween",
                  "fecha": "2025-10-31T20:00:00",
                  "estado": "PLANIFICADO",
                  "aforoMaximo": 300,
                  "precioEntrada": 25.00
                }
                """
            )
        )
    )
)
@PostMapping
public ResponseEntity<EventoDTO> createEvento(@Valid @RequestBody EventoRequest request) {
    // ...
}
```

---

## 📊 Métricas de Documentación

### Antes de Sprint 10
- **Documentación API:** ❌ No disponible
- **Swagger UI:** ❌ No configurado
- **OpenAPI Spec:** ❌ No generado
- **Ejemplos:** ❌ No disponibles

### Después de Sprint 10
- **Documentación API:** ✅ Completa (87+ endpoints)
- **Swagger UI:** ✅ Funcionando con autenticación JWT
- **OpenAPI Spec:** ✅ JSON y YAML disponibles
- **Ejemplos:** ✅ Disponibles en Swagger UI
- **Búsqueda:** ✅ Filtro habilitado
- **Try It Out:** ✅ Habilitado

**Mejora:** De 0% a 100% de cobertura de documentación

---

## 🚀 Acceso a Swagger en Producción

### Verificar Swagger en Railway

**URL:** https://club-manegament-production.up.railway.app/swagger-ui.html

**Status Esperado:** ✅ Accesible (está en la whitelist de SecurityConfig)

**Test:**
```bash
curl -I https://club-manegament-production.up.railway.app/swagger-ui.html
# Esperado: HTTP/2 200
```

---

## 📚 Documentación de Schemas

Swagger también documenta todos los **modelos de datos (DTOs)**:

### Ejemplos de Schemas Documentados

1. **LoginRequest**
   ```json
   {
     "username": "string",
     "password": "string"
   }
   ```

2. **EventoDTO**
   ```json
   {
     "id": 0,
     "nombre": "string",
     "descripcion": "string",
     "fecha": "2025-01-01",
     "estado": "PLANIFICADO",
     "aforoMaximo": 0,
     "precioEntrada": 0.00
   }
   ```

3. **TransaccionRequest**
   ```json
   {
     "tipo": "INGRESO",
     "categoriaId": 0,
     "monto": 0.00,
     "descripcion": "string",
     "fecha": "2025-01-01",
     "eventoId": 0
   }
   ```

**Total Schemas:** ~50+ modelos documentados

---

## ✅ Checklist de Implementación

- [x] Dependencia SpringDoc OpenAPI agregada
- [x] Clase OpenApiConfig creada
- [x] Información del proyecto configurada
- [x] JWT Bearer authentication configurada
- [x] Servidores (dev + prod) agregados
- [x] Tags aplicados a controladores
- [x] Operaciones (@Operation) documentadas
- [x] Configuración en application.yml
- [x] Swagger UI habilitado
- [x] OpenAPI JSON/YAML disponibles
- [x] Try It Out habilitado
- [x] Filtro/búsqueda habilitado
- [x] Acceso en SecurityConfig permitido

**Estado:** ✅ 100% Completado

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Ejemplos Enriquecidos**
   - Agregar `@ExampleObject` a todos los endpoints
   - Incluir casos de error (400, 401, 404, 500)

2. **Grupos de Endpoints**
   - Agrupar endpoints por versión
   - `/api/v1/...` vs `/api/v2/...`

3. **Descripciones Mejoradas**
   - Agregar más detalles a cada operación
   - Documentar parámetros de query
   - Incluir códigos de estado HTTP

4. **Export OpenAPI Spec**
   - Exportar JSON para generación de clientes
   - Usar en Postman/Insomnia
   - Generar SDKs automáticos

5. **Validaciones Documentadas**
   - Mostrar validaciones en Swagger
   - Ejemplo: `@Size(min=3, max=100)`

---

## 🔗 Referencias

- [SpringDoc OpenAPI Docs](https://springdoc.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Spring Boot with Swagger](https://www.baeldung.com/spring-rest-openapi-documentation)

---

**Documento creado:** 12 Octubre 2025
**Sprint:** 10 - Optimización Final y Documentación
**Versión del sistema:** 0.3.1
**Mantenido por:** Equipo de desarrollo
