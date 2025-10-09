# Registro de Errores Solucionados

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
