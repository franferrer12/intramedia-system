# API de Jornadas de Trabajo - Documentación

## Descripción
Módulo completo para la gestión de jornadas de trabajo de empleados, con cálculo automático de horas y pagos.

## Características Principales

### Cálculo Automático de Horas
- **Turnos normales**: Calcula correctamente las horas entre hora de inicio y fin
- **Turnos nocturnos**: Maneja turnos que cruzan la medianoche (ej: 23:00 a 03:00 = 4 horas)
- **Precisión**: Cálculo con precisión de 2 decimales

### Cálculo Automático de Pago
- **Fórmula**: `total_pago = horas_trabajadas * precio_hora`
- **Precio por defecto**: Si no se especifica, usa `salario_base / 160` (asumiendo 160 horas mensuales)

## Endpoints Disponibles

### 1. Obtener Todas las Jornadas
```
GET /api/jornadas
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

---

### 2. Obtener Jornada por ID
```
GET /api/jornadas/{id}
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

---

### 3. Obtener Jornadas por Empleado
```
GET /api/jornadas/empleado/{empleadoId}
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

---

### 4. Obtener Jornadas Pendientes de Pago
```
GET /api/jornadas/pendientes
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, LECTURA

---

### 5. Obtener Jornadas Pendientes por Empleado
```
GET /api/jornadas/pendientes/empleado/{empleadoId}
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

---

### 6. Obtener Jornadas por Periodo
```
GET /api/jornadas/periodo/{periodo}
```
**Parámetros**:
- `periodo`: Formato YYYY-MM (ej: "2025-10")

**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

**Ejemplo**:
```
GET /api/jornadas/periodo/2025-10
```

---

### 7. Obtener Jornadas por Fecha
```
GET /api/jornadas/fecha/{fecha}
```
**Parámetros**:
- `fecha`: Formato ISO (YYYY-MM-DD)

**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

---

### 8. Obtener Jornadas por Rango de Fechas
```
GET /api/jornadas/rango?fechaInicio={inicio}&fechaFin={fin}
```
**Parámetros**:
- `fechaInicio`: Formato ISO (YYYY-MM-DD)
- `fechaFin`: Formato ISO (YYYY-MM-DD)

**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

**Ejemplo**:
```
GET /api/jornadas/rango?fechaInicio=2025-10-01&fechaFin=2025-10-31
```

---

### 9. Obtener Jornadas por Evento
```
GET /api/jornadas/evento/{eventoId}
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

---

### 10. Estadísticas por Empleado
```
GET /api/jornadas/stats/empleado/{empleadoId}
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA

**Respuesta**:
```json
{
  "totalPendiente": 450.00,
  "horasMesActual": 40.00,
  "totalPagadoMesActual": 600.00,
  "cantidadPendientes": 3,
  "empleadoNombre": "Juan Pérez"
}
```

---

### 11. Estadísticas Generales
```
GET /api/jornadas/stats/general
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, LECTURA

**Respuesta**:
```json
{
  "totalPendiente": 2500.00,
  "cantidadPendientes": 15
}
```

---

### 12. Crear Jornada
```
POST /api/jornadas
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO

**Request Body**:
```json
{
  "empleadoId": 1,
  "fecha": "2025-10-06",
  "horaInicio": "22:00:00",
  "horaFin": "04:00:00",
  "precioHora": 15.00,
  "eventoId": 5,
  "metodoPago": "TRANSFERENCIA",
  "notas": "Turno especial Halloween"
}
```

**Nota**:
- `precioHora` es opcional. Si no se especifica, se calcula automáticamente desde el salario base del empleado
- `horasTrabajadas` y `totalPago` se calculan automáticamente
- En el ejemplo anterior: 22:00 a 04:00 = 6 horas × 15€ = 90€

---

### 13. Actualizar Jornada
```
PUT /api/jornadas/{id}
```
**Roles permitidos**: ADMIN, GERENTE, RRHH, ENCARGADO

**Request Body**: Similar a crear jornada

---

### 14. Marcar como Pagada
```
PATCH /api/jornadas/{id}/pagar
```
**Roles permitidos**: ADMIN, GERENTE, RRHH

**Request Body**:
```json
{
  "metodoPago": "TRANSFERENCIA"
}
```

**Nota**: Establece automáticamente `pagado = true` y `fechaPago = fecha actual`

---

### 15. Pagar Múltiples Jornadas
```
POST /api/jornadas/pagar-multiples
```
**Roles permitidos**: ADMIN, GERENTE, RRHH

**Request Body**:
```json
{
  "jornadaIds": [1, 2, 3, 4],
  "metodoPago": "TRANSFERENCIA"
}
```

**Respuesta**: Array de jornadas actualizadas

---

### 16. Eliminar Jornada
```
DELETE /api/jornadas/{id}
```
**Roles permitidos**: ADMIN, GERENTE

---

## Estructura del DTO de Respuesta

```json
{
  "id": 1,
  "empleadoId": 10,
  "empleadoNombre": "Juan Pérez García",
  "empleadoDni": "12345678A",
  "fecha": "2025-10-06",
  "horaInicio": "23:00:00",
  "horaFin": "03:00:00",
  "horasTrabajadas": 4.00,
  "precioHora": 15.00,
  "totalPago": 60.00,
  "pagado": false,
  "fechaPago": null,
  "metodoPago": "EFECTIVO",
  "eventoId": 5,
  "eventoNombre": "Halloween Party",
  "notas": "Turno nocturno especial",
  "creadoEn": "2025-10-06T10:30:00",
  "actualizadoEn": "2025-10-06T10:30:00"
}
```

## Ejemplos de Cálculo de Horas

### Turno Normal
- **Entrada**: 09:00 a 17:00
- **Cálculo**: 17:00 - 09:00 = 8 horas
- **Resultado**: 8.00 horas

### Turno Nocturno (cruza medianoche)
- **Entrada**: 23:00 a 03:00
- **Cálculo**: (24:00 - 23:00) + (03:00 - 00:00) = 1 + 3 = 4 horas
- **Resultado**: 4.00 horas

### Turno Largo Nocturno
- **Entrada**: 22:00 a 06:00
- **Cálculo**: (24:00 - 22:00) + (06:00 - 00:00) = 2 + 6 = 8 horas
- **Resultado**: 8.00 horas

### Turno con Minutos
- **Entrada**: 09:30 a 14:45
- **Cálculo**: Conversión a segundos y división por 3600
- **Resultado**: 5.25 horas

## Casos de Uso Comunes

### 1. Registrar turno de empleado en un evento
```bash
# Crear jornada
POST /api/jornadas
{
  "empleadoId": 5,
  "fecha": "2025-10-12",
  "horaInicio": "23:00:00",
  "horaFin": "05:00:00",
  "eventoId": 10
}
# El sistema calcula automáticamente: 6 horas × precio_hora
```

### 2. Consultar jornadas pendientes de un empleado
```bash
GET /api/jornadas/pendientes/empleado/5
```

### 3. Ver estadísticas del mes actual
```bash
GET /api/jornadas/stats/empleado/5
```

### 4. Pagar todas las jornadas pendientes de septiembre
```bash
# Primero obtener las jornadas
GET /api/jornadas/periodo/2025-09

# Luego pagar múltiples
POST /api/jornadas/pagar-multiples
{
  "jornadaIds": [15, 16, 17, 18, 19],
  "metodoPago": "TRANSFERENCIA"
}
```

### 5. Consultar jornadas de un evento específico
```bash
GET /api/jornadas/evento/10
```

## Validaciones

### Request de Creación/Actualización
- **empleadoId**: Obligatorio, debe existir
- **fecha**: Obligatoria
- **horaInicio**: Obligatoria
- **horaFin**: Obligatoria
- **precioHora**: Opcional, debe ser >= 0
- **metodoPago**: Máximo 50 caracteres
- **eventoId**: Opcional, debe existir si se proporciona

### Reglas de Negocio
1. El empleado debe existir en la base de datos
2. Si se proporciona `eventoId`, el evento debe existir
3. Las horas trabajadas se calculan automáticamente
4. El total de pago se calcula automáticamente
5. Si no se especifica `precioHora`, se usa el salario base del empleado dividido por 160
6. Al marcar como pagada, se establece automáticamente la fecha de pago actual

## Seguridad y Roles

- **ADMIN**: Acceso total, puede eliminar jornadas
- **GERENTE**: Puede crear, actualizar, pagar y eliminar jornadas
- **RRHH**: Puede crear, actualizar y pagar jornadas
- **ENCARGADO**: Puede crear y actualizar jornadas, consultar por empleado
- **LECTURA**: Solo puede consultar

## Notas Técnicas

### Cálculo de Horas que Cruzan Medianoche
```java
// Si horaFin < horaInicio, el turno cruza medianoche
segundosTrabajados = (86400 - segundosInicio) + segundosFin;
// Donde 86400 = 24 horas × 3600 segundos
```

### Precisión Decimal
- Todas las cantidades monetarias usan `BigDecimal` con escala 2
- Las horas trabajadas tienen precisión de 2 decimales
- Redondeo: `HALF_UP` (redondeo bancario estándar)

### Transaccionalidad
- Todas las operaciones de escritura son transaccionales
- Las operaciones de lectura son `@Transactional(readOnly = true)`
- El pago múltiple es atómico: o se pagan todas o ninguna

## Archivos Implementados

1. **JornadaTrabajoService.java** - `D:\club-management\backend\src\main\java\com\club\management\service\`
2. **JornadaTrabajoController.java** - `D:\club-management\backend\src\main\java\com\club\management\controller\`

## Archivos Pre-existentes (utilizados)

1. **JornadaTrabajo.java** - Entidad
2. **JornadaTrabajoRepository.java** - Repositorio con queries personalizadas
3. **JornadaTrabajoRequest.java** - DTO de entrada
4. **JornadaTrabajoDTO.java** - DTO de salida
5. **V007__create_jornadas_trabajo_table.sql** - Migración de base de datos
