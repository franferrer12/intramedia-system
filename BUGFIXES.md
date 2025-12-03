# Registro de Errores Solucionados

📖 **Para troubleshooting detallado de errores de deployment, consulta:** [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)

---

## 2025-10-17 - Sistema POS Multi-Dispositivo: Correcciones Críticas

### Resumen de Sesión
Esta sesión resolvió múltiples problemas críticos en el sistema POS que impedían su correcto funcionamiento multi-dispositivo. Se implementaron fixes en validación de formularios, autenticación de dispositivos, sincronización offline y visualización de ventas.

### 1. Error 400 Bad Request al Editar Dispositivos POS

**Problema:**
Al intentar editar un dispositivo existente desde el backoffice, el sistema retornaba error 400 con mensaje "El PIN es obligatorio", bloqueando cualquier actualización del dispositivo.

**Síntomas:**
```
HTTP 400 Bad Request
Validation failed for object 'dispositivoPOSRequest' on field 'pin':
rejected value [null]; default message [El PIN es obligatorio]
```

**Causa Raíz:**
El DTO `DispositivoPOSRequest` tenía la anotación `@NotBlank(message = "El PIN es obligatorio")` en el campo `pin`, haciendo que el PIN fuera obligatorio tanto para **creación** como para **actualización** de dispositivos. Sin embargo, lógicamente el PIN solo debe ser obligatorio al crear un dispositivo nuevo, no al editarlo.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/dto/DispositivoPOSRequest.java` (línea 34)
- `backend/src/main/java/com/club/management/service/DispositivoPOSService.java` (líneas 44-47, 168-171)

**Solución Implementada:**

1. **Remover validación de DTO** y mover la lógica al servicio:

```java
// ANTES (DispositivoPOSRequest.java):
@NotBlank(message = "El PIN es obligatorio")
@Size(min = 4, max = 6, message = "El PIN debe tener entre 4 y 6 caracteres")
private String pin;

// DESPUÉS:
// PIN es opcional en actualizaciones - obligatorio solo en creación (validado en servicio)
@Size(min = 4, max = 6, message = "El PIN debe tener entre 4 y 6 caracteres")
private String pin;
```

2. **Validación manual en el método de creación**:

```java
// DispositivoPOSService.java - método registrar()
public DispositivoPOSDTO registrar(DispositivoPOSRequest request) {
    // Validar que el PIN sea obligatorio en la creación
    if (request.getPin() == null || request.getPin().trim().isEmpty()) {
        throw new IllegalArgumentException("El PIN es obligatorio al crear un dispositivo");
    }
    // ... resto del código
}
```

3. **Actualización condicional del PIN** (ya existía correctamente):

```java
// DispositivoPOSService.java - método actualizar()
public DispositivoPOSDTO actualizar(Long id, DispositivoPOSRequest request) {
    // ...
    // Actualizar PIN solo si se proporciona uno nuevo
    if (request.getPin() != null && !request.getPin().isEmpty()) {
        dispositivo.setPinRapido(passwordEncoder.encode(request.getPin()));
    }
    // ...
}
```

**Resultado:**
✅ Dispositivos pueden editarse sin proporcionar PIN
✅ PIN sigue siendo obligatorio al crear nuevos dispositivos
✅ Validación de longitud (4-6 caracteres) se mantiene cuando se proporciona

---

### 2. Empleados No Asignados Automáticamente al Autenticar Dispositivos

**Problema:**
Dispositivos con empleados asignados permanentemente seguían pidiendo selección de empleado al momento de cobrar, a pesar de tener un empleado configurado en la base de datos.

**Síntomas:**
- Base de datos muestra `empleado_asignado_id = 2` (María)
- Frontend muestra "Seleccione empleado" en PaymentMethodModal
- La información del empleado no llega al frontend tras autenticación

**Causa Raíz:**
El método `buildDeviceAuthDTO()` en `DispositivoPOSService.java` no incluía los campos de empleado asignado (`empleadoAsignadoId` y `empleadoAsignadoNombre`) en el DTO de respuesta de autenticación, por lo que el frontend nunca recibía esta información.

**Archivos Afectados:**
- `backend/src/main/java/com/club/management/dto/response/DeviceAuthDTO.java` (líneas 27-38)
- `backend/src/main/java/com/club/management/service/DispositivoPOSService.java` (líneas 338-364)

**Solución Implementada:**

1. **Añadir campos al DTO**:

```java
// DeviceAuthDTO.java - clase DeviceInfoDTO
public static class DeviceInfoDTO {
    private Long id;
    private String uuid;
    private String nombre;
    private String tipo;
    private String ubicacion;
    private Long empleadoAsignadoId;         // ✅ NUEVO
    private String empleadoAsignadoNombre;   // ✅ NUEVO
    private Boolean asignacionPermanente;
    private Boolean modoTabletCompartida;
    private DeviceConfigDTO config;
}
```

2. **Poblar campos en el método de construcción**:

```java
// DispositivoPOSService.java - método buildDeviceAuthDTO()
private DeviceAuthDTO buildDeviceAuthDTO(DispositivoPOS dispositivo, String deviceToken) {
    return DeviceAuthDTO.builder()
            .success(true)
            .deviceUUID(dispositivo.getUuid())
            .deviceToken(deviceToken)
            .device(DeviceAuthDTO.DeviceInfoDTO.builder()
                    .id(dispositivo.getId())
                    .uuid(dispositivo.getUuid())
                    .nombre(dispositivo.getNombre())
                    .tipo(dispositivo.getTipo() != null ? dispositivo.getTipo().name() : null)
                    .ubicacion(dispositivo.getUbicacion())
                    // ✅ NUEVO: Incluir información del empleado asignado
                    .empleadoAsignadoId(dispositivo.getEmpleadoAsignado() != null ?
                            dispositivo.getEmpleadoAsignado().getId() : null)
                    .empleadoAsignadoNombre(dispositivo.getEmpleadoAsignado() != null ?
                            dispositivo.getEmpleadoAsignado().getNombre() + " " +
                            dispositivo.getEmpleadoAsignado().getApellidos() : null)
                    .asignacionPermanente(dispositivo.getAsignacionPermanente())
                    .modoTabletCompartida(dispositivo.getModoTabletCompartida())
                    .config(/* ... */)
                    .build())
            .build();
}
```

**Resultado:**
✅ Empleados asignados permanentemente se pre-seleccionan automáticamente
✅ No es necesario seleccionar empleado manualmente en dispositivos con asignación fija
✅ Dispositivos en modo compartido siguen permitiendo selección manual

---

### 3. Ventas Corruptas Bloqueando Sincronización y Eliminación de Dispositivos

**Problema:**
Múltiples dispositivos tenían ventas pendientes de sincronización que fallaban repetidamente con el error "No se pudo determinar el empleado", bloqueando tanto la sincronización como la eliminación de dispositivos.

**Síntomas:**

**En Frontend (IndexedDB):**
```javascript
debugPOS() // En consola del navegador
// Mostraba 2-3 ventas con: sincronizada: false, empleadoId: undefined
```

**En Backend (logs):**
```json
{
  "uuidVenta": "1eef609e-6b05-4a1f-b895-246e911e1bd9-1760653478094-ni8kdoo1n",
  "exitoso": false,
  "ventaId": null,
  "mensaje": "Error al sincronizar venta",
  "error": "No se pudo determinar el empleado: ni en datosVenta ni en dispositivo"
}
```

**En Base de Datos:**
```sql
SELECT uuid_venta, sincronizada, empleado_id, intentos_sincronizacion
FROM ventas_pendientes_sync
WHERE dispositivo_id = 9;
-- Resultado: 3 ventas con empleado_id = NULL, intentos = 6-10 (máximo alcanzado)
```

**Cuando intentaban eliminar dispositivo:**
```
HTTP 500 Internal Server Error
java.lang.IllegalStateException: No se puede eliminar el dispositivo.
Tiene 3 ventas pendientes de sincronización
```

**Causa Raíz:**
Las ventas se crearon **antes** de que se implementara la validación de empleado obligatorio. El sistema permite crear ventas sin empleado en modo offline, pero luego no puede sincronizarlas porque el backend requiere empleado. Estas ventas quedan "atrapadas" en un ciclo de reintentos fallidos.

**Flujo del problema:**
```
1. Usuario crea venta sin seleccionar empleado (antes del fix)
2. Venta se guarda en IndexedDB local (sincronizada: false)
3. Sistema intenta sincronizar → Backend rechaza (falta empleado)
4. Incrementa intentos_sincronizacion (1, 2, 3... hasta 10)
5. Después de 10 intentos, se detiene pero la venta queda pendiente
6. Usuario intenta eliminar dispositivo → Backend lo bloquea (tiene ventas pendientes)
```

**Archivos/Tablas Afectadas:**
- **Frontend:** IndexedDB `POSOfflineDB.ventasPendientes`
- **Backend:** Tabla `ventas_pendientes_sync`
- `frontend/src/utils/offlineDB.ts` (funciones de limpieza)
- `frontend/src/utils/debugIndexedDB.ts` (funciones de debug)

**Solución Implementada:**

**Parte 1: Función de limpieza en IndexedDB (Frontend)**

```typescript
// offlineDB.ts - Nueva función exportada
export const limpiarVentasCorruptas = async (): Promise<number> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
      const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);
      const request = store.getAll();

      request.onsuccess = async () => {
        const ventas = request.result || [];
        let eliminadas = 0;

        for (const venta of ventas) {
          // Eliminar ventas sin empleadoId
          if (!venta.empleadoId && venta.id) {
            try {
              await deleteVentaPendiente(venta.id);
              console.log('🗑️ Venta corrupta eliminada (sin empleadoId):', venta.uuid);
              eliminadas++;
            } catch (error) {
              console.error('Error al eliminar venta corrupta:', error);
            }
          }
        }

        resolve(eliminadas);
      };

      request.onerror = () => {
        console.warn('Error al obtener ventas para limpieza');
        resolve(0);
      };
    });
  } catch (error) {
    console.warn('Error en limpieza de ventas corruptas:', error);
    return 0;
  }
};
```

**Parte 2: Exposición global para debugging**

```typescript
// debugIndexedDB.ts
export const limpiarVentasCorruptas = (): Promise<number> => {
  console.log('🧹 LIMPIANDO VENTAS CORRUPTAS (sin empleadoId)...');
  // ... implementación similar
};

// Exponer funciones globalmente en desarrollo
if (typeof window !== 'undefined') {
  (window as any).debugPOS = debugPendientes;
  (window as any).eliminarVenta = eliminarVenta;
  (window as any).limpiarVentasPOS = limpiarTodasLasVentas;
  (window as any).limpiarVentasCorruptas = limpiarVentasCorruptas; // ✅ NUEVO
  console.log('Funciones de debug POS disponibles:');
  console.log('- debugPOS() - Ver ventas pendientes');
  console.log('- eliminarVenta(id) - Eliminar una venta específica');
  console.log('- limpiarVentasPOS() - Limpiar TODAS las ventas');
  console.log('- limpiarVentasCorruptas() - Limpiar ventas sin empleadoId'); // ✅ NUEVO
}
```

**Parte 3: Limpieza directa en base de datos (Backend)**

Para dispositivos con ventas corruptas ya sincronizadas parcialmente al backend:

```sql
-- Comando ejecutado para limpiar base de datos
DELETE FROM ventas_pendientes_sync
WHERE dispositivo_id = 9
  AND sincronizada = false
  AND empleado_id IS NULL;

-- Resultado: DELETE 3 (3 ventas corruptas eliminadas)
```

**Proceso de Limpieza Completa:**

1. **Limpieza IndexedDB (navegador):**
```javascript
// En DevTools Console
limpiarVentasCorruptas()
// Output: "✅ Limpieza completada: 2 ventas eliminadas"
```

2. **Limpieza Backend (base de datos):**
```sql
-- Ejecutado desde pgAdmin o psql
DELETE FROM ventas_pendientes_sync
WHERE dispositivo_id = [ID]
  AND sincronizada = false
  AND empleado_id IS NULL;
```

3. **Verificación:**
```javascript
debugPOS()  // No debe mostrar ventas pendientes
```

**Resultado:**
✅ Ventas corruptas eliminadas de ambos lados (frontend + backend)
✅ Dispositivos pueden sincronizar correctamente
✅ Dispositivos pueden ser eliminados sin errores
✅ Sistema de debugging disponible para futuras inspecciones

**Prevención Futura:**
- El frontend ahora valida empleado antes de crear ventas
- PaymentMethodModal requiere empleado seleccionado
- Dispositivos con asignación permanente pre-seleccionan empleado

---

### 4. Sistema Multi-Dispositivo: Identificación de Terminal en Ventas

**Problema:**
En el panel de gestión POS, la sección "Últimas Ventas" no mostraba qué terminal había procesado cada venta, dificultando el seguimiento multi-dispositivo.

**Síntomas:**
```
Últimas Ventas:
- Ticket #VTA-20251017-0001
  María González • 17/10 23:45
  15.50€ EFECTIVO

- Ticket #VTA-20251017-0002
  Juan Pérez • 17/10 23:50
  28.00€ TARJETA
```
No se podía distinguir si "María" había cobrado en "Barra Principal" o "Barra VIP".

**Impacto:**
- Difícil auditar qué terminal procesó cada venta
- No se puede ver distribución de ventas por dispositivo
- Confusión cuando múltiples dispositivos operan simultáneamente

**Causa Raíz:**
El componente `PosPage.tsx` mostraba solo el nombre del empleado y la fecha/hora, pero no accedía al campo `sesionCajaNombre` que ya estaba disponible en el DTO de venta.

**Archivos Afectados:**
- `frontend/src/pages/pos/PosPage.tsx` (líneas 316-327)
- `backend/src/main/java/com/club/management/dto/VentaDTO.java` (ya tenía el campo)

**Solución Implementada:**

```tsx
// PosPage.tsx - Sección de Últimas Ventas
<div>
  <p className="font-semibold text-gray-900">
    Ticket #{venta.numeroTicket}
  </p>
  <p className="text-sm text-gray-600">
    {venta.empleadoNombre}
    {venta.sesionCajaNombre && (
      <span className="text-blue-600 font-medium">
        {' • '}{venta.sesionCajaNombre}
      </span>
    )}
    {' • '}{formatDateTime(venta.fecha)}
  </p>
</div>
```

**Resultado Visual:**
```
Últimas Ventas:
- Ticket #VTA-20251017-0001
  María González • Barra Principal • 17/10 23:45
  15.50€ EFECTIVO

- Ticket #VTA-20251017-0002
  Juan Pérez • Barra VIP • 17/10 23:50
  28.00€ TARJETA
```

**Resultado:**
✅ Identificación clara de terminal en cada venta
✅ Nombre del terminal en azul para destacar visualmente
✅ Soporte completo para operación multi-dispositivo
✅ Mejor trazabilidad y auditoría de ventas

---

### 5. Tokens Antiguos de Dispositivos Eliminados Causando Errores 401

**Problema:**
El backend mostraba errores continuos de autenticación para un dispositivo que ya no existía en la base de datos.

**Síntomas:**
```
Backend logs (cada 30 segundos):
2025-10-16 23:09:22 - JWT Filter: Exception occurred:
Usuario no encontrado: device:ae94e739-6333-4795-ac6b-72a17f6e74ec
org.springframework.security.core.userdetails.UsernameNotFoundException
```

**Causa Raíz:**
Cuando un dispositivo es eliminado, su token JWT sigue almacenado en `localStorage` del navegador. Si alguna pestaña o proceso del frontend sigue abierto, continúa enviando peticiones con ese token, causando errores de autenticación continuos.

**Archivos/Storage Afectados:**
- `localStorage` del navegador (keys: `device_uuid`, `device_token`, `deviceInfo`)

**Solución Implementada:**

**Opción 1: Limpieza manual (DevTools Console)**
```javascript
localStorage.removeItem('device_uuid');
localStorage.removeItem('device_token');
localStorage.removeItem('deviceInfo');
```

**Opción 2: Limpieza visual (DevTools)**
1. F12 → Application tab → Local Storage
2. Seleccionar http://localhost:5173
3. Eliminar claves relacionadas con dispositivos

**Resultado:**
✅ No más errores 401 en backend logs
✅ Frontend puede autenticar dispositivos nuevos sin conflictos
✅ Sistema de tokens limpio

---

## Resumen de Cambios de Código

### Backend

**Archivos Modificados:**

1. **DispositivoPOSRequest.java**
```java
- @NotBlank(message = "El PIN es obligatorio")
+ // PIN es opcional en actualizaciones - obligatorio solo en creación (validado en servicio)
  @Size(min = 4, max = 6, message = "El PIN debe tener entre 4 y 6 caracteres")
  private String pin;
```

2. **DispositivoPOSService.java**
```java
// Método registrar() - líneas 44-47
+ if (request.getPin() == null || request.getPin().trim().isEmpty()) {
+     throw new IllegalArgumentException("El PIN es obligatorio al crear un dispositivo");
+ }

// Método buildDeviceAuthDTO() - líneas 349-352
+ .empleadoAsignadoId(dispositivo.getEmpleadoAsignado() != null ?
+         dispositivo.getEmpleadoAsignado().getId() : null)
+ .empleadoAsignadoNombre(dispositivo.getEmpleadoAsignado() != null ?
+         dispositivo.getEmpleadoAsignado().getNombre() + " " +
+         dispositivo.getEmpleadoAsignado().getApellidos() : null)
```

3. **DeviceAuthDTO.java**
```java
public static class DeviceInfoDTO {
    private Long id;
    private String uuid;
    private String nombre;
    private String tipo;
    private String ubicacion;
+   private Long empleadoAsignadoId;
+   private String empleadoAsignadoNombre;
    private Boolean asignacionPermanente;
    private Boolean modoTabletCompartida;
    private DeviceConfigDTO config;
}
```

### Frontend

**Archivos Modificados:**

1. **PosPage.tsx**
```tsx
<p className="text-sm text-gray-600">
  {venta.empleadoNombre}
+ {venta.sesionCajaNombre && (
+   <span className="text-blue-600 font-medium">
+     {' • '}{venta.sesionCajaNombre}
+   </span>
+ )}
  {' • '}{formatDateTime(venta.fecha)}
</p>
```

2. **offlineDB.ts**
```typescript
+ export const limpiarVentasCorruptas = async (): Promise<number> => {
+   // Elimina ventas sin empleadoId de IndexedDB
+   // Implementación completa en líneas 387-424
+ };
```

3. **debugIndexedDB.ts**
```typescript
+ export const limpiarVentasCorruptas = (): Promise<number> => {
+   // Versión debug con logging detallado
+   // Implementación completa en líneas 131-174
+ };

+ (window as any).limpiarVentasCorruptas = limpiarVentasCorruptas;
```

### Base de Datos

**Queries de Limpieza Ejecutadas:**

```sql
-- Eliminar ventas corruptas de dispositivos específicos
DELETE FROM ventas_pendientes_sync
WHERE dispositivo_id IN (2, 9)
  AND sincronizada = false
  AND empleado_id IS NULL;

-- Total eliminado: 5 ventas corruptas
```

---

## Comandos de Verificación y Debugging

### Verificar Ventas Pendientes (Frontend)
```javascript
// En DevTools Console del navegador
debugPOS()  // Ver todas las ventas pendientes en IndexedDB
```

### Limpiar Ventas Corruptas (Frontend)
```javascript
limpiarVentasCorruptas()  // Eliminar ventas sin empleado
```

### Verificar Ventas Pendientes (Backend)
```sql
-- En pgAdmin o psql
SELECT id, uuid_venta, sincronizada, empleado_id, intentos_sincronizacion, error_sincronizacion
FROM ventas_pendientes_sync
WHERE dispositivo_id = [ID_DISPOSITIVO]
  AND sincronizada = false;
```

### Limpiar Ventas Corruptas (Backend)
```sql
DELETE FROM ventas_pendientes_sync
WHERE dispositivo_id = [ID_DISPOSITIVO]
  AND sincronizada = false
  AND empleado_id IS NULL;
```

### Verificar Dispositivos
```sql
SELECT id, nombre, uuid, empleado_asignado_id, modo_tablet_compartida, activo
FROM dispositivos_pos
ORDER BY id;
```

### Limpiar Tokens de localStorage
```javascript
// En DevTools Console
localStorage.removeItem('device_uuid');
localStorage.removeItem('device_token');
localStorage.removeItem('deviceInfo');
```

---

## Proceso de Recompilación Backend

```bash
# 1. Detener backend
docker-compose stop backend

# 2. Reconstruir imagen con nuevos cambios
docker-compose build backend

# 3. Iniciar backend
docker-compose up -d backend

# 4. Verificar logs
docker logs club_backend --tail 50

# 5. Verificar salud
docker ps --filter name=club_backend
# Debe mostrar: (healthy)
```

**Tiempo de compilación:** ~3 minutos 46 segundos

**Resultado:**
```
BUILD SUCCESS
Total time:  03:46 min
Container: club_backend
Status: Up 2 minutes (healthy)
```

---

## Lecciones Aprendidas

### 1. Validación Contextual
**Problema:** Validaciones de Bean Validation (`@NotBlank`) aplican a todos los contextos.

**Solución:** Para validaciones que dependen del contexto (crear vs actualizar), mover la validación al servicio en lugar del DTO.

**Alternativa:** Usar grupos de validación (`@NotBlank(groups = Create.class)`) pero requiere más configuración.

### 2. DTOs de Respuesta Completos
**Problema:** DTOs de autenticación que no incluyen toda la información necesaria causan problemas en el frontend.

**Solución:** Asegurar que los DTOs de respuesta incluyan toda la información que el frontend necesita para operar, especialmente en flujos de autenticación donde se inicializa el estado.

### 3. Limpieza de Datos Corruptos
**Problema:** Datos corruptos en sistemas offline pueden acumularse y causar bloqueos.

**Solución:**
- Implementar herramientas de debugging (`debugPOS()`)
- Crear funciones de limpieza automática (`limpiarVentasCorruptas()`)
- Documentar comandos SQL para limpieza manual
- Validar datos antes de permitir operaciones offline

### 4. Prevención > Corrección
**Problema:** Era posible crear ventas sin empleado en modo offline.

**Solución Preventiva:**
- Validar empleado en frontend antes de permitir guardar venta
- Pre-seleccionar empleado automáticamente cuando esté asignado al dispositivo
- Mostrar errores claros cuando falte información requerida

### 5. Multi-Dispositivo Requiere Trazabilidad
**Problema:** Sin identificador de terminal, es difícil auditar operaciones multi-dispositivo.

**Solución:** Incluir información del terminal/dispositivo en todas las transacciones y mostrarla en interfaces de gestión.

---

## Estado Final del Sistema

✅ **Edición de dispositivos:** Funciona sin requerir PIN
✅ **Asignación de empleados:** Se respeta y pre-selecciona automáticamente
✅ **Sincronización offline:** Ventas se sincronizan correctamente con empleado
✅ **Multi-dispositivo:** Ventas muestran qué terminal las procesó
✅ **Limpieza de datos:** Herramientas disponibles para debugging y limpieza
✅ **Eliminación de dispositivos:** Funciona correctamente sin ventas pendientes

**Próximos pasos sugeridos:**
1. Implementar monitor de dispositivos conectados en tiempo real
2. Crear métricas y reportes de consumo por terminal
3. Dashboard de ranking de productos más vendidos por dispositivo

---

## 2025-10-12 - Implementación Sistema de Venta Dual

### Sistema de Venta Dual (Copa + Botella VIP)

**Feature Implementada:**
Sistema completo de venta dual que permite vender el mismo producto de dos formas diferentes: copa individual en barra o botella completa en zona VIP.

**Archivos Modificados/Creados:**

Backend:
- ✅ `backend/src/main/java/com/club/management/entity/Producto.java` - Agregados campos venta dual
- ✅ `backend/src/main/java/com/club/management/service/ProductoService.java` - Mapeo de campos duales
- ✅ `backend/src/main/java/com/club/management/dto/response/ProductoDTO.java` - DTOs con campos calculados
- ✅ `backend/src/main/resources/db/migration/V023__add_venta_dual.sql` - Schema + vista valor_inventario_dual

Frontend:
- ✅ `frontend/src/types/index.ts` - Interfaces TypeScript actualizadas
- ✅ `frontend/src/components/productos/ProductoModal.tsx` - Sección de venta dual con validación
- ✅ `frontend/src/components/pos/ModalTipoVenta.tsx` - Modal de selección copa/VIP (NUEVO)
- ✅ `frontend/src/pages/pos/POSTerminalPage.tsx` - Integración con carrito

Ayuda/Documentación:
- ✅ `frontend/src/pages/ayuda/AyudaPage.tsx` - Tutorial completo (41 pasos)
- ✅ `frontend/src/components/tours/tour-configs.ts` - Tour interactivo (7 pasos)

**Características Implementadas:**
1. **Configuración de producto dual:**
   - Copas por botella (ej: 15 copas)
   - Precio por copa (ej: 8.00€)
   - Precio botella VIP (ej: 120.00€)
   - Comparación visual automática de rentabilidad

2. **Modal de selección en POS:**
   - Se abre automáticamente al agregar producto con venta dual
   - Muestra comparación lado a lado (Copa vs VIP)
   - Badge "RECOMENDADO" en la opción más rentable
   - Cálculo en tiempo real de ingresos potenciales

3. **Gestión en carrito:**
   - Items separados por tipo de venta (COPA vs VIP)
   - Badge visual en carrito mostrando el tipo
   - Permite vender ambas modalidades en la misma transacción

4. **Vista de base de datos:**
   - Vista `valor_inventario_dual` para análisis
   - Índice en productos con venta dual
   - Recomendación automática de mejor opción

5. **Sistema de ayuda:**
   - Tutorial completo de 6 minutos con 41 pasos
   - Tour interactivo con 7 pasos guiados
   - Atributos data-tour para navegación

**Validaciones Implementadas:**
- ✅ Campos obligatorios cuando esVentaDual = true
- ✅ Copas por botella > 0
- ✅ Precio copa > 0
- ✅ Precio botella VIP > 0
- ✅ Capacidad ML obligatoria para venta dual

**Testing:**
- ✅ Build frontend exitoso (1,323 KB bundle)
- ✅ No hay errores de compilación
- ✅ TypeScript validación completa

**Commit:**
```
feat: Implementar sistema de venta dual (Copa + Botella VIP)

Backend:
- Agregados campos venta dual a Producto entity
- Métodos @Transient para cálculos (ingreso potencial, margen, mejor opción)
- Migración V023 con vista valor_inventario_dual
- DTOs actualizados con campos calculados

Frontend:
- Sección venta dual en ProductoModal con validación
- ModalTipoVenta para selección copa/VIP en POS
- Integración con carrito (items separados por tipo)
- Badges visuales y comparación en tiempo real

Ayuda:
- Tutorial completo de 6 minutos (41 pasos)
- Tour interactivo con 7 pasos guiados
- data-tour attributes para navegación

Permite vender mismo producto como:
- COPA: Servicio individual en barra
- VIP: Botella completa en zona reservados
Con recomendación automática de opción más rentable
```

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
