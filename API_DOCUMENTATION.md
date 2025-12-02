# 📘 API Documentation
## Intra Media System REST API v2.3.0

**Base URL:** `http://localhost:3000/api`
**Production:** `https://api.intramedia.com/api`
**Swagger UI:** `http://localhost:3000/api-docs`

---

## 🔐 Authentication

### POST /api/auth/login
Login and obtain JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "nombre": "Admin",
      "role": "admin"
    }
  }
}
```

**Usage:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Use token in subsequent requests
curl http://localhost:3000/api/eventos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📅 Eventos

### GET /api/eventos
List all events with pagination and filtering.

**Query Parameters:**
- `limit` (number): Results per page (default: 20, max: 100)
- `offset` (number): Starting position (default: 0)
- `fecha_desde` (date): Filter from date
- `fecha_hasta` (date): Filter to date
- `estado` (string): Filter by status (pending|confirmed|completed|cancelled)
- `dj_id` (number): Filter by DJ
- `cliente_id` (number): Filter by client
- `search` (string): Full-text search

**Example:**
```bash
curl http://localhost:3000/api/eventos?limit=10&estado=confirmed&fecha_desde=2025-01-01 \
  -H "Authorization: Bearer TOKEN"
```

### POST /api/eventos
Create new event.

**Request:**
```json
{
  "evento": "Boda María & Carlos",
  "fecha": "2025-12-25T20:00:00Z",
  "ubicacion": "Hotel Gran Meliá, Madrid",
  "dj_id": 5,
  "cliente_id": 10,
  "precio_acordado": 1500.00,
  "comision_agencia": 450.00,
  "comision_dj": 1050.00,
  "duracion_minutos": 300,
  "estado": "pending"
}
```

### PUT /api/eventos/:id
Update event.

### DELETE /api/eventos/:id
Delete event (soft delete).

---

## 🎧 DJs

### GET /api/djs
List all DJs.

**Query Parameters:**
- `limit`, `offset`: Pagination
- `active` (boolean): Filter active/inactive
- `search`: Search by name, email, specialty

### POST /api/djs
Create new DJ.

**Request:**
```json
{
  "nombre": "DJ Pulse",
  "nombre_artistico": "DJ Pulse",
  "email": "dj@example.com",
  "telefono": "+34 600 123 456",
  "comision_predeterminada": 70.00,
  "precio_por_hora": 300.00,
  "especialidad": "House, Techno",
  "active": true
}
```

---

## 👥 Clientes

### GET /api/clientes
List all clients.

### POST /api/clientes
Create new client.

**Request:**
```json
{
  "nombre": "María García",
  "email": "maria@example.com",
  "telefono": "+34 600 789 012",
  "tipo_cliente": "individual",
  "empresa": null
}
```

---

## 🎯 Leads

### GET /api/leads
List all leads with pipeline stages.

**Query Parameters:**
- `status`: Filter by stage (new|contacted|qualified|proposal|negotiation|won|lost)
- `assigned_to`: Filter by assigned user
- `origen`: Filter by source

### POST /api/leads
Create new lead.

### PUT /api/leads/:id
Update lead (move through pipeline).

### POST /api/leads/:id/convert
Convert lead to client + evento.

---

## 💳 Payments

### GET /api/payments
List all payments.

**Query Parameters:**
- `evento_id`: Filter by event
- `status`: Filter by payment status
- `payment_type`: Filter by type (advance|final|refund)

### POST /api/payments/create-intent
Create Stripe PaymentIntent.

**Request:**
```json
{
  "evento_id": 5,
  "amount": 500.00,
  "payment_type": "advance",
  "description": "Anticipo Boda María & Carlos"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

### POST /api/payments/:id/confirm
Confirm successful payment.

### POST /api/payments/:id/refund
Refund payment.

---

## 📄 Documents

### GET /api/documents
List all documents.

**Query Parameters:**
- `entity_type`: Filter by entity (evento|dj|cliente|contract)
- `entity_id`: Filter by specific entity
- `document_type`: Filter by type (contract|invoice|receipt|other)

### POST /api/documents/upload
Upload document.

**Request:** `multipart/form-data`
```
file: [File]
entity_type: "evento"
entity_id: 5
document_type: "contract"
```

### GET /api/documents/:id/download
Download document file.

### GET /api/documents/:id/versions
Get all versions of a document.

---

## 📅 Reservations

### GET /api/reservations
List all reservations.

**Query Parameters:**
- `status`: Filter by status (pending|hold|confirmed|cancelled|expired)
- `dj_id`: Filter by DJ

### POST /api/reservations
Create new reservation (public endpoint).

**Request:**
```json
{
  "dj_id": 5,
  "client_name": "María García",
  "client_email": "maria@example.com",
  "client_phone": "+34 600 123 456",
  "event_date": "2025-12-25T20:00:00Z",
  "event_duration_minutes": 300,
  "event_type": "Boda",
  "event_location": "Madrid",
  "estimated_price": 1500.00
}
```

### PUT /api/reservations/:id/confirm
Confirm reservation and convert to evento.

### PUT /api/reservations/:id/hold
Place hold on DJ (temporary reservation).

---

## 📆 Google Calendar

### GET /api/calendar/oauth/auth-url
Get Google OAuth URL.

### GET /api/calendar/oauth/callback
OAuth callback (handled by frontend redirect).

### GET /api/calendar/connections
List all calendar connections.

### POST /api/calendar/connections/:id/sync
Trigger manual sync.

**Request:**
```json
{
  "direction": "bidirectional"
}
```

### GET /api/calendar/conflicts
List calendar conflicts.

### POST /api/calendar/conflicts/:id/resolve
Resolve conflict.

**Request:**
```json
{
  "resolution_strategy": "local_wins",
  "resolution_notes": "Local event is correct"
}
```

---

## 💰 Financial

### GET /api/estadisticas/dashboard
Get financial dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "ingresos_totales": 45000.00,
    "comisiones_agencia": 13500.00,
    "comisiones_djs": 31500.00,
    "eventos_confirmados": 30,
    "eventos_pendientes": 5,
    "djs_activos": 15,
    "clientes_activos": 25
  }
}
```

### GET /api/estadisticas/ingresos-mes
Monthly income breakdown.

### GET /api/estadisticas/djs-performance
DJ performance metrics.

---

## 🔔 Notifications

### GET /api/notifications
List user notifications.

**Query Parameters:**
- `unread` (boolean): Filter unread only

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/read-all
Mark all as read.

---

## ⚙️ Settings

### GET /api/settings
Get agency settings.

### PUT /api/settings
Update agency settings.

**Request:**
```json
{
  "nombre": "IntraMedia Agency",
  "timezone": "Europe/Madrid",
  "default_commission": 30.00,
  "currency": "EUR"
}
```

---

## 📊 Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

- **Development:** No limit
- **Production:** 100 requests per 15 minutes per IP/token

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640000000
```

---

## 📄 Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "pages": 8
  }
}
```

---

## 🔍 Full-Text Search

Endpoints supporting `search` parameter use PostgreSQL full-text search with trigram similarity:

```bash
# Search events by name, location, DJ, client
GET /api/eventos?search=boda+maria

# Search DJs by name, email, specialty
GET /api/djs?search=techno

# Search clients
GET /api/clientes?search=garcia
```

---

## 🛠️ Development Tools

### Swagger UI
Interactive API documentation with "Try it out" functionality:
- **URL:** `http://localhost:3000/api-docs`
- Test all endpoints directly from browser
- View request/response schemas
- Generate code snippets

### Postman Collection
Import API endpoints into Postman:
1. Visit Swagger UI at `/api-docs`
2. Download OpenAPI spec
3. Import into Postman

---

## 💡 Best Practices

### Authentication
```javascript
// Store token securely
localStorage.setItem('token', data.token);

// Add to all requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Error Handling
```javascript
try {
  const response = await api.post('/eventos', data);
  toast.success('Evento creado');
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 422) {
    // Show validation errors
    const errors = error.response.data.errors;
  } else {
    toast.error(error.response?.data?.message || 'Error inesperado');
  }
}
```

### Pagination
```javascript
const fetchEvents = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const response = await api.get(`/eventos?limit=${limit}&offset=${offset}`);
  return response.data;
};
```

---

## 🔗 Related Documentation

- [Swagger UI (Interactive)](http://localhost:3000/api-docs)
- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
- [UI/UX Guide](./UI_UX_GUIDE.md)
- [User Manual](./USER_MANUAL.md)

---

**Last Updated:** December 2025
**Version:** 2.3.0
**Maintained by:** Backend Team
