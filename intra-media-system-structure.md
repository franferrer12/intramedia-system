# 📚 Intra Media System - Documentación del BACKOFFICE WEB

**Parte del Ecosistema Intra Media - Sistema de Gestión para Agencias y DJs**

---

## 🎯 Contexto

Este documento describe el **BACKOFFICE WEB** de Intra Media System, que es parte de un ecosistema más amplio:

```
INTRA MEDIA SYSTEM (Ecosistema Completo)
│
├── 🖥️  BACKOFFICE WEB (este documento)
│   └── intra-media-system/
│       Frontend: React + Vite (puerto 5174)
│       Backend: Express.js (puerto 3001)
│       Para: Agencias, Managers, Admins, DJs Individuales
│
└── 📱 APP MÓVIL PARA DJS (ver: intra-media-system-architecture.md)
    └── app-service/
        Backend: NestJS (puerto 3000)
        Frontend: React Native
        Para: DJs (vista móvil)
```

**Ambos sistemas comparten la misma base de datos PostgreSQL**

---

## 📊 Visión General del BACKOFFICE

### Estadísticas del Sistema

- **15+ Tablas** en Base de Datos (compartidas con app móvil)
- **50+ Endpoints** API REST
- **30+ Componentes** React
- **Multi-tenant** con roles (Agencia, DJ Individual, Admin)

### Tipos de Usuario

#### 🏢 Agencia
- Gestiona roster de DJs
- Asigna eventos a sus artistas
- Recibe comisiones automáticas
- Dashboard con métricas de facturación

#### 🎵 DJ Individual
- Gestiona sus propios eventos
- Ve sus ganancias y calendario
- Sin comisiones de agencia
- Acceso a Instagram analytics

#### 👤 Administrador
- Acceso total al sistema
- Gestión de datos maestros
- Limpieza y auditoría

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### Frontend
- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Routing**: React Router v6
- **Estilos**: TailwindCSS 3.4
- **Iconos**: Lucide React
- **HTTP Client**: Axios
- **Notificaciones**: React Hot Toast
- **Fechas**: date-fns
- **Puerto**: 5174

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.21
- **Base de Datos**: PostgreSQL 15
- **ORM**: pg (node-postgres) - SQL directo
- **Autenticación**: JWT + bcrypt
- **CORS**: cors
- **Variables de entorno**: dotenv
- **Puerto**: 3001

#### DevOps
- **Control de versiones**: Git
- **Despliegue**: Render.com (manual)
- **Entorno**: Development/Production

### Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│   🎨 CAPA DE PRESENTACIÓN (Frontend)    │
│   React + Vite + TailwindCSS           │
│   Puerto: 5174                         │
│   - pages/ (Páginas principales)       │
│   - components/ (Componentes)          │
│   - contexts/ (AuthContext, ThemeContext)│
└─────────────────────────────────────────┘
                    ↓ HTTP/REST
┌─────────────────────────────────────────┐
│   ⚙️ CAPA DE LÓGICA (Backend API)       │
│   Express.js + Node.js                 │
│   Puerto: 3001                         │
│   - routes/ (Definición de rutas)      │
│   - middleware/ (auth.js - JWT)        │
└─────────────────────────────────────────┘
                    ↓ SQL
┌─────────────────────────────────────────┐
│   🗄️ CAPA DE DATOS (Database)          │
│   PostgreSQL 15                        │
│   - 15 tablas relacionales             │
│   - Triggers para auditoría            │
│   - Índices optimizados                │
└─────────────────────────────────────────┘
```

### Estructura de Directorios

```
intra-media-system/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Páginas principales
│   │   ├── components/     # Componentes reutilizables (60+)
│   │   ├── contexts/       # Context API (Auth, Theme)
│   │   ├── App.jsx         # Router principal
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    ├── routes/
    │   ├── auth.js         # Autenticación (login, register)
    │   ├── eventos.js      # CRUD de eventos
    │   ├── djs.js          # CRUD de DJs
    │   ├── clientes.js     # CRUD de clientes
    │   ├── categorias.js   # Categorías de eventos
    │   ├── nominas.js      # Nóminas y pagos
    │   ├── socios.js       # Gestión de socios
    │   ├── instagram.js    # Integración Instagram
    │   └── agencies.js     # Multi-tenant (agencias)
    ├── middleware/
    │   └── auth.js         # Validación JWT
    ├── migrations/         # SQL migrations
    ├── server.js           # Entry point
    └── package.json
```

---

## 🗄️ Base de Datos - Schema Completo

### Tablas Principales

#### 1. `usuarios`
**Descripción**: Sistema de autenticación y usuarios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| nombre | VARCHAR(255) | Nombre completo del usuario |
| email | VARCHAR(255) UNIQUE NOT NULL | Email único para login |
| password_hash | VARCHAR(255) NOT NULL | Contraseña encriptada con bcrypt |
| rol | VARCHAR(50) DEFAULT 'user' | Rol del usuario |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

---

#### 2. `agencies`
**Descripción**: Agencias en el sistema multi-tenant

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| name | VARCHAR(255) NOT NULL | Nombre de la agencia |
| email | VARCHAR(255) UNIQUE NOT NULL | Email de contacto |
| password_hash | VARCHAR(255) NOT NULL | Contraseña encriptada |
| commission_percentage | DECIMAL(5,2) DEFAULT 20 | % comisión (ej: 20.00) |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Relaciones**:
- `djs.agency_id` → `agencies.id` (Una agencia tiene muchos DJs)

---

#### 3. `djs`
**Descripción**: DJs/artistas del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| nombre | VARCHAR(255) NOT NULL | Nombre artístico |
| email | VARCHAR(255) UNIQUE | Email del DJ |
| password_hash | VARCHAR(255) | Contraseña (si es DJ individual) |
| telefono | VARCHAR(50) | Teléfono de contacto |
| direccion | TEXT | Dirección postal |
| cache_hora | DECIMAL(10,2) | Caché por hora base |
| activo | BOOLEAN DEFAULT true | Estado activo/inactivo |
| managed_by | VARCHAR(50) DEFAULT 'agency' | 'agency' \| 'self' |
| agency_id | INTEGER REFERENCES agencies(id) | FK a agencia (si managed_by='agency') |
| instagram_username | VARCHAR(255) | Usuario de Instagram |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Índices**:
- `idx_djs_agency_id` en `agency_id`
- `idx_djs_managed_by` en `managed_by`

**Relaciones**:
- `eventos.dj_id` → `djs.id` (Un DJ tiene muchos eventos)
- `djs.agency_id` → `agencies.id` (Un DJ pertenece a una agencia)

---

#### 4. `clientes`
**Descripción**: Clientes/locales donde se realizan eventos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| nombre | VARCHAR(255) NOT NULL | Nombre del local/cliente |
| contacto | VARCHAR(255) | Persona de contacto |
| telefono | VARCHAR(50) | Teléfono |
| email | VARCHAR(255) | Email de contacto |
| direccion | TEXT | Dirección del local |
| notas | TEXT | Notas adicionales |
| activo | BOOLEAN DEFAULT true | Estado activo/inactivo |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Relaciones**:
- `eventos.cliente_id` → `clientes.id` (Un cliente tiene muchos eventos)

---

#### 5. `categorias`
**Descripción**: Categorías de eventos (Residencias, Discotecas, Eventos Privados, etc.)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| nombre | VARCHAR(255) NOT NULL | Nombre de la categoría |
| color | VARCHAR(7) DEFAULT '#3B82F6' | Color hex para UI |
| descripcion | TEXT | Descripción de la categoría |
| created_at | TIMESTAMP | Fecha de creación |

**Relaciones**:
- `eventos.categoria_id` → `categorias.id` (Muchos eventos tienen una categoría)

---

#### 6. `eventos` ⭐ (TABLA PRINCIPAL)
**Descripción**: Bolos/eventos musicales - corazón del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| fecha | DATE NOT NULL | Fecha del evento |
| mes | VARCHAR(20) | Mes calculado automáticamente |
| dj_id | INTEGER REFERENCES djs(id) | DJ asignado |
| cliente_id | INTEGER REFERENCES clientes(id) | Cliente/local |
| categoria_id | INTEGER REFERENCES categorias(id) | Categoría del evento |
| horas | DECIMAL(5,2) | Horas trabajadas |
| cache_total | DECIMAL(10,2) | Precio total del evento |
| parte_dj | DECIMAL(10,2) | Parte que recibe el DJ |
| parte_agencia | DECIMAL(10,2) | Comisión de la agencia |
| euro_hora_dj | DECIMAL(10,2) | €/hora calculado (parte_dj / horas) |
| reserva | DECIMAL(10,2) DEFAULT 0 | Anticipo/reserva pagado |
| cobrado_cliente | BOOLEAN DEFAULT false | ¿Se cobró al cliente? |
| pagado_dj | BOOLEAN DEFAULT false | ¿Se pagó al DJ? |
| observaciones | TEXT | Notas adicionales |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |
| created_by | INTEGER REFERENCES agencies(id) | Agencia creadora (multi-tenant) |

**Índices**:
- `idx_eventos_fecha` en `fecha`
- `idx_eventos_dj` en `dj_id`
- `idx_eventos_cliente` en `cliente_id`
- `idx_eventos_created_by` en `created_by`

**Triggers**:
- `set_evento_mes` - Calcula automáticamente el mes al insertar/actualizar
- `evento_audit_trigger` - Registra cambios en `evento_audit_log`

---

#### 7. `nominas`
**Descripción**: Nóminas/pagos a DJs

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| dj_id | INTEGER REFERENCES djs(id) | DJ que recibe el pago |
| mes | VARCHAR(20) NOT NULL | Mes de la nómina (ej: "2024-01") |
| total_eventos | INTEGER | Número de eventos del mes |
| total_horas | DECIMAL(10,2) | Total de horas trabajadas |
| total_bruto | DECIMAL(10,2) | Total antes de deducciones |
| deducciones | DECIMAL(10,2) DEFAULT 0 | Deducciones aplicadas |
| total_neto | DECIMAL(10,2) | Total a pagar (bruto - deducciones) |
| estado | VARCHAR(50) DEFAULT 'pendiente' | 'pendiente' \| 'pagado' |
| fecha_pago | DATE | Fecha en que se pagó |
| notas | TEXT | Notas sobre el pago |
| created_at | TIMESTAMP | Fecha de creación |

**Índices**:
- `idx_nominas_dj_mes` en `(dj_id, mes)` - Para búsquedas rápidas por DJ y mes

---

#### 8. `socios`
**Descripción**: Socios del negocio con participaciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| nombre | VARCHAR(255) NOT NULL | Nombre del socio |
| email | VARCHAR(255) | Email de contacto |
| telefono | VARCHAR(50) | Teléfono |
| porcentaje_participacion | DECIMAL(5,2) | % de participación (ej: 25.50) |
| activo | BOOLEAN DEFAULT true | Estado activo/inactivo |
| fecha_ingreso | DATE | Fecha de entrada como socio |
| notas | TEXT | Notas adicionales |
| created_at | TIMESTAMP | Fecha de creación |

---

#### 9. `instagram_metrics`
**Descripción**: Métricas de Instagram para DJs

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| dj_id | INTEGER REFERENCES djs(id) | DJ asociado |
| fecha | DATE NOT NULL | Fecha de la métrica |
| seguidores | INTEGER | Número de seguidores |
| me_gusta | INTEGER | Total de likes |
| comentarios | INTEGER | Total de comentarios |
| publicaciones | INTEGER | Total de posts |
| engagement_rate | DECIMAL(5,2) | Tasa de engagement (%) |
| created_at | TIMESTAMP | Fecha de registro |

**Índices**:
- `idx_instagram_dj_fecha` en `(dj_id, fecha)` - Para series temporales

---

#### 10. `instagram_alerts`
**Descripción**: Alertas de cambios en Instagram

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| dj_id | INTEGER REFERENCES djs(id) | DJ afectado |
| tipo_alerta | VARCHAR(100) | Tipo de alerta (ej: "follower_drop") |
| mensaje | TEXT | Descripción de la alerta |
| severidad | VARCHAR(50) | 'info' \| 'warning' \| 'critical' |
| leido | BOOLEAN DEFAULT false | ¿Fue leída? |
| fecha_alerta | TIMESTAMP | Cuándo se generó |
| created_at | TIMESTAMP | Fecha de creación |

---

#### 11. `evento_audit_log`
**Descripción**: Auditoría de cambios en eventos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| evento_id | INTEGER | ID del evento modificado |
| accion | VARCHAR(50) | 'INSERT' \| 'UPDATE' \| 'DELETE' |
| usuario_id | INTEGER | Usuario que hizo el cambio |
| datos_anteriores | JSONB | Estado antes del cambio |
| datos_nuevos | JSONB | Estado después del cambio |
| timestamp | TIMESTAMP | Cuándo ocurrió |

**Uso**: Permite rastrear quién modificó qué y cuándo en los eventos.

---

#### 12. `categories_backup` (tabla de respaldo)
Backup de categorías antes de cambios

---

#### 13. `categorias_old` (tabla legacy)
Categorías antiguas antes de migración

---

#### 14. `clientes_backup` (tabla de respaldo)
Backup de clientes antes de cambios

---

#### 15. `notifications`
**Descripción**: Notificaciones del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL PRIMARY KEY | Identificador único |
| user_id | INTEGER | Usuario destinatario |
| tipo | VARCHAR(100) | Tipo de notificación |
| mensaje | TEXT | Contenido de la notificación |
| leido | BOOLEAN DEFAULT false | ¿Fue leída? |
| url | VARCHAR(500) | URL de acción (opcional) |
| created_at | TIMESTAMP | Fecha de creación |

---

## ⚙️ Backend API - Endpoints

### 🔐 Autenticación (`/api/auth`)

#### POST `/api/auth/register`
Registrar nuevo usuario (agencia o DJ individual)

**Body**:
```json
{
  "name": "Nombre Agencia",
  "email": "agencia@example.com",
  "password": "securepassword",
  "accountType": "agency",
  "commissionPercentage": 20
}
```

**Response 201**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nombre Agencia",
    "email": "agencia@example.com",
    "accountType": "agency"
  }
}
```

---

#### POST `/api/auth/login`
Iniciar sesión

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response 200**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Usuario",
    "email": "user@example.com",
    "accountType": "agency"
  }
}
```

---

#### GET `/api/auth/me`
Obtener datos del usuario autenticado

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "id": 1,
  "name": "Usuario",
  "email": "user@example.com",
  "accountType": "agency",
  "commissionPercentage": 20
}
```

---

### 🎵 DJs (`/api/djs`)

**Todos los endpoints requieren autenticación**

#### GET `/api/djs`
Listar todos los DJs (filtrados por agencia si aplica)

**Query params**:
- `managed_by` (opcional): 'agency' | 'self'

**Response 200**:
```json
[
  {
    "id": 1,
    "nombre": "DJ Example",
    "email": "dj@example.com",
    "telefono": "+34 600 000 000",
    "cache_hora": 50.00,
    "activo": true,
    "managed_by": "agency",
    "agency_id": 1,
    "instagram_username": "@djexample"
  }
]
```

---

#### GET `/api/djs/:id`
Obtener detalles de un DJ específico

**Response 200**:
```json
{
  "id": 1,
  "nombre": "DJ Example",
  "email": "dj@example.com",
  "telefono": "+34 600 000 000",
  "direccion": "Calle Example 123",
  "cache_hora": 50.00,
  "activo": true,
  "managed_by": "agency",
  "agency_id": 1,
  "instagram_username": "@djexample",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### POST `/api/djs`
Crear nuevo DJ

**Body**:
```json
{
  "nombre": "Nuevo DJ",
  "email": "nuevo@dj.com",
  "telefono": "+34 600 000 000",
  "direccion": "Calle Example 456",
  "cache_hora": 60.00,
  "managed_by": "agency",
  "instagram_username": "@nuevodj"
}
```

**Response 201**:
```json
{
  "id": 2,
  "nombre": "Nuevo DJ",
  "agency_id": 1
}
```

---

#### PUT `/api/djs/:id`
Actualizar DJ existente

**Body**: (campos opcionales)
```json
{
  "nombre": "DJ Updated",
  "cache_hora": 70.00,
  "activo": false
}
```

**Response 200**:
```json
{
  "id": 1,
  "nombre": "DJ Updated",
  "cache_hora": 70.00
}
```

---

#### DELETE `/api/djs/:id`
Eliminar DJ (soft delete o hard delete)

**Response 200**:
```json
{
  "message": "DJ eliminado correctamente"
}
```

---

#### GET `/api/djs/:id/stats`
Estadísticas de un DJ (eventos, ganancias, etc.)

**Response 200**:
```json
{
  "total_eventos": 45,
  "total_horas": 180,
  "total_ganado": 9000.00,
  "promedio_por_evento": 200.00,
  "eventos_mes_actual": 5
}
```

---

### 📅 Eventos (`/api/eventos`)

#### GET `/api/eventos`
Listar todos los eventos (filtrados por agencia)

**Query params**:
- `mes` (opcional): '2024-01'
- `dj_id` (opcional): ID del DJ
- `cliente_id` (opcional): ID del cliente
- `categoria_id` (opcional): ID de categoría

**Response 200**:
```json
[
  {
    "id": 1,
    "fecha": "2024-01-15",
    "mes": "2024-01",
    "dj_id": 1,
    "dj_nombre": "DJ Example",
    "cliente_id": 1,
    "cliente_nombre": "Club Example",
    "categoria_id": 1,
    "categoria_nombre": "Residencia",
    "categoria_color": "#3B82F6",
    "horas": 4.0,
    "cache_total": 400.00,
    "parte_dj": 320.00,
    "parte_agencia": 80.00,
    "euro_hora_dj": 80.00,
    "reserva": 100.00,
    "cobrado_cliente": true,
    "pagado_dj": false,
    "observaciones": "Evento especial"
  }
]
```

---

#### GET `/api/eventos/:id`
Obtener detalles de un evento

**Response 200**: (igual que el objeto individual de arriba)

---

#### POST `/api/eventos`
Crear nuevo evento

**Body**:
```json
{
  "fecha": "2024-02-01",
  "dj_id": 1,
  "cliente_id": 1,
  "categoria_id": 1,
  "horas": 5.0,
  "cache_total": 500.00,
  "parte_dj": 400.00,
  "parte_agencia": 100.00,
  "reserva": 150.00,
  "observaciones": "Evento corporativo"
}
```

**Response 201**:
```json
{
  "id": 2,
  "fecha": "2024-02-01",
  "dj_id": 1,
  "cache_total": 500.00
}
```

---

#### PUT `/api/eventos/:id`
Actualizar evento (trigger de auditoría se ejecuta)

**Body**: (campos opcionales)
```json
{
  "horas": 6.0,
  "cache_total": 600.00,
  "cobrado_cliente": true,
  "pagado_dj": true
}
```

---

#### DELETE `/api/eventos/:id`
Eliminar evento

**Response 200**:
```json
{
  "message": "Evento eliminado"
}
```

---

#### GET `/api/eventos/stats/monthly`
Estadísticas mensuales de eventos

**Query params**:
- `mes`: '2024-01'

**Response 200**:
```json
{
  "total_eventos": 20,
  "total_facturado": 10000.00,
  "total_horas": 80,
  "promedio_evento": 500.00,
  "eventos_por_categoria": [
    { "categoria": "Residencia", "count": 10 },
    { "categoria": "Discoteca", "count": 7 },
    { "categoria": "Evento Privado", "count": 3 }
  ]
}
```

---

### 🏢 Clientes (`/api/clientes`)

#### GET `/api/clientes`
Listar todos los clientes

**Response 200**:
```json
[
  {
    "id": 1,
    "nombre": "Club Example",
    "contacto": "Juan Pérez",
    "telefono": "+34 600 111 222",
    "email": "club@example.com",
    "direccion": "Av. Principal 100",
    "activo": true,
    "total_eventos": 15
  }
]
```

---

#### GET `/api/clientes/:id`
Obtener detalles de un cliente

---

#### POST `/api/clientes`
Crear nuevo cliente

**Body**:
```json
{
  "nombre": "Nuevo Club",
  "contacto": "María López",
  "telefono": "+34 600 333 444",
  "email": "nuevo@club.com",
  "direccion": "Calle Nueva 50",
  "notas": "Cliente VIP"
}
```

---

#### PUT `/api/clientes/:id`
Actualizar cliente

---

#### DELETE `/api/clientes/:id`
Eliminar cliente

---

### 🎨 Categorías (`/api/categorias`)

#### GET `/api/categorias`
Listar todas las categorías

**Response 200**:
```json
[
  {
    "id": 1,
    "nombre": "Residencia",
    "color": "#3B82F6",
    "descripcion": "Sesiones regulares en locales"
  },
  {
    "id": 2,
    "nombre": "Discoteca",
    "color": "#8B5CF6",
    "descripcion": "Eventos en discotecas"
  }
]
```

---

#### POST `/api/categorias`
Crear nueva categoría

**Body**:
```json
{
  "nombre": "Festival",
  "color": "#F59E0B",
  "descripcion": "Eventos en festivales"
}
```

---

#### PUT `/api/categorias/:id`
Actualizar categoría

---

#### DELETE `/api/categorias/:id`
Eliminar categoría

---

### 💰 Nóminas (`/api/nominas`)

#### GET `/api/nominas`
Listar nóminas

**Query params**:
- `mes` (opcional): '2024-01'
- `dj_id` (opcional): ID del DJ

**Response 200**:
```json
[
  {
    "id": 1,
    "dj_id": 1,
    "dj_nombre": "DJ Example",
    "mes": "2024-01",
    "total_eventos": 10,
    "total_horas": 40,
    "total_bruto": 4000.00,
    "deducciones": 200.00,
    "total_neto": 3800.00,
    "estado": "pagado",
    "fecha_pago": "2024-02-01"
  }
]
```

---

#### POST `/api/nominas`
Crear nómina

**Body**:
```json
{
  "dj_id": 1,
  "mes": "2024-02",
  "total_eventos": 12,
  "total_horas": 48,
  "total_bruto": 4800.00,
  "deducciones": 240.00,
  "total_neto": 4560.00,
  "notas": "Nómina de febrero"
}
```

---

#### PUT `/api/nominas/:id`
Actualizar nómina (ej: marcar como pagada)

**Body**:
```json
{
  "estado": "pagado",
  "fecha_pago": "2024-03-01"
}
```

---

### 👥 Socios (`/api/socios`)

#### GET `/api/socios`
Listar todos los socios

**Response 200**:
```json
[
  {
    "id": 1,
    "nombre": "Socio Principal",
    "email": "socio@example.com",
    "porcentaje_participacion": 50.00,
    "activo": true,
    "fecha_ingreso": "2023-01-01"
  }
]
```

---

#### POST `/api/socios`
Crear nuevo socio

---

#### PUT `/api/socios/:id`
Actualizar socio

---

#### DELETE `/api/socios/:id`
Eliminar socio

---

### 📸 Instagram (`/api/instagram`)

#### GET `/api/instagram/metrics/:dj_id`
Obtener métricas de Instagram de un DJ

**Query params**:
- `desde` (opcional): '2024-01-01'
- `hasta` (opcional): '2024-01-31'

**Response 200**:
```json
[
  {
    "id": 1,
    "dj_id": 1,
    "fecha": "2024-01-15",
    "seguidores": 10500,
    "me_gusta": 850,
    "comentarios": 120,
    "publicaciones": 45,
    "engagement_rate": 9.24
  }
]
```

---

#### POST `/api/instagram/metrics`
Registrar nuevas métricas de Instagram

**Body**:
```json
{
  "dj_id": 1,
  "fecha": "2024-01-16",
  "seguidores": 10550,
  "me_gusta": 875,
  "comentarios": 125,
  "publicaciones": 46
}
```

---

#### GET `/api/instagram/alerts/:dj_id`
Obtener alertas de Instagram de un DJ

**Response 200**:
```json
[
  {
    "id": 1,
    "dj_id": 1,
    "tipo_alerta": "follower_drop",
    "mensaje": "Pérdida de 50 seguidores en las últimas 24h",
    "severidad": "warning",
    "leido": false,
    "fecha_alerta": "2024-01-16T10:00:00Z"
  }
]
```

---

#### POST `/api/instagram/alerts`
Crear nueva alerta

---

#### PUT `/api/instagram/alerts/:id/read`
Marcar alerta como leída

---

### 🏢 Agencias (`/api/agencies`)

#### GET `/api/agencies/:id/djs`
Obtener DJs de una agencia específica

**Response 200**:
```json
[
  {
    "id": 1,
    "nombre": "DJ Example",
    "email": "dj@example.com",
    "activo": true,
    "total_eventos_mes": 5
  }
]
```

---

#### POST `/api/agencies/:id/djs`
Agregar DJ a una agencia (asignar DJ existente o crear nuevo)

---

#### DELETE `/api/agencies/:agency_id/djs/:dj_id`
Remover DJ de una agencia

---

#### GET `/api/agencies/:id/stats`
Estadísticas de una agencia

**Response 200**:
```json
{
  "total_djs": 15,
  "total_eventos_mes": 45,
  "facturacion_mes": 22500.00,
  "comisiones_mes": 4500.00,
  "djs_activos": 12
}
```

---

## 🎨 Frontend - Componentes

### Páginas Principales (`/src/pages/`)

#### 1. **Dashboard.jsx**
- Vista general del sistema
- Métricas principales (eventos, ingresos, DJs activos)
- Gráficos de facturación
- Próximos eventos
- Acceso rápido a acciones comunes

#### 2. **Eventos.jsx**
- Listado completo de eventos
- Filtros por: mes, DJ, cliente, categoría
- Vista de tabla con todas las columnas
- Acciones: crear, editar, eliminar eventos
- Indicadores de estado (cobrado, pagado)
- Búsqueda y ordenamiento

#### 3. **Calendario.jsx**
- Vista de calendario mensual
- Eventos mostrados por día
- Color por categoría
- Click en evento para ver detalles
- Navegación entre meses
- Drag & drop (futuro)

#### 4. **DJs.jsx**
- Listado de todos los DJs
- Cards con información clave
- Estadísticas por DJ (eventos, ganancias)
- Acciones CRUD
- Filtro por activo/inactivo
- Búsqueda

#### 5. **Clientes.jsx**
- Listado de clientes/locales
- Información de contacto
- Total de eventos por cliente
- Acciones CRUD
- Búsqueda y filtros

#### 6. **Nominas.jsx**
- Listado de nóminas por mes
- Filtros por mes y DJ
- Estado de pago
- Cálculos automáticos
- Generar nuevas nóminas
- Marcar como pagadas

#### 7. **Socios.jsx**
- Gestión de socios
- Porcentajes de participación
- Cálculo de distribución de ganancias
- Acciones CRUD

#### 8. **DataCleanup.jsx**
- Herramientas de limpieza de datos
- Detección de duplicados
- Corrección de inconsistencias
- Auditoría de datos
- Solo para administradores

#### 9. **Login.jsx**
- Formulario de login
- Registro de nuevas agencias/DJs
- Validación de credenciales
- Redirección post-login

#### 10. **DJComparisonDashboard.jsx** (Componente usado como página)
- Comparación lado a lado de DJs
- Métricas de rendimiento
- Gráficos comparativos
- Instagram analytics

#### 11. **AgencyDJManagement.jsx** (Componente usado como página)
- Gestión de roster de DJs (solo agencias)
- Agregar/remover DJs
- Asignar eventos
- Ver estadísticas por DJ

---

### Componentes Principales (`/src/components/`)

#### Layout & Navigation

##### **Layout.jsx**
- Estructura principal con sidebar
- Header con búsqueda
- Navegación entre páginas
- User menu
- Dark mode toggle
- Notificaciones
- Modo presentación

##### **ProtectedRoute.jsx**
- HOC para rutas protegidas
- Validación de autenticación
- Redirección a login si no autenticado

##### **Sidebar.jsx** (integrado en Layout)
- Navegación lateral
- Enlaces a todas las secciones
- Iconos de lucide-react
- Estado activo visual

---

#### Features

##### **NotificationCenter.jsx**
- Centro de notificaciones
- Dropdown con lista de notificaciones
- Marcar como leídas
- Badge con contador
- Tipos: eventos, pagos, alertas Instagram

##### **CommandPalette.jsx**
- Paleta de comandos tipo Spotlight
- Atajo: `Cmd+K` / `Ctrl+K`
- Búsqueda rápida de:
  - Páginas
  - Eventos
  - DJs
  - Clientes
- Navegación con teclado

##### **QuickActionsPanel.jsx**
- Panel de acciones rápidas
- Botones flotantes para:
  - Crear evento
  - Crear DJ
  - Crear cliente
  - Abrir calculadora de precios
- Posicionado en esquina inferior derecha

##### **PriceCalculator.jsx**
- Calculadora de precios de eventos
- Inputs: horas, caché/hora, % comisión
- Cálculos automáticos:
  - Total del evento
  - Parte del DJ
  - Parte de la agencia
  - €/hora neto para el DJ
- Modal flotante

##### **VirtualAssistant.jsx**
- Asistente virtual contextual
- Sugerencias según la página actual
- Tips y ayuda
- Widget flotante

##### **PresentationMode.jsx**
- Modo de presentación fullscreen
- Métricas principales en grande
- Gráficos destacados
- Sin distracciones
- Para mostrar a clientes/socios

---

#### DJ Management

##### **DJComparisonDashboard.jsx**
- Comparación de hasta 4 DJs
- Métricas comparativas:
  - Eventos totales
  - Facturación
  - €/hora promedio
  - Instagram metrics
- Gráficos de barras/líneas
- Filtros de fecha

##### **AgencyDJManagement.jsx**
- CRUD completo de DJs de la agencia
- Asignación de eventos
- Vista de estadísticas individuales
- Gestión de roster
- Solo visible para agencias

##### **DJCard.jsx**
- Card visual de DJ
- Foto/avatar
- Nombre y contacto
- Estadísticas rápidas
- Botones de acción (editar, ver más)

##### **DJForm.jsx**
- Formulario para crear/editar DJ
- Validaciones
- Campos: nombre, email, teléfono, caché, Instagram
- Modal o inline

---

#### Event Management

##### **EventCard.jsx**
- Card de evento individual
- Fecha y DJ asignado
- Cliente y categoría (con color)
- Caché y horas
- Indicadores de estado (cobrado/pagado)
- Acciones rápidas

##### **EventForm.jsx**
- Formulario para crear/editar evento
- Selects para DJ, cliente, categoría
- Date picker
- Inputs numéricos (horas, caché)
- Checkboxes (cobrado, pagado)
- Validaciones

##### **EventList.jsx**
- Lista/tabla de eventos
- Columnas configurables
- Sorting por columna
- Filtros inline
- Paginación
- Acciones en fila

##### **CalendarView.jsx**
- Vista de calendario interactiva
- Eventos por día
- Colores por categoría
- Click para detalles
- Navegación mes a mes

---

#### Forms & Inputs

##### **ClientForm.jsx**
- Formulario de cliente
- Campos de contacto
- Validaciones de email/teléfono
- Notas adicionales

##### **CategoryForm.jsx**
- Formulario de categoría
- Input de nombre
- Color picker para el color
- Descripción

##### **NominaForm.jsx**
- Formulario de nómina
- Selector de DJ y mes
- Inputs para totales
- Cálculo automático de neto
- Estado de pago

---

#### Analytics & Charts

##### **RevenueChart.jsx**
- Gráfico de ingresos
- Por mes, categoría, o DJ
- Líneas o barras
- Tooltips con detalles
- Responsive

##### **EventsChart.jsx**
- Gráfico de número de eventos
- Distribución por categoría
- Tendencia temporal
- Pie chart o bar chart

##### **DJPerformanceChart.jsx**
- Gráfico de rendimiento de DJs
- Comparación de €/hora
- Eventos por DJ
- Top performers

##### **InstagramMetricsChart.jsx**
- Gráfico de métricas Instagram
- Series de tiempo (seguidores, engagement)
- Comparación entre DJs
- Alertas visuales

---

#### Instagram

##### **InstagramDashboard.jsx**
- Dashboard completo de Instagram
- Métricas consolidadas
- Alertas recientes
- Gráficos de tendencias
- Por DJ o global

##### **InstagramMetricsCard.jsx**
- Card con métricas de un DJ
- Seguidores, likes, comentarios
- Engagement rate
- Cambios recientes (↑↓)

##### **InstagramAlertsList.jsx**
- Lista de alertas de Instagram
- Filtros por severidad
- Marcar como leídas
- Agrupadas por tipo

---

#### UI Components

##### **Modal.jsx**
- Componente modal reutilizable
- Overlay
- Close button
- Responsive
- Animaciones

##### **Button.jsx**
- Botón reutilizable
- Variantes: primary, secondary, danger
- Tamaños: sm, md, lg
- Loading state
- Icons

##### **Input.jsx**
- Input reutilizable
- Label integrado
- Error states
- Tipos: text, number, email, tel, date
- Iconos

##### **Select.jsx**
- Select dropdown reutilizable
- Searchable (opcional)
- Multi-select (opcional)
- Custom options rendering
- React Select o nativo

##### **DatePicker.jsx**
- Selector de fechas
- Rango de fechas (opcional)
- Locale español
- Validaciones

##### **ColorPicker.jsx**
- Selector de color
- Vista de paleta
- Input hex manual
- Preview del color

##### **Badge.jsx**
- Badge/pill de estado
- Colores por tipo
- Tamaños variables
- Iconos opcionales

##### **Tooltip.jsx**
- Tooltip informativo
- Posiciones configurables
- Delay configurable

##### **LoadingSpinner.jsx**
- Spinner de carga
- Tamaños variables
- Overlay opcional

##### **EmptyState.jsx**
- Estado vacío
- Icono y mensaje
- Call to action
- Ilustración (opcional)

##### **ErrorBoundary.jsx**
- Captura errores de React
- Muestra UI amigable
- Log de errores

---

#### Tables

##### **DataTable.jsx**
- Tabla de datos reutilizable
- Sorting
- Pagination
- Filtros
- Selección de filas
- Acciones por fila

##### **Pagination.jsx**
- Controles de paginación
- Números de página
- Siguiente/Anterior
- Items por página

---

#### Utilities

##### **SearchBar.jsx**
- Barra de búsqueda
- Debounced input
- Clear button
- Icono de lupa

##### **FilterPanel.jsx**
- Panel de filtros
- Múltiples criterios
- Apply/Reset buttons
- Colapsable

##### **ExportButton.jsx**
- Botón de exportación
- Formatos: CSV, Excel, PDF
- Descarga directa

##### **ImportButton.jsx**
- Botón de importación
- Upload de archivo
- Validación de datos
- Preview antes de importar

---

### Contexts (`/src/contexts/`)

#### **AuthContext.jsx**
Gestión de autenticación global

**Funciones**:
- `login(email, password)` - Iniciar sesión
- `logout()` - Cerrar sesión
- `register(data)` - Registro de usuario
- `isAgency()` - Check si es agencia
- `isIndividualDJ()` - Check si es DJ individual
- `isAdmin()` - Check si es admin
- `getUserDisplayName()` - Nombre para mostrar

**State**:
```javascript
{
  user: {
    id: 1,
    name: "Nombre",
    email: "email@example.com",
    accountType: "agency",
    commissionPercentage: 20
  },
  token: "jwt_token",
  loading: false,
  isAuthenticated: true
}
```

---

#### **ThemeContext.jsx**
Gestión de tema (dark/light mode)

**Funciones**:
- `toggleTheme()` - Cambiar tema
- `setDarkMode(boolean)` - Forzar tema

**State**:
```javascript
{
  isDark: false,
  theme: "light"
}
```

---

## ✨ Funcionalidades del Sistema

### 1. **Multi-Tenant (Agencias y DJs Individuales)**
- Cada agencia ve solo sus DJs y eventos
- DJs individuales gestionan sus propios datos
- Aislamiento completo de datos por tenant
- Comisiones configurables por agencia

### 2. **Sistema Financiero Automático**
- Cálculo automático de `parte_dj` y `parte_agencia`
- Fórmula: `parte_agencia = cache_total * (commission_percentage / 100)`
- Cálculo de `euro_hora_dj = parte_dj / horas`
- Seguimiento de pagos: `cobrado_cliente`, `pagado_dj`
- Nóminas automáticas por mes

### 3. **Instagram Analytics**
- Tracking de métricas: seguidores, likes, comentarios
- Cálculo de engagement rate
- Alertas automáticas por:
  - Pérdida de seguidores
  - Caída en engagement
  - Inactividad en publicaciones
- Gráficos de tendencias
- Comparación entre DJs

### 4. **Categorización de Eventos**
- Categorías con colores personalizados
- Ejemplos: Residencia, Discoteca, Evento Privado, Festival
- Filtrado visual por color
- Estadísticas por categoría

### 5. **Auditoría Completa**
- Trigger `evento_audit_trigger` registra todos los cambios
- Log de:
  - Quién modificó (usuario_id)
  - Qué cambió (datos_anteriores vs datos_nuevos)
  - Cuándo (timestamp)
- Tabla `evento_audit_log` con historial completo
- Trazabilidad total

### 6. **Búsqueda y Filtros Avanzados**
- Command Palette (`Cmd+K`) para búsqueda global
- Filtros por: mes, DJ, cliente, categoría, estado
- Búsqueda en tiempo real
- Combinación de múltiples filtros

### 7. **Dashboard Interactivo**
- Métricas en tiempo real
- Gráficos de facturación
- Próximos eventos
- Alertas importantes
- Quick actions

### 8. **Modo Presentación**
- Vista fullscreen para presentar
- Métricas destacadas
- Sin elementos de navegación
- Ideal para reuniones

### 9. **Gestión de Nóminas**
- Generación automática por mes
- Cálculo de total bruto, deducciones, neto
- Estados: pendiente, pagado
- Exportación a PDF/Excel

### 10. **Calculadora de Precios**
- Tool rápida para cotizar eventos
- Inputs: horas, €/hora, % comisión
- Cálculos instantáneos
- Resultados: total, parte DJ, parte agencia

### 11. **Dark Mode**
- Tema oscuro/claro
- Persistencia en localStorage
- Toggle rápido en sidebar
- Diseño adaptado con TailwindCSS

### 12. **Notificaciones**
- Sistema de notificaciones en tiempo real
- Tipos: eventos, pagos, alertas Instagram
- Badge con contador
- Marcar como leídas
- Centro de notificaciones

### 13. **Asistente Virtual**
- Sugerencias contextuales según la página
- Tips de uso
- Ayuda rápida
- Widget flotante

### 14. **Responsive Design**
- Adaptado a mobile, tablet, desktop
- Sidebar colapsable en mobile
- Tablas responsivas
- Formularios optimizados

### 15. **Data Cleanup (Admin)**
- Detección de duplicados
- Corrección de inconsistencias
- Herramientas de auditoría
- Solo para administradores

---

## 🔄 Flujos de Trabajo Principales

### Flujo 1: Crear Evento como Agencia

```
1. Login como Agencia
   ↓
2. Dashboard → Ver métricas actuales
   ↓
3. Click en "Nuevo Evento" (Quick Action o Eventos)
   ↓
4. Formulario de evento:
   - Seleccionar DJ (solo de mi roster)
   - Seleccionar Cliente
   - Seleccionar Categoría
   - Ingresar Fecha
   - Ingresar Horas
   - Ingresar Caché Total
   ↓
5. Backend calcula automáticamente:
   - parte_agencia = cache_total * (20 / 100) = cache_total * 0.20
   - parte_dj = cache_total - parte_agencia
   - euro_hora_dj = parte_dj / horas
   - mes = extraído de fecha
   ↓
6. Evento guardado en DB con created_by = agency_id
   ↓
7. Trigger evento_audit_trigger registra la creación
   ↓
8. Notificación al DJ (opcional)
   ↓
9. Evento visible en:
   - Lista de Eventos (filtrada por agencia)
   - Calendario
   - Dashboard (estadísticas actualizadas)
```

---

### Flujo 2: DJ Individual Gestiona su Evento

```
1. Login como DJ Individual
   ↓
2. Dashboard → Ver mis eventos y ganancias
   ↓
3. Crear nuevo evento:
   - Solo puede asignarse a sí mismo
   - No hay comisión de agencia (0%)
   - parte_dj = cache_total (100%)
   ↓
4. Evento guardado con:
   - dj_id = su propio ID
   - parte_agencia = 0
   - parte_dj = cache_total
   ↓
5. Ver estadísticas propias:
   - Total eventos
   - Total ganado
   - €/hora promedio
```

---

### Flujo 3: Seguimiento de Pagos

```
1. Evento creado → Estado inicial:
   - cobrado_cliente = false
   - pagado_dj = false
   ↓
2. Agencia cobra al cliente:
   - Marca checkbox "Cobrado Cliente"
   - cobrado_cliente = true
   - (Opcional) Registra fecha de cobro
   ↓
3. Trigger de auditoría registra el cambio
   ↓
4. Agencia paga al DJ:
   - Marca checkbox "Pagado DJ"
   - pagado_dj = true
   - (Opcional) Genera nómina mensual
   ↓
5. Dashboard actualiza métricas:
   - Eventos pendientes de cobro
   - DJs pendientes de pago
   - Cash flow
```

---

### Flujo 4: Instagram Analytics

```
1. DJ tiene instagram_username configurado
   ↓
2. Sistema recolecta métricas (manual o automático):
   - Seguidores
   - Me gusta
   - Comentarios
   - Publicaciones
   ↓
3. Backend calcula engagement_rate:
   - engagement_rate = ((me_gusta + comentarios) / seguidores) * 100
   ↓
4. Sistema analiza cambios:
   - Si seguidores < anterior_seguidores → Alerta "follower_drop"
   - Si engagement_rate < umbral → Alerta "low_engagement"
   - Si días_sin_publicar > 7 → Alerta "inactivity"
   ↓
5. Alertas guardadas en instagram_alerts
   ↓
6. Notificación en NotificationCenter
   ↓
7. Dashboard de Instagram muestra:
   - Gráficos de tendencias
   - Alertas activas
   - Comparación entre DJs
   ↓
8. Manager/Agencia toma acción:
   - Contactar al DJ
   - Planificar contenido
   - Ajustar estrategia
```

---

### Flujo 5: Generación de Nómina Mensual

```
1. Fin de mes → Manager accede a Nóminas
   ↓
2. Click en "Generar Nómina"
   ↓
3. Seleccionar:
   - DJ (o todos)
   - Mes (ej: 2024-01)
   ↓
4. Backend consulta eventos del mes:
   SELECT
     COUNT(*) as total_eventos,
     SUM(horas) as total_horas,
     SUM(parte_dj) as total_bruto
   FROM eventos
   WHERE dj_id = X AND mes = '2024-01' AND pagado_dj = false
   ↓
5. Calcular deducciones (ej: 5%):
   - deducciones = total_bruto * 0.05
   - total_neto = total_bruto - deducciones
   ↓
6. Crear registro en tabla nominas:
   - dj_id, mes, total_eventos, total_horas
   - total_bruto, deducciones, total_neto
   - estado = 'pendiente'
   ↓
7. Mostrar nómina para revisión
   ↓
8. Manager aprueba y marca como pagada:
   - estado = 'pagado'
   - fecha_pago = hoy
   ↓
9. Actualizar eventos:
   - UPDATE eventos SET pagado_dj = true WHERE ...
   ↓
10. Notificación al DJ (opcional)
```

---

## 🚀 Próximas Mejoras Sugeridas

### Del análisis de `app-service`:

1. **Módulo REQUEST/QUOTE**
   - Sistema de solicitudes pre-evento
   - Workflow: Cliente solicita → Pendiente → Aprobado/Rechazado → Evento creado
   - Estados: pending, approved, rejected, in_progress, completed
   - Prioridades: low, medium, high, urgent

2. **Tiempos precisos de inicio/fin**
   - Agregar columnas `start_time`, `end_time` en eventos
   - Cálculo automático de horas = (end_time - start_time)

3. **Arquitectura limpia (Hexagonal)**
   - Refactorizar backend a capas: Domain, Application, Infrastructure
   - Mayor testabilidad y mantenibilidad

4. **TypeScript en Backend**
   - Migrar de JavaScript a TypeScript
   - Mejor tipado y menos errores

---

## 📝 Notas Finales

Este sistema fue diseñado para:
- ✅ Agencias que gestionan múltiples DJs
- ✅ DJs individuales que gestionan su propia carrera
- ✅ Automatizar cálculos financieros complejos
- ✅ Trackear métricas de Instagram
- ✅ Auditoría completa de cambios
- ✅ Experiencia de usuario moderna y rápida

**Desarrollado con**: React + Express + PostgreSQL
**Arquitectura**: Multi-tenant con roles
**Estado actual**: Producción (funcional)

---

## 🔗 Integración con App Móvil

Este BACKOFFICE WEB trabaja en conjunto con la **APP MÓVIL para DJs** (app-service). Para detalles sobre:
- Arquitectura de integración
- Flujos de trabajo entre sistemas
- Roadmap de implementación
- Adaptaciones necesarias

**Ver documento**: `intra-media-system-architecture.md`

---

**Última actualización**: 2025-01-24
**Versión del documento**: 2.0
**Autor**: Intra Media System - Documentación del Ecosistema
