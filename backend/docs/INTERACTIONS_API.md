# API de Interacciones - Documentación

## Descripción
Sistema de gestión de interacciones con leads que permite crear un timeline completo de actividades, incluyendo llamadas, emails, reuniones, notas y recordatorios.

## Endpoints

### 1. Crear Interacción
**POST** `/api/interactions`

Crea una nueva interacción con un lead.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "lead_id": 123,
  "tipo": "llamada",
  "descripcion": "Llamada inicial para conocer necesidades",
  "usuario_id": 1,
  "fecha_proxima_accion": "2025-10-30T10:00:00Z",
  "recordatorio": true
}
```

**Tipos válidos:**
- `llamada` - Llamada telefónica
- `email` - Correo electrónico
- `reunion` - Reunión presencial o virtual
- `nota` - Nota o comentario
- `estado_cambio` - Cambio de estado (automático)
- `whatsapp` - Mensaje por WhatsApp

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Interacción creada exitosamente",
  "data": {
    "id": 456,
    "lead_id": 123,
    "tipo": "llamada",
    "descripcion": "Llamada inicial para conocer necesidades",
    "usuario_id": 1,
    "fecha_proxima_accion": "2025-10-30T10:00:00Z",
    "recordatorio": true,
    "completado": false,
    "fecha_creacion": "2025-10-26T13:36:00Z"
  }
}
```

---

### 2. Obtener Timeline de un Lead
**GET** `/api/interactions/lead/:leadId`

Obtiene todas las interacciones de un lead específico, ordenadas por fecha descendente.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "lead_id": 123,
      "tipo": "llamada",
      "descripcion": "Llamada inicial para conocer necesidades",
      "usuario_id": 1,
      "usuario_nombre": "Juan Pérez",
      "usuario_email": "juan@example.com",
      "fecha_proxima_accion": "2025-10-30T10:00:00Z",
      "recordatorio": true,
      "completado": false,
      "fecha_creacion": "2025-10-26T13:36:00Z"
    },
    {
      "id": 455,
      "lead_id": 123,
      "tipo": "nota",
      "descripcion": "Cliente muy interesado en eventos corporativos",
      "usuario_id": 1,
      "usuario_nombre": "Juan Pérez",
      "usuario_email": "juan@example.com",
      "recordatorio": false,
      "completado": true,
      "fecha_creacion": "2025-10-25T15:20:00Z",
      "fecha_completado": "2025-10-25T15:20:00Z"
    }
  ],
  "total": 2
}
```

---

### 3. Marcar Interacción como Completada
**PATCH** `/api/interactions/:id/complete`

Marca una interacción como completada.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Interacción marcada como completada",
  "data": {
    "id": 456,
    "lead_id": 123,
    "tipo": "llamada",
    "descripcion": "Llamada inicial para conocer necesidades",
    "completado": true,
    "fecha_completado": "2025-10-26T14:00:00Z"
  }
}
```

---

### 4. Obtener Recordatorios Pendientes
**GET** `/api/interactions/reminders`

Obtiene todas las interacciones con recordatorio activo que tienen fecha de acción próxima.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "lead_id": 123,
      "lead_nombre": "Empresa XYZ",
      "lead_email": "contacto@xyz.com",
      "tipo": "reunion",
      "descripcion": "Reunión para presentar propuesta",
      "usuario_id": 1,
      "usuario_nombre": "Juan Pérez",
      "usuario_email": "juan@example.com",
      "fecha_proxima_accion": "2025-10-27T09:00:00Z",
      "recordatorio": true,
      "completado": false
    }
  ],
  "total": 1,
  "message": "Tienes 1 recordatorio(s) pendiente(s)"
}
```

---

### 5. Obtener Estadísticas de Interacciones
**GET** `/api/interactions/stats/:leadId`

Obtiene estadísticas de interacciones por tipo para un lead específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "tipo": "llamada",
      "total": 5,
      "ultima_interaccion": "2025-10-26T13:36:00Z"
    },
    {
      "tipo": "email",
      "total": 3,
      "ultima_interaccion": "2025-10-25T10:00:00Z"
    },
    {
      "tipo": "reunion",
      "total": 2,
      "ultima_interaccion": "2025-10-20T14:30:00Z"
    }
  ]
}
```

---

### 6. Eliminar Interacción
**DELETE** `/api/interactions/:id`

Elimina una interacción específica.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Interacción eliminada exitosamente",
  "data": {
    "id": 456,
    "lead_id": 123,
    "tipo": "nota",
    "descripcion": "Nota eliminada"
  }
}
```

---

## Errores Comunes

### 400 Bad Request
```json
{
  "success": false,
  "message": "El tipo de interacción es requerido",
  "tiposValidos": ["llamada", "email", "reunion", "nota", "estado_cambio", "whatsapp"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No se proporcionó token de autenticación"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Interacción no encontrada"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error al crear interacción",
  "error": "Descripción del error"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear llamada con recordatorio
```bash
curl -X POST http://localhost:3000/api/interactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 123,
    "tipo": "llamada",
    "descripcion": "Seguimiento de propuesta enviada",
    "fecha_proxima_accion": "2025-10-28T15:00:00Z",
    "recordatorio": true
  }'
```

### Ejemplo 2: Obtener timeline de un lead
```bash
curl -X GET http://localhost:3000/api/interactions/lead/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ejemplo 3: Ver recordatorios pendientes
```bash
curl -X GET http://localhost:3000/api/interactions/reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ejemplo 4: Marcar interacción como completada
```bash
curl -X PATCH http://localhost:3000/api/interactions/456/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren autenticación mediante Bearer token.

2. **Usuario automático**: Si no se especifica `usuario_id`, se utiliza el ID del usuario autenticado.

3. **Fechas**: Las fechas deben estar en formato ISO 8601 (UTC).

4. **Tipos de interacción**: Los tipos están predefinidos y no se pueden crear tipos personalizados.

5. **Recordatorios**: Para que una interacción aparezca en recordatorios pendientes:
   - `recordatorio` debe ser `true`
   - `fecha_proxima_accion` debe ser válida y en el futuro
   - `completado` debe ser `false`

6. **Timeline ordenado**: Las interacciones se devuelven ordenadas por fecha de creación descendente (más recientes primero).

---

## Integración con Notificaciones

Cuando se crea un nuevo lead (mediante `POST /api/leads` o `POST /api/leads/public`), automáticamente se envía una notificación interna al equipo:

- Si está configurado `SLACK_WEBHOOK_URL`, se envía notificación a Slack
- Siempre se registra en consola para debugging

### Variables de Entorno Necesarias:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#leads
```
