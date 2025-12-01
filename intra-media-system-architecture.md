# 🏗️ INTRA MEDIA SYSTEM - Arquitectura Completa

**Ecosistema de gestión para Agencias y DJs**

---

## 📊 Visión General del Ecosistema

Intra Media System es un **ecosistema completo** compuesto por **DOS sistemas complementarios**:

```
INTRA MEDIA SYSTEM
│
├── 🖥️  BACKOFFICE WEB (intra-media-system)
│   ├── Usuario: Agencias, Managers, Admins, DJs Individuales
│   ├── Frontend: React + Vite (puerto 5174)
│   ├── Backend: Express.js (puerto 3001)
│   ├── Base de Datos: PostgreSQL
│   └── Propósito: Gestión completa del negocio
│
└── 📱 APP MÓVIL PARA DJS (app-service)
    ├── Usuario: DJs (consulta móvil)
    ├── Backend: NestJS (puerto 3000)
    ├── Frontend: Móvil (React Native/Flutter)
    ├── Base de Datos: PostgreSQL (COMPARTIDA)
    └── Propósito: Vista móvil para DJs
```

---

## 👥 Roles y Casos de Uso

### 👔 AGENCIA (Manager)
**Usa**: 🖥️ BACKOFFICE WEB
**Accede a**:
- Dashboard con todos los DJs gestionados
- Crear y asignar eventos a sus DJs
- Gestionar finanzas (comisiones automáticas)
- Ver Instagram analytics de sus DJs
- CRM de clientes/locales
- Nóminas mensuales de DJs

**NO puede**:
- Ver datos de DJs de otras agencias
- Ver DJs individuales (sin agencia)

---

### 🎵 DJ GESTIONADO POR AGENCIA
**Usa**: 📱 APP MÓVIL
**Accede a**:
- Ver sus propios eventos/bolos
- Ver dinero ganado este mes
- Ver próximos eventos
- Recibir notificaciones push (nuevos eventos, pagos)
- Solicitar cambios (requests)
- Actualizar disponibilidad

**NO puede**:
- Crear eventos (lo hace su agencia)
- Editar eventos existentes
- Ver eventos de otros DJs
- Gestionar finanzas (lo hace la agencia)

**Opcional**: También puede acceder al BACKOFFICE WEB (solo lectura)

---

### 🎧 DJ INDIVIDUAL (Sin agencia)
**Usa**: 🖥️ BACKOFFICE WEB
**Accede a**:
- Crear sus propios eventos
- Gestionar sus clientes
- Ver sus finanzas (sin comisiones de agencia)
- Dashboard personal
- Instagram analytics (su cuenta)

**Opcionalmente usa**: 📱 APP MÓVIL (mismas funciones que DJ gestionado)

**Diferencia con DJ gestionado**:
- Control total sobre sus datos
- Sin comisiones de agencia (parte_agencia = 0)
- No aparece en el dashboard de ninguna agencia

---

### 🔧 ADMINISTRADOR
**Usa**: 🖥️ BACKOFFICE WEB
**Accede a**:
- TODO el sistema (todas las agencias, todos los DJs)
- Data cleanup
- Gestión de usuarios
- Configuración global
- Auditoría completa

---

## 🏗️ Arquitectura Técnica

### Opción Implementada: **Base de Datos Compartida**

```
┌─────────────────────────────────────────────┐
│     PostgreSQL (Una sola base de datos)     │
│                                              │
│  Tablas:                                     │
│  - users (autenticación multi-tenant)       │
│  - agencies (agencias)                       │
│  - djs (DJs - todos)                         │
│  - eventos (todos los eventos)               │
│  - clientes (locales/clientes)               │
│  - pagos_djs, pagos_clientes (finanzas)     │
│  - categorias_evento (categorías)            │
│  - requests (solicitudes de DJs)             │
│  - social_media_* (Instagram, etc.)          │
│  - audit_log (auditoría)                     │
│                                              │
└──────────────┬──────────────────┬────────────┘
               │                  │
       ┌───────┴────┐     ┌───────┴─────┐
       │ Express.js │     │   NestJS    │
       │ (Puerto    │     │  (Puerto    │
       │  3001)     │     │   3000)     │
       └────────────┘     └─────────────┘
            ↑                    ↑
            │                    │
            │                    │
    ┌───────┴────────┐   ┌───────┴────────┐
    │   React Web    │   │   App Móvil    │
    │  (Backoffice)  │   │   (Para DJs)   │
    │  Puerto 5174   │   │                │
    └────────────────┘   └────────────────┘
```

**Ventajas**:
✅ Datos siempre sincronizados
✅ Sin lógica de replicación
✅ Un solo punto de verdad
✅ Más simple de implementar

**Configuración**:
```bash
# Ambos sistemas apuntan a la misma BD
DATABASE_URL=postgresql://user:password@localhost:5432/intra_media_db
```

---

## 🔐 Autenticación y Seguridad

### JWT Compartido

**Ambos backends usan el MISMO JWT_SECRET**:

```env
# intra-media-system/.env
JWT_SECRET=mi_secreto_compartido_super_seguro_2025

# app-service/.env
JWT_SECRET=mi_secreto_compartido_super_seguro_2025
```

### Estructura del JWT Token

```json
{
  "userId": 123,           // ID en tabla 'users'
  "djId": 456,             // ID en tabla 'djs' (si aplica)
  "agencyId": 789,         // ID en tabla 'agencies' (si aplica)
  "userType": "agency",    // "agency" | "individual_dj" | "admin"
  "managedBy": "agency",   // "agency" | "self"
  "email": "dj@example.com",
  "iat": 1640000000,
  "exp": 1640086400
}
```

### Flujo de Autenticación

#### Login desde BACKOFFICE WEB
```
1. POST /api/auth/login (Express)
   Body: { email, password }
   ↓
2. Verificar en tabla 'users' o 'djs'
   ↓
3. Generar JWT con SECRET compartido
   ↓
4. Retornar token + user data
```

#### Login desde APP MÓVIL
```
1. POST /api/v1/auth/login (NestJS)
   Body: { email, password }
   ↓
2. Verificar en tabla 'djs'
   ↓
3. Generar JWT con SECRET compartido (MISMO que backoffice)
   ↓
4. Retornar token + dj data
```

**Ventaja**: Un DJ puede usar el MISMO token en ambos sistemas

---

## 🗄️ Modelo de Datos Unificado

### Tabla Principal: `djs`

```sql
CREATE TABLE djs (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefono VARCHAR(50),
  password_hash VARCHAR(255),           -- Para login directo (si es individual)
  activo BOOLEAN DEFAULT true,
  fecha_alta DATE,
  observaciones TEXT,

  -- Multi-tenant
  user_id INTEGER REFERENCES users(id),
  agency_id INTEGER REFERENCES agencies(id),
  managed_by VARCHAR(50) CHECK (managed_by IN ('self', 'agency')) DEFAULT 'self',

  -- Campos de app-service (agregados)
  availability JSONB,                   -- Calendario de disponibilidad
  artistic_name VARCHAR(255),           -- Nombre artístico
  location VARCHAR(255),                -- Ubicación

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos clave**:
- `managed_by = 'agency'` → DJ gestionado por agencia (solo ve app móvil)
- `managed_by = 'self'` → DJ individual (puede usar backoffice)
- `agency_id IS NOT NULL` → Pertenece a una agencia
- `availability` → Usado por app móvil para calendario

---

### Tabla: `eventos`

```sql
CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  dj_id INTEGER REFERENCES djs(id),
  cliente_id INTEGER REFERENCES clientes(id),

  -- Detalles del evento
  evento VARCHAR(255),                  -- Nombre
  ciudad_lugar VARCHAR(255),
  categoria_id INTEGER REFERENCES categorias_evento(id),

  -- Logística (para app móvil)
  hora_inicio TIME,                     -- Agregado para app-service
  hora_fin TIME,                        -- Agregado para app-service
  horas DECIMAL(5,2),                   -- Calculado automáticamente

  -- Finanzas (para backoffice)
  cache_total DECIMAL(10,2),
  parte_dj DECIMAL(10,2),
  parte_agencia DECIMAL(10,2),
  euro_hora_dj DECIMAL(10,2),           -- Calculado automáticamente
  reserva DECIMAL(10,2) DEFAULT 0,

  -- Estados de pago
  cobrado_cliente BOOLEAN DEFAULT false,
  fecha_cobro_cliente DATE,
  pagado_dj BOOLEAN DEFAULT false,
  fecha_pago_dj DATE,

  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Cambios para integración**:
- ✅ Agregado `hora_inicio` y `hora_fin` (de app-service)
- ✅ Mantener `horas` (calculado automáticamente)

---

### Tabla: `requests` (Solicitudes de DJs)

```sql
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')) DEFAULT 'pending',
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  budget DECIMAL(10,2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_dj ON requests(dj_id);
CREATE INDEX idx_requests_evento ON requests(evento_id);
CREATE INDEX idx_requests_status ON requests(status);
```

**Uso**:
- DJ crea request desde APP MÓVIL (ej: "Cambiar horario del evento")
- Manager ve requests en BACKOFFICE WEB
- Manager aprueba/rechaza
- DJ recibe notificación

---

## 🔄 Flujos de Integración

### Flujo 1: Agencia crea evento → DJ recibe notificación

```
┌────────────┐
│  Manager   │ Agencia crea evento para su DJ "Juan"
└─────┬──────┘
      │
      ↓ POST /api/eventos
┌────────────────┐
│  Express API   │ Inserta en tabla 'eventos'
│  (puerto 3001) │
└────────┬───────┘
         │
         ↓ INSERT INTO eventos (dj_id=123, ...)
┌─────────────────┐
│   PostgreSQL    │ Evento creado
└────────┬────────┘
         │
         ↓ Trigger o Webhook (opcional)
┌────────────────┐
│   NestJS API   │ Detecta nuevo evento
│  (puerto 3000) │
└────────┬───────┘
         │
         ↓ Push Notification
┌────────────────┐
│   App Móvil    │ "Tienes un nuevo evento: Boda en Madrid"
│  (DJ Juan)     │
└────────────────┘
```

**Implementación**:

**Opción A - Polling** (más simple):
```typescript
// En app-service, cada 30 segundos
setInterval(() => {
  const nuevosEventos = await findEventosNuevos(ultimaVerificacion);
  for (const evento of nuevosEventos) {
    await sendPushNotification(evento.dj_id, {
      title: 'Nuevo evento',
      body: `${evento.evento} - ${evento.fecha}`
    });
  }
}, 30000);
```

**Opción B - Webhook** (más eficiente):
```javascript
// En intra-media-system/backend/routes/eventos.js
router.post('/', async (req, res) => {
  // Crear evento
  const evento = await Evento.create(req.body);

  // Notificar a app-service
  await axios.post('http://localhost:3000/api/v1/webhooks/new-event', {
    eventoId: evento.id,
    djId: evento.dj_id
  });

  res.json({ success: true, data: evento });
});
```

---

### Flujo 2: DJ actualiza disponibilidad

```
┌────────────┐
│  DJ Juan   │ Actualiza disponibilidad: "No disponible lunes 15"
└─────┬──────┘
      │
      ↓ PUT /api/v1/users/update-user
┌────────────────┐
│   NestJS API   │ Actualiza campo 'availability' en tabla 'djs'
│  (puerto 3000) │
└────────┬───────┘
         │
         ↓ UPDATE djs SET availability = {...} WHERE id = 123
┌─────────────────┐
│   PostgreSQL    │ Disponibilidad actualizada
└────────┬────────┘
         │
         │ (Lectura inmediata disponible)
         ↓
┌────────────────┐
│  Express API   │ Manager consulta disponibilidad al crear evento
│  (puerto 3001) │ SELECT availability FROM djs WHERE id = 123
└────────────────┘
```

**Frontend Backoffice**:
```javascript
// Al crear evento, mostrar calendario de disponibilidad del DJ
const dj = await fetch(`/api/djs/${djId}`);
const availability = dj.availability; // { days: [1,3,5], month: 1, year: 2025 }

// Mostrar en calendario con días no disponibles en rojo
```

---

### Flujo 3: DJ solicita cambio (Request)

```
┌────────────┐
│  DJ María  │ Ve que horario está mal: "20:00-01:00" debería ser "22:00-03:00"
└─────┬──────┘
      │
      ↓ POST /api/v1/requests/create-request
┌────────────────┐
│   NestJS API   │ Crea request en tabla 'requests'
│  (puerto 3000) │
└────────┬───────┘
         │
         ↓ INSERT INTO requests (dj_id, evento_id, title, status='pending')
┌─────────────────┐
│   PostgreSQL    │ Request creado
└────────┬────────┘
         │
         │ (Manager consulta periódicamente)
         ↓
┌────────────────┐
│  Express API   │ GET /api/requests?status=pending
│  (puerto 3001) │
└────────┬───────┘
         │
         ↓ Dashboard muestra badge "3 solicitudes pendientes"
┌────────────┐
│  Manager   │ Revisa solicitud de María
└─────┬──────┘
      │
      ↓ Aprueba y edita el evento
┌────────────────┐
│  Express API   │ PUT /api/eventos/456 (actualiza horarios)
│  (puerto 3001) │ PUT /api/requests/789 (status='approved')
└────────┬───────┘
         │
         ↓
┌────────────────┐
│   NestJS API   │ Detecta request aprobado → Notifica a DJ
│  (puerto 3000) │
└────────┬───────┘
         │
         ↓ Push Notification
┌────────────────┐
│   App Móvil    │ "Tu solicitud fue aprobada"
│  (DJ María)    │
└────────────────┘
```

---

## 🛠️ Adaptaciones Necesarias

### A. Adaptaciones en `intra-media-system` (BACKOFFICE)

#### 1. Agregar campos a tabla `djs`
```sql
-- Migration: 011_add_app_service_fields.sql
ALTER TABLE djs
  ADD COLUMN IF NOT EXISTS availability JSONB,
  ADD COLUMN IF NOT EXISTS artistic_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS location VARCHAR(255);

COMMENT ON COLUMN djs.availability IS 'Calendario de disponibilidad del DJ (usado por app móvil)';
COMMENT ON COLUMN djs.artistic_name IS 'Nombre artístico del DJ';
```

#### 2. Agregar campos a tabla `eventos`
```sql
-- Migration: 011_add_app_service_fields.sql
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS hora_inicio TIME,
  ADD COLUMN IF NOT EXISTS hora_fin TIME;

-- Función para calcular 'horas' automáticamente
CREATE OR REPLACE FUNCTION calculate_horas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hora_inicio IS NOT NULL AND NEW.hora_fin IS NOT NULL THEN
    NEW.horas := EXTRACT(EPOCH FROM (NEW.hora_fin - NEW.hora_inicio)) / 3600;
    IF NEW.horas < 0 THEN
      NEW.horas := NEW.horas + 24;  -- Evento cruza medianoche
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventos_calculate_horas
BEFORE INSERT OR UPDATE ON eventos
FOR EACH ROW
EXECUTE FUNCTION calculate_horas();
```

#### 3. Crear tabla `requests`
```sql
-- Migration: 011_add_app_service_fields.sql
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')) DEFAULT 'pending',
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  budget DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_dj ON requests(dj_id);
CREATE INDEX idx_requests_evento ON requests(evento_id);
CREATE INDEX idx_requests_status ON requests(status);
```

#### 4. Crear endpoint `/api/requests`
```javascript
// backend/routes/requests.js
import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// Listar solicitudes (filtrar por status, dj_id)
router.get('/', async (req, res) => {
  try {
    const { status, dj_id } = req.query;
    let sql = `
      SELECT r.*,
             d.nombre as dj_nombre,
             e.evento as evento_nombre,
             e.fecha as evento_fecha
      FROM requests r
      LEFT JOIN djs d ON r.dj_id = d.id
      LEFT JOIN eventos e ON r.evento_id = e.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND r.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (dj_id) {
      sql += ` AND r.dj_id = $${paramIndex}`;
      values.push(dj_id);
      paramIndex++;
    }

    sql += ` ORDER BY r.created_at DESC`;
    const result = await query(sql, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Aprobar/rechazar solicitud
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const sql = `
      UPDATE requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [status, req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

// Registrar en server.js
// import requestsRoutes from './routes/requests.js';
// app.use('/api/requests', authenticateToken, requestsRoutes);
```

#### 5. Frontend: Nueva página "Solicitudes"

Agregar en `App.jsx`:
```jsx
import Requests from './pages/Requests';

// En Routes
<Route path="solicitudes" element={<Requests />} />
```

Crear `pages/Requests.jsx`:
```jsx
import { useState, useEffect } from 'react';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    const res = await fetch(`/api/requests?status=${filter}`);
    const data = await res.json();
    setRequests(data.data);
  };

  const handleApprove = async (id) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    fetchRequests();
  };

  return (
    <div>
      <h1>Solicitudes de DJs</h1>
      <div className="filters">
        <button onClick={() => setFilter('pending')}>Pendientes</button>
        <button onClick={() => setFilter('approved')}>Aprobadas</button>
        <button onClick={() => setFilter('rejected')}>Rechazadas</button>
      </div>

      {requests.map(req => (
        <div key={req.id} className="request-card">
          <h3>{req.title}</h3>
          <p>DJ: {req.dj_nombre}</p>
          <p>Evento: {req.evento_nombre} - {req.evento_fecha}</p>
          <p>Descripción: {req.description}</p>
          <p>Prioridad: {req.priority}</p>
          <p>Estado: {req.status}</p>
          {req.status === 'pending' && (
            <div>
              <button onClick={() => handleApprove(req.id)}>Aprobar</button>
              <button onClick={() => handleReject(req.id)}>Rechazar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### B. Adaptaciones en `app-service` (APP MÓVIL)

#### 1. Mapear entidades TypeORM a schema existente

**Archivo**: `app-service/src/modules/user/domain/user.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('djs')  // ← Apuntar a tabla 'djs' existente
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre' })
  name: string;

  @Column({ name: 'artistic_name', nullable: true })
  artisticName: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password: string;

  @Column({ name: 'telefono', nullable: true })
  phone: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @Column({ name: 'agency_id', nullable: true })
  agencyId: number;

  @Column({ name: 'managed_by', default: 'self' })
  managedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    days: number[];
    month: number;
    year: number;
  };

  @Column({ name: 'activo', default: true })
  active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relaciones
  @OneToMany(() => EventEntity, (event) => event.user)
  events: EventEntity[];

  @OneToMany(() => RequestEntity, (request) => request.user)
  requests: RequestEntity[];
}
```

**Archivo**: `app-service/src/modules/event/domain/event.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('eventos')  // ← Apuntar a tabla 'eventos' existente
export class EventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'evento' })
  name: string;

  @Column({ name: 'ciudad_lugar' })
  city: string;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  start: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  end: string;

  @Column({ name: 'fecha', type: 'date' })
  date: Date;

  @Column({ name: 'observaciones', nullable: true })
  observations: string;

  @Column({ name: 'cache_total', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ name: 'categoria_id', nullable: true })
  categoryId: number;

  @Column({ name: 'dj_id' })
  userId: number;  // Mantener nombre userId internamente

  @Column({ name: 'cliente_id' })
  clientId: number;

  @Column({ name: 'cobrado_cliente', default: false })
  isPaid: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => UserEntity, (user) => user.events)
  @JoinColumn({ name: 'dj_id' })
  user: UserEntity;

  @ManyToOne(() => ClientEntity, (client) => client.events)
  @JoinColumn({ name: 'cliente_id' })
  client: ClientEntity;
}
```

**Archivo**: `app-service/src/modules/client/domain/client.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('clientes')  // ← Apuntar a tabla 'clientes' existente
export class ClientEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre' })
  name: string;

  @Column({ name: 'email', nullable: true })
  email: string;

  @Column({ name: 'telefono', nullable: true })
  phone: string;

  @Column({ name: 'ciudad', nullable: true })
  city: string;

  @Column({ name: 'contacto', nullable: true })
  contact: string;

  @Column({ name: 'activo', default: true })
  active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relaciones
  @OneToMany(() => EventEntity, (event) => event.client)
  events: EventEntity[];
}
```

#### 2. Configurar DATABASE_URL compartida

**Archivo**: `app-service/.env`

```env
# Base de datos compartida con intra-media-system
DATABASE_URL=postgresql://user:password@localhost:5432/intra_media_db

# JWT secret compartido
JWT_SECRET=mi_secreto_compartido_super_seguro_2025

# Puerto diferente
PORT=3000
API_PREFIX=api/v1
```

#### 3. Ajustar lógica de negocio

**Archivo**: `app-service/src/modules/event/application/get-events-by-user.use-case.ts`

```typescript
export class GetEventsByUserUseCase {
  constructor(
    @Inject('EventRepository')
    private readonly eventRepository: EventRepository,
  ) {}

  async execute(userId: number, filters?: { fromDate?: Date; toDate?: Date }) {
    // Solo retornar eventos del DJ autenticado
    const events = await this.eventRepository.findByUser(userId, filters);

    // Mapear campos para que frontend móvil los entienda
    return events.map(event => ({
      id: event.id,
      name: event.name,
      city: event.city,
      start: event.start,
      end: event.end,
      date: event.date,
      observations: event.observations,
      price: event.price,
      isPaid: event.isPaid,
      client: event.client ? {
        id: event.client.id,
        name: event.client.name,
        phone: event.client.phone
      } : null
    }));
  }
}
```

#### 4. Deshabilitar creación de eventos (solo lectura para DJs gestionados)

**Archivo**: `app-service/src/modules/event/infrastructure/event.controller.ts`

```typescript
@Post('/create-event')
async createEvent(@Body() dto: CreateEventDto, @Request() req) {
  const user = req.user;  // Desde JWT

  // Verificar si el DJ está gestionado por agencia
  if (user.managedBy === 'agency') {
    throw new ForbiddenException(
      'No puedes crear eventos. Tu agencia gestiona tus bolos. ' +
      'Si necesitas cambios, usa el sistema de solicitudes.'
    );
  }

  // Si es DJ individual, permitir
  return this.createEventUseCase.execute(dto);
}
```

#### 5. Implementar Push Notifications

**Instalar dependencias**:
```bash
cd app-service
npm install @nestjs/schedule firebase-admin
```

**Archivo**: `app-service/src/modules/notification/notification.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  constructor() {
    // Inicializar Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  async sendPushToUser(userId: number, notification: { title: string; body: string }) {
    // Obtener token FCM del usuario (guardar en tabla user_devices)
    const token = await this.getUserFCMToken(userId);

    if (!token) return;

    await admin.messaging().send({
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: 'new_event',
        timestamp: new Date().toISOString(),
      },
    });
  }

  private async getUserFCMToken(userId: number): Promise<string | null> {
    // Consultar token de tabla user_devices
    // TODO: Implementar
    return null;
  }
}
```

**Crear tabla para tokens**:
```sql
CREATE TABLE user_devices (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android')),
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id, fcm_token)
);
```

**Endpoint para registrar token**:
```typescript
@Post('/register-device')
async registerDevice(@Body() dto: { token: string; deviceType: string }, @Request() req) {
  const djId = req.user.djId;
  await this.userDeviceRepository.upsert({
    djId,
    fcmToken: dto.token,
    deviceType: dto.deviceType,
  });
  return { success: true };
}
```

---

## 📱 Frontend Móvil (Por Implementar)

### Tecnología Recomendada: **React Native + Expo**

**¿Por qué?**
- ✅ Misma base que el backoffice (React)
- ✅ Desarrollo rápido con Expo
- ✅ Push notifications out-of-the-box
- ✅ Un código para iOS y Android

### Estructura Propuesta

```
app-service/
├── backend/               (NestJS - ya existe)
└── mobile/                (React Native - nuevo)
    ├── App.tsx
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.tsx
    │   │   ├── HomeScreen.tsx      (Dashboard del DJ)
    │   │   ├── EventsScreen.tsx    (Lista de bolos)
    │   │   ├── EventDetailScreen.tsx
    │   │   ├── RequestsScreen.tsx  (Solicitudes)
    │   │   └── ProfileScreen.tsx
    │   ├── components/
    │   │   ├── EventCard.tsx
    │   │   ├── StatsCard.tsx
    │   │   └── RequestForm.tsx
    │   ├── api/
    │   │   └── client.ts           (Axios configurado)
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   └── utils/
    │       └── notifications.ts    (Push config)
    ├── package.json
    └── app.json
```

### Pantallas Principales

#### 1. **HomeScreen** (Dashboard)
```
┌────────────────────────────────┐
│  ← Intra Media                 │
│                                │
│  Hola, Juan 👋                 │
│                                │
│  ┌─────────────────────────┐  │
│  │ Este mes                │  │
│  │ €1,250 ganados          │  │
│  │ 5 eventos completados   │  │
│  └─────────────────────────┘  │
│                                │
│  Próximos eventos              │
│  ┌─────────────────────────┐  │
│  │ 🎉 Boda - Sábado 20     │  │
│  │    22:00 - 03:00        │  │
│  │    Hotel Marriott       │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ 🎵 Residencia - Vier 22 │  │
│  │    23:00 - 04:00        │  │
│  │    Sala Apolo           │  │
│  └─────────────────────────┘  │
│                                │
│  [Ver todos]                   │
└────────────────────────────────┘
```

#### 2. **EventsScreen** (Lista de eventos)
```
┌────────────────────────────────┐
│  ← Mis Eventos                 │
│                                │
│  [Próximos] [Pasados] [Todos]  │
│                                │
│  Enero 2025                    │
│  ┌─────────────────────────┐  │
│  │ Sáb 20 - Boda           │  │
│  │ 22:00-03:00 · €300      │  │
│  │ ✓ Cobrado               │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ Vie 22 - Residencia     │  │
│  │ 23:00-04:00 · €250      │  │
│  │ ⏳ Pendiente pago       │  │
│  └─────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

#### 3. **EventDetailScreen**
```
┌────────────────────────────────┐
│  ← Boda en Hotel Marriott      │
│                                │
│  📅 Sábado 20 Enero 2025       │
│  🕐 22:00 - 03:00 (5 horas)    │
│  📍 Hotel Marriott, Madrid     │
│                                │
│  💰 Finanzas                   │
│  Total: €300                   │
│  Tu parte: €240                │
│  Comisión agencia: €60         │
│  €/hora: €48                   │
│                                │
│  ✅ Cobrado al cliente         │
│  ✅ Pagado a ti                │
│                                │
│  📝 Observaciones              │
│  Boda de 200 invitados.        │
│  Música variada (80s, pop).    │
│                                │
│  [🔔 Solicitar cambio]         │
└────────────────────────────────┘
```

#### 4. **RequestsScreen** (Solicitudes)
```
┌────────────────────────────────┐
│  ← Solicitudes                 │
│                                │
│  [Pendientes] [Aprobadas]      │
│                                │
│  ┌─────────────────────────┐  │
│  │ ⏳ Cambio de horario    │  │
│  │    Boda 20 Enero        │  │
│  │    Hace 2 horas         │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ ✅ Cambio de ubicación  │  │
│  │    Residencia 22 Enero  │  │
│  │    Aprobada ayer        │  │
│  └─────────────────────────┘  │
│                                │
│  [+ Nueva solicitud]           │
└────────────────────────────────┘
```

---

## 🚀 Roadmap de Implementación

### ✅ FASE 0: Preparación (1-2 días)
- [x] Análisis de ambos sistemas
- [x] Diseño de arquitectura
- [x] Documentación
- [ ] Backup completo de BD

### 🔨 FASE 1: Adaptaciones Backend (3-5 días)

#### intra-media-system:
- [ ] Crear migración 011 (campos availability, artistic_name, requests)
- [ ] Ejecutar migración en DB
- [ ] Crear endpoint `/api/requests`
- [ ] Agregar webhooks/notificaciones (opcional)
- [ ] Testing

#### app-service:
- [ ] Actualizar entidades TypeORM (mapear a schema existente)
- [ ] Configurar DATABASE_URL compartida
- [ ] Ajustar lógica de negocio (deshabilitar creación para managed DJs)
- [ ] Implementar servicio de notificaciones
- [ ] Testing

### 🎨 FASE 2: Frontend Backoffice (2-3 días)
- [ ] Crear página "Solicitudes"
- [ ] Agregar badge de notificaciones en nav
- [ ] Mostrar disponibilidad de DJ al crear evento
- [ ] Agregar campo "horario" en formulario de eventos
- [ ] Testing

### 📱 FASE 3: App Móvil (5-7 días)
- [ ] Setup proyecto React Native + Expo
- [ ] Implementar pantallas principales
- [ ] Integrar con backend NestJS
- [ ] Configurar push notifications (Firebase)
- [ ] Testing en iOS/Android

### 🔗 FASE 4: Integración y Testing (2-3 días)
- [ ] Testing end-to-end
- [ ] Verificar sincronización de datos
- [ ] Probar flujo completo: Agencia crea evento → DJ recibe notificación
- [ ] Probar flujo: DJ crea request → Manager aprueba
- [ ] Ajustes finales

### 🚀 FASE 5: Deployment (1-2 días)
- [ ] Deploy backend NestJS (Render/Railway)
- [ ] Verificar conectividad con DB
- [ ] Build app móvil (TestFlight para iOS, Play Console para Android)
- [ ] Testing en producción
- [ ] Monitoring y logs

**TOTAL ESTIMADO: 14-22 días**

---

## 🔐 Seguridad

### 1. Autenticación
- ✅ JWT con secret compartido
- ✅ Tokens expiran en 7 días (configurable)
- ✅ Refresh tokens (opcional)

### 2. Autorización
- ✅ Middleware verifica rol en cada request
- ✅ DJ solo ve sus propios datos
- ✅ Agencia solo ve sus DJs
- ✅ Admin ve todo

### 3. Rate Limiting
```javascript
// En ambos backends
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,  // Máximo 100 requests por IP
});

app.use('/api/', limiter);
```

### 4. CORS
```javascript
// intra-media-system/backend
app.use(cors({
  origin: [
    'http://localhost:5174',  // Frontend web
    'http://localhost:3000',  // App-service backend
    'exp://192.168.1.100:19000'  // Expo (desarrollo)
  ]
}));
```

---

## 📊 Monitoreo

### Métricas Clave
- ✅ Latencia de API (ambos backends)
- ✅ Tasa de errores
- ✅ Push notifications enviadas/recibidas
- ✅ Usuarios activos (web + móvil)
- ✅ Eventos creados por día

### Logs
```javascript
// Winston logger en ambos backends
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usar en código
logger.info('Evento creado', { eventoId: 123, djId: 456 });
logger.error('Error al enviar notificación', { error: err.message });
```

---

## 🎯 Conclusión

El ecosistema Intra Media System está diseñado como:

```
🏢 BACKOFFICE (Escritorio) → Gestión completa
📱 APP MÓVIL (Móvil) → Vista rápida para DJs
🗄️ UNA SOLA BASE DE DATOS → Sincronización automática
```

**Ventajas del diseño**:
1. ✅ Sin duplicación de datos
2. ✅ Sincronización en tiempo real
3. ✅ Separación de responsabilidades clara
4. ✅ Escalable (microservicios listos)
5. ✅ Experiencia optimizada por plataforma

**Próximo paso**: ¿Empezamos con FASE 1 (Backend) o prefieres ver algún detalle específico?
