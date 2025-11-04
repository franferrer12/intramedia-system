# 🏗️ ARQUITECTURA FUTURA - INTRA MEDIA SYSTEM

## Visión General del Sistema Expandido

---

## 📊 ARQUITECTURA ACTUAL vs FUTURA

### Estado Actual (Fase 1)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │Dashboard │ Eventos  │   DJs    │ Clientes │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │  Events  │   DJs    │ Clients  │  Billing │          │
│  │    API   │   API    │   API    │    API   │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│               PostgreSQL Database                        │
│  eventos | djs | clientes | pagos | nominas              │
└──────────────────────────────────────────────────────────┘
```

### Visión Futura (Fases 2-9)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │  Web Admin     │  │  Web Público   │  │  Mobile Apps   │              │
│  │  (React)       │  │  (Next.js)     │  │ (React Native) │              │
│  │                │  │                │  │                │              │
│  │ • Dashboard    │  │ • Marketplace  │  │ • DJ App       │              │
│  │ • CRM          │  │ • Booking      │  │ • Client App   │              │
│  │ • Marketing    │  │ • Blog         │  │ • Push Notif   │              │
│  │ • Analytics    │  │ • Portal       │  │ • Offline      │              │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘              │
│           │                   │                   │                       │
└───────────┼───────────────────┼───────────────────┼───────────────────────┘
            │                   │                   │
            │    REST API       │   GraphQL API     │   Mobile API
            │                   │                   │
┌───────────▼───────────────────▼───────────────────▼───────────────────────┐
│                          API GATEWAY (Express)                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐                │
│  │ Rate Limit  │   Auth      │   CORS      │   Logger    │                │
│  └─────────────┴─────────────┴─────────────┴─────────────┘                │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                        CAPA DE SERVICIOS                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Core Business│  │  CRM Service │  │  Marketing   │  │  Analytics   │  │
│  │   Service    │  │              │  │   Service    │  │   Service    │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │• Eventos     │  │• Leads       │  │• Campaigns   │  │• Reports     │  │
│  │• DJs         │  │• Pipeline    │  │• Email Mkt   │  │• Forecasting │  │
│  │• Clientes    │  │• Scoring     │  │• Social Mkt  │  │• Dashboards  │  │
│  │• Pagos       │  │• Quotes      │  │• A/B Tests   │  │• BI          │  │
│  │• Nóminas     │  │• Follow-ups  │  │• SEO         │  │• ML Models   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │                 │          │
│  ┌──────▼──────────────────▼──────────────────▼─────────────────▼──────┐  │
│  │                    WORKFLOW ENGINE                                   │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┐              │  │
│  │  │ Triggers   │ Conditions │  Actions   │ Schedules  │              │  │
│  │  └────────────┴────────────┴────────────┴────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    JOB QUEUE (BullMQ)                                 │  │
│  │  • Email jobs  • SMS jobs  • PDF generation  • Data sync             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                     CAPA DE INTEGRACIONES                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Payments   │  │ Communications│ │  Productivity│  │  Accounting  │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │• Stripe      │  │• SendGrid    │  │• Google Cal  │  │• QuickBooks  │  │
│  │• PayPal      │  │• Twilio SMS  │  │• Google Drive│  │• Xero        │  │
│  │• Mercado Pago│  │• WhatsApp    │  │• Zoom        │  │• FreshBooks  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Marketing   │  │  Social       │  │     AI       │  │   Storage    │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │• Google Ads  │  │• Instagram   │  │• OpenAI GPT  │  │• AWS S3      │  │
│  │• Facebook Ads│  │• Facebook    │  │• ML Models   │  │• Cloudinary  │  │
│  │• Mailchimp   │  │• TikTok      │  │• Analytics   │  │• Google Cloud│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                        CAPA DE DATOS                                       │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Primary Database)                            │  │
│  │                                                                       │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┐              │  │
│  │  │ Core Data  │  CRM Data  │ Marketing  │ Analytics  │              │  │
│  │  │            │            │   Data     │   Data     │              │  │
│  │  │• eventos   │• leads     │• campaigns │• reports   │              │  │
│  │  │• djs       │• pipeline  │• emails    │• metrics   │              │  │
│  │  │• clientes  │• quotes    │• landing   │• kpis      │              │  │
│  │  │• pagos     │• interactions│• forms   │• forecasts │              │  │
│  │  └────────────┴────────────┴────────────┴────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Redis     │  │  Elasticsearch│ │  TimescaleDB │  │   MinIO      │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │• Cache       │  │• Full-text   │  │• Time-series │  │• File storage│  │
│  │• Sessions    │  │  search      │  │  analytics   │  │• Media files │  │
│  │• Job queue   │  │• Logs        │  │• Metrics     │  │• Backups     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 ARQUITECTURA DE MICROSERVICIOS (Fase Avanzada)

### Opción para Escalar (Fase 9+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY (Kong / Nginx)                        │
│                     • Routing  • Auth  • Rate Limiting                     │
└───────────────┬──────────────┬──────────────┬────────────────┬────────────┘
                │              │              │                │
        ┌───────▼────┐  ┌──────▼─────┐  ┌────▼─────┐  ┌──────▼─────┐
        │   Events   │  │    CRM     │  │Marketing │  │  Analytics │
        │  Service   │  │  Service   │  │ Service  │  │   Service  │
        │            │  │            │  │          │  │            │
        │ Node.js    │  │  Node.js   │  │ Node.js  │  │   Python   │
        │ Port: 3001 │  │ Port: 3002 │  │Port: 3003│  │Port: 5000  │
        └────┬───────┘  └─────┬──────┘  └────┬─────┘  └──────┬─────┘
             │                │               │               │
             │                │               │               │
        ┌────▼────────────────▼───────────────▼───────────────▼─────┐
        │              Message Queue (RabbitMQ / Kafka)             │
        │           • Event Bus  • Async Processing                 │
        └───────────────────────────────────────────────────────────┘
             │                │               │               │
        ┌────▼────┐      ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
        │  DB 1   │      │  DB 2   │    │  DB 3   │    │  DB 4   │
        │ Events  │      │  CRM    │    │Marketing│    │Analytics│
        └─────────┘      └─────────┘    └─────────┘    └─────────┘
```

**Ventajas:**
- Escalabilidad independiente por servicio
- Tecnologías óptimas por dominio (Python para ML, Node para APIs)
- Fault tolerance (un servicio caído no afecta otros)
- Deployment independiente

**Desventajas:**
- Mayor complejidad operativa
- Requires DevOps expertise
- Distributed transactions challenges

---

## 🗄️ MODELO DE DATOS EXPANDIDO

### Nuevas Tablas (Fases 2-6)

#### **CRM Module**

```sql
-- Leads y Pipeline
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  empresa VARCHAR(255),

  -- Información del evento potencial
  tipo_evento VARCHAR(100),
  fecha_evento DATE,
  ubicacion VARCHAR(255),
  presupuesto_estimado DECIMAL(10,2),
  num_invitados INTEGER,

  -- Pipeline
  etapa VARCHAR(50) DEFAULT 'nuevo',
  -- nuevo | contactado | calificado | propuesta | negociacion | ganado | perdido

  -- Scoring
  puntuacion INTEGER DEFAULT 0,
  probabilidad_conversion INTEGER, -- 0-100%

  -- Metadata
  fuente VARCHAR(100), -- web, redes, referido, evento, otros
  estado VARCHAR(50) DEFAULT 'activo',
  asignado_a INTEGER REFERENCES usuarios(id),

  -- Tracking
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_ultimo_contacto TIMESTAMP,
  fecha_conversion TIMESTAMP,
  convertido_a INTEGER REFERENCES clientes(id),

  -- Notas
  notas TEXT,
  tags TEXT[]
);

CREATE TABLE interacciones (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  tipo VARCHAR(50), -- llamada, email, reunion, whatsapp, nota

  asunto VARCHAR(255),
  descripcion TEXT,
  resultado VARCHAR(100), -- contactado, no_contesta, interesado, no_interesado

  proxima_accion VARCHAR(255),
  fecha_proxima_accion DATE,

  usuario_id INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cotizaciones (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  cliente_id INTEGER REFERENCES clientes(id),

  numero_cotizacion VARCHAR(50) UNIQUE,

  -- Detalles del servicio
  tipo_evento VARCHAR(100),
  fecha_evento DATE,
  duracion_horas INTEGER,

  -- Items
  items JSONB, -- Array de {descripcion, cantidad, precio_unitario, total}

  -- Montos
  subtotal DECIMAL(10,2),
  descuento DECIMAL(10,2) DEFAULT 0,
  impuestos DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),

  -- Estado
  estado VARCHAR(50) DEFAULT 'borrador',
  -- borrador | enviada | vista | aceptada | rechazada | expirada

  fecha_emision DATE,
  fecha_vencimiento DATE,
  fecha_aceptacion DATE,

  -- Tracking
  token_publico VARCHAR(255) UNIQUE, -- Para link público
  veces_vista INTEGER DEFAULT 0,

  -- Conversión
  convertida_a INTEGER REFERENCES eventos(id),

  notas TEXT,
  terminos_condiciones TEXT
);

CREATE TABLE seguimientos_automaticos (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),

  secuencia VARCHAR(100), -- nombre de la secuencia
  paso_actual INTEGER,
  total_pasos INTEGER,

  estado VARCHAR(50), -- activa, pausada, completada, cancelada

  fecha_inicio TIMESTAMP,
  fecha_proximo_paso TIMESTAMP
);
```

#### **Marketing Module**

```sql
-- Campañas de Email
CREATE TABLE campanas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- email, sms, whatsapp, social

  -- Contenido
  asunto VARCHAR(255),
  contenido_html TEXT,
  contenido_texto TEXT,

  -- Segmentación
  segmento JSONB, -- Filtros para destinatarios

  -- Estado
  estado VARCHAR(50) DEFAULT 'borrador',
  -- borrador | programada | enviando | enviada | pausada | cancelada

  -- Programación
  fecha_programada TIMESTAMP,
  fecha_inicio_envio TIMESTAMP,
  fecha_fin_envio TIMESTAMP,

  -- Métricas
  total_destinatarios INTEGER,
  total_enviados INTEGER DEFAULT 0,
  total_entregados INTEGER DEFAULT 0,
  total_abiertos INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_rebotes INTEGER DEFAULT 0,
  total_desuscripciones INTEGER DEFAULT 0,

  -- Metadata
  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE templates_email (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100), -- marketing, transaccional, notificacion

  asunto VARCHAR(255),
  contenido_html TEXT,

  variables JSONB, -- {nombre, ejemplo, descripcion}

  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE listas_correo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  tipo VARCHAR(50), -- manual, automatica, importada
  criterios JSONB, -- Para listas automáticas

  total_contactos INTEGER DEFAULT 0,

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contactos_lista (
  id SERIAL PRIMARY KEY,
  lista_id INTEGER REFERENCES listas_correo(id),

  contacto_tipo VARCHAR(50), -- lead, cliente, dj
  contacto_id INTEGER, -- Referencia polimórfica

  estado VARCHAR(50) DEFAULT 'suscrito',
  -- suscrito | desuscrito | rebotado | queja_spam

  fecha_suscripcion TIMESTAMP DEFAULT NOW(),
  fecha_desuscripcion TIMESTAMP
);

CREATE TABLE envios_email (
  id SERIAL PRIMARY KEY,
  campana_id INTEGER REFERENCES campanas(id),

  destinatario_email VARCHAR(255),
  destinatario_nombre VARCHAR(255),

  estado VARCHAR(50), -- enviado, entregado, rebotado, abierto, clicked

  fecha_envio TIMESTAMP,
  fecha_entrega TIMESTAMP,
  fecha_apertura TIMESTAMP,
  fecha_click TIMESTAMP,

  clicks_totales INTEGER DEFAULT 0,
  aperturas_totales INTEGER DEFAULT 0,

  error_mensaje TEXT,

  -- Para trackear
  token_tracking VARCHAR(255) UNIQUE
);

-- Landing Pages
CREATE TABLE landing_pages (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,

  titulo VARCHAR(255),
  descripcion TEXT,

  contenido_html TEXT,
  contenido_config JSONB, -- Configuración del builder

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,

  -- Estado
  publicada BOOLEAN DEFAULT false,
  fecha_publicacion TIMESTAMP,

  -- Tracking
  total_visitas INTEGER DEFAULT 0,
  total_conversiones INTEGER DEFAULT 0,

  -- A/B Testing
  variante_de INTEGER REFERENCES landing_pages(id),

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE formularios (
  id SERIAL PRIMARY KEY,
  landing_page_id INTEGER REFERENCES landing_pages(id),

  nombre VARCHAR(255),
  campos JSONB, -- Definición de campos

  -- Configuración
  accion_envio VARCHAR(50), -- crear_lead, enviar_email, webhook
  webhook_url VARCHAR(255),
  email_notificacion VARCHAR(255),

  redirect_url VARCHAR(255),
  mensaje_exito TEXT,

  -- Stats
  total_envios INTEGER DEFAULT 0,

  activo BOOLEAN DEFAULT true
);

CREATE TABLE respuestas_formulario (
  id SERIAL PRIMARY KEY,
  formulario_id INTEGER REFERENCES formularios(id),

  respuestas JSONB, -- {campo: valor}

  -- Metadata
  ip_origen VARCHAR(50),
  user_agent TEXT,
  url_origen VARCHAR(255),

  lead_creado INTEGER REFERENCES leads(id),

  fecha_envio TIMESTAMP DEFAULT NOW()
);

-- Social Media
CREATE TABLE posts_social (
  id SERIAL PRIMARY KEY,

  contenido TEXT,
  imagenes TEXT[], -- URLs
  videos TEXT[], -- URLs

  plataformas TEXT[], -- instagram, facebook, tiktok, twitter

  estado VARCHAR(50) DEFAULT 'borrador',
  -- borrador | programado | publicando | publicado | error

  fecha_programada TIMESTAMP,
  fecha_publicacion TIMESTAMP,

  -- IDs en cada plataforma
  ids_plataforma JSONB, -- {instagram: "id123", facebook: "id456"}

  -- Métricas agregadas
  total_likes INTEGER DEFAULT 0,
  total_comentarios INTEGER DEFAULT 0,
  total_compartidos INTEGER DEFAULT 0,
  total_vistas INTEGER DEFAULT 0,

  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE metricas_social (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts_social(id),
  plataforma VARCHAR(50),

  likes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  compartidos INTEGER DEFAULT 0,
  vistas INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,

  fecha_snapshot TIMESTAMP DEFAULT NOW()
);
```

#### **Analytics & Reporting Module**

```sql
CREATE TABLE reportes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(100), -- ventas, marketing, operaciones, financiero

  configuracion JSONB, -- Filtros, métricas, visualizaciones

  frecuencia VARCHAR(50), -- manual, diaria, semanal, mensual

  destinatarios TEXT[], -- emails para envío automático

  ultimo_envio TIMESTAMP,
  proximo_envio TIMESTAMP,

  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kpis (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),

  valor_actual DECIMAL(15,2),
  valor_objetivo DECIMAL(15,2),
  unidad VARCHAR(50), -- $, %, num, etc

  periodo VARCHAR(50), -- hoy, semana, mes, trimestre, año
  fecha_periodo DATE,

  tendencia VARCHAR(20), -- up, down, stable
  porcentaje_cambio DECIMAL(5,2),

  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE eventos_analytics (
  id SERIAL PRIMARY KEY,

  evento VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),

  usuario_id INTEGER REFERENCES usuarios(id),
  sesion_id VARCHAR(255),

  propiedades JSONB,

  -- Contexto
  ip VARCHAR(50),
  user_agent TEXT,
  url VARCHAR(500),

  fecha TIMESTAMP DEFAULT NOW()
);
```

#### **Workflow Engine**

```sql
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  trigger_tipo VARCHAR(100), -- lead_creado, evento_confirmado, pago_recibido, etc
  trigger_config JSONB,

  pasos JSONB, -- Array de pasos con acciones y condiciones

  activo BOOLEAN DEFAULT true,

  -- Stats
  total_ejecuciones INTEGER DEFAULT 0,
  total_exitosas INTEGER DEFAULT 0,
  total_fallidas INTEGER DEFAULT 0,

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ejecuciones_workflow (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES workflows(id),

  -- Contexto
  entidad_tipo VARCHAR(50), -- lead, evento, cliente
  entidad_id INTEGER,

  estado VARCHAR(50), -- ejecutando, completada, fallida, cancelada

  paso_actual INTEGER,
  total_pasos INTEGER,

  log JSONB, -- Log detallado de cada paso

  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,

  error_mensaje TEXT
);
```

---

## 🔐 ARQUITECTURA DE SEGURIDAD

### Multi-Tenant Security

```sql
-- Row-Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.current_tenant')::integer);

-- Todos los queries automáticamente filtrados por tenant
SET app.current_tenant = '123';
SELECT * FROM leads; -- Solo ve leads de su tenant
```

### Roles y Permisos Expandidos

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE,
  descripcion TEXT,
  permisos JSONB
);

-- Roles propuestos
INSERT INTO roles (nombre, permisos) VALUES
('super_admin', '{"all": true}'),
('admin', '{
  "eventos": ["read", "create", "update", "delete"],
  "djs": ["read", "create", "update", "delete"],
  "clientes": ["read", "create", "update", "delete"],
  "leads": ["read", "create", "update", "delete"],
  "marketing": ["read", "create", "update", "delete"],
  "analytics": ["read"]
}'),
('sales', '{
  "leads": ["read", "create", "update"],
  "clientes": ["read", "create"],
  "eventos": ["read", "create"],
  "cotizaciones": ["read", "create", "update"]
}'),
('marketing', '{
  "leads": ["read"],
  "campanas": ["read", "create", "update"],
  "landing_pages": ["read", "create", "update"],
  "analytics": ["read"]
}'),
('dj', '{
  "eventos": ["read_own"],
  "pagos": ["read_own"],
  "perfil": ["update_own"]
}'),
('cliente', '{
  "eventos": ["read_own"],
  "pagos": ["create"],
  "cotizaciones": ["read_own"]
}');
```

---

## 🚀 INFRAESTRUCTURA & DEVOPS

### Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE (CDN)                        │
│                  • DDoS Protection                           │
│                  • SSL/TLS                                   │
│                  • DNS                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              LOAD BALANCER (Nginx / AWS ALB)                 │
└───────────┬─────────────────────┬───────────────────────────┘
            │                     │
   ┌────────▼─────┐      ┌────────▼─────┐      ┌──────────┐
   │   Server 1   │      │   Server 2   │      │ Server N │
   │              │      │              │      │          │
   │ • Frontend   │      │ • Frontend   │      │• Frontend│
   │ • Backend    │      │ • Backend    │      │• Backend │
   │ • Docker     │      │ • Docker     │      │• Docker  │
   └────────┬─────┘      └────────┬─────┘      └────┬─────┘
            │                     │                  │
            └──────────┬──────────┴──────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   Database Cluster          │
        │                             │
        │  ┌─────────┐   ┌─────────┐ │
        │  │ Primary │───│ Replica │ │
        │  │   DB    │   │   DB    │ │
        │  └─────────┘   └─────────┘ │
        └─────────────────────────────┘
```

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000/api
    volumes:
      - ./frontend:/app
    depends_on:
      - backend

  # Backend
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/intra_media
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis

  # Database
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=intra_media
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis (cache + job queue)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Elasticsearch (opcional - para búsquedas)
  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

  # Worker (para jobs en background)
  worker:
    build: ./backend
    command: node src/workers/index.js
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/intra_media
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
```

---

## 📊 MONITORING & OBSERVABILITY

### Stack de Monitoring

```
┌────────────────────────────────────────────────────────────┐
│                     APPLICATION                             │
│  • Express API                                              │
│  • React Frontend                                           │
└──────────┬──────────────────────────────────┬──────────────┘
           │                                  │
           │ Logs                             │ Metrics
           │                                  │
    ┌──────▼──────┐                    ┌──────▼──────┐
    │   Loki      │                    │ Prometheus  │
    │  (Logs)     │                    │ (Metrics)   │
    └──────┬──────┘                    └──────┬──────┘
           │                                  │
           └──────────┬───────────────────────┘
                      │
              ┌───────▼────────┐
              │    Grafana     │
              │ (Visualization)│
              └────────────────┘
                      │
              ┌───────▼────────┐
              │  Alertmanager  │
              │  (Alerts)      │
              └────────────────┘
```

### Métricas Clave a Trackear

**Performance:**
- Response time (p50, p95, p99)
- Requests per second
- Error rate
- Database query time

**Business:**
- Leads creados por día
- Conversion rate
- Revenue por mes
- Active users

**Infrastructure:**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

---

## 🎯 RESUMEN DE TECNOLOGÍAS PROPUESTAS

### Core Stack (Ya tienen)
✅ React + Vite + Tailwind
✅ Node.js + Express
✅ PostgreSQL
✅ JWT Auth

### A Agregar (Por Fase)

**Fase 2-3 (CRM + Marketing):**
- Sendgrid/Mailgun - Email delivery
- Bull/BullMQ - Job queues
- Redis - Cache + sessions

**Fase 4 (Automation):**
- Temporal.io o n8n - Workflow engine
- OpenAI API - IA chatbot

**Fase 5 (Analytics):**
- Mixpanel/Amplitude - Product analytics
- Metabase - BI self-service

**Fase 6 (Marketplace):**
- Next.js - SEO-friendly frontend público
- Stripe - Pagos online
- Algolia - Search as a service

**Fase 7 (Mobile):**
- React Native - iOS + Android
- Firebase - Push notifications

**Fase 8 (Integrations):**
- Zapier/Make - No-code integrations
- OAuth2 - Integraciones con terceros

**Fase 9 (Multi-tenant):**
- Row-Level Security - Aislamiento de datos
- Stripe Billing - Subscripciones

---

## ✅ CONCLUSIÓN

Esta arquitectura está diseñada para:

✅ **Escalar** de 10 a 10,000+ usuarios
✅ **Ser flexible** para agregar nuevas funcionalidades
✅ **Mantener performance** con caching y optimizaciones
✅ **Ser segura** con isolation multi-tenant
✅ **Facilitar el mantenimiento** con arquitectura modular

**Siguiente paso:** Revisar el ROADMAP_ESTRATEGICO.md y decidir qué fase atacar primero.
