# 🎵 INTRA MEDIA SYSTEM - Documentación del Ecosistema

**Sistema integral de gestión para Agencias y DJs**

---

## 📚 Índice de Documentación

### 1. 📋 Este documento (README)
**Resumen ejecutivo** y navegación de la documentación

### 2. 📄 [intra-media-system-structure.md](./intra-media-system-structure.md)
**Documentación técnica del BACKOFFICE WEB**
- Schema completo de base de datos (15+ tablas)
- API REST (50+ endpoints documentados)
- Componentes React (30+ componentes)
- Funcionalidades del sistema

### 3. 🏗️ [intra-media-system-architecture.md](./intra-media-system-architecture.md)
**Arquitectura completa del ecosistema**
- Integración BACKOFFICE ↔ APP MÓVIL
- Flujos de trabajo
- Roadmap de implementación
- Adaptaciones necesarias

---

## 🎯 ¿Qué es Intra Media System?

Intra Media System es un **ecosistema completo** compuesto por **dos sistemas complementarios**:

```
╔════════════════════════════════════════════════════════════╗
║              INTRA MEDIA SYSTEM - ECOSISTEMA               ║
╚════════════════════════════════════════════════════════════╝

┌──────────────────────────────┐  ┌──────────────────────────────┐
│   🖥️  BACKOFFICE WEB         │  │   📱 APP MÓVIL PARA DJS      │
│                              │  │                              │
│  Carpeta:                    │  │  Carpeta:                    │
│  intra-media-system/         │  │  app-service/                │
│                              │  │                              │
│  Stack:                      │  │  Stack:                      │
│  • React + Vite (5174)       │  │  • React Native + Expo       │
│  • Express.js (3001)         │  │  • NestJS (3000)             │
│  • PostgreSQL                │  │  • PostgreSQL (COMPARTIDA)   │
│                              │  │                              │
│  Usuarios:                   │  │  Usuarios:                   │
│  • Agencias (Managers)       │  │  • DJs (vista móvil)         │
│  • DJs Individuales          │  │                              │
│  • Administradores           │  │                              │
│                              │  │                              │
│  Funciones:                  │  │  Funciones:                  │
│  • Gestión completa          │  │  • Ver bolos                 │
│  • Finanzas (comisiones)     │  │  • Notificaciones push       │
│  • Instagram Analytics       │  │  • Solicitudes (requests)    │
│  • CRM de clientes           │  │  • Disponibilidad            │
│  • Nóminas                   │  │  • Consulta de finanzas      │
│  • Dashboard con métricas    │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
                 ↓                                 ↓
                 └─────────────┬───────────────────┘
                               ↓
                ╔══════════════════════════════╗
                ║  PostgreSQL (Base Compartida)║
                ╚══════════════════════════════╝
```

---

## 👥 Roles y Uso del Sistema

### 👔 **AGENCIA (Manager)**

**Usa**: 🖥️ BACKOFFICE WEB

**Puede hacer**:
- ✅ Ver todos sus DJs gestionados
- ✅ Crear y asignar eventos a sus DJs
- ✅ Gestionar finanzas (comisiones automáticas)
- ✅ Ver Instagram analytics de sus DJs
- ✅ Gestionar clientes/locales
- ✅ Generar nóminas mensuales
- ✅ Dashboard con métricas consolidadas

**NO puede**:
- ❌ Ver DJs de otras agencias
- ❌ Ver DJs individuales (sin agencia)

---

### 🎵 **DJ GESTIONADO POR AGENCIA**

**Usa**: 📱 APP MÓVIL

**Puede hacer**:
- ✅ Ver sus propios eventos/bolos
- ✅ Ver dinero ganado este mes
- ✅ Ver próximos eventos
- ✅ Recibir notificaciones push (nuevos eventos, pagos)
- ✅ Solicitar cambios (requests)
- ✅ Actualizar su disponibilidad

**NO puede**:
- ❌ Crear eventos (lo hace su agencia)
- ❌ Editar eventos existentes
- ❌ Ver eventos de otros DJs

**Nota**: Opcionalmente también puede acceder al BACKOFFICE WEB (solo lectura)

---

### 🎧 **DJ INDIVIDUAL (Sin agencia)**

**Usa**: 🖥️ BACKOFFICE WEB (completo)

**Puede hacer**:
- ✅ Crear sus propios eventos
- ✅ Gestionar sus clientes
- ✅ Ver sus finanzas (sin comisiones - 100% para él)
- ✅ Dashboard personal
- ✅ Instagram analytics

**Diferencia con DJ gestionado**:
- Control total sobre sus datos
- Sin comisiones de agencia (`parte_agencia = 0`)
- No aparece en dashboard de ninguna agencia

**Nota**: También puede usar la APP MÓVIL para consultas rápidas

---

### 🔧 **ADMINISTRADOR**

**Usa**: 🖥️ BACKOFFICE WEB (acceso total)

**Puede hacer**:
- ✅ Ver TODO (todas las agencias, todos los DJs)
- ✅ Gestión de usuarios
- ✅ Data cleanup
- ✅ Configuración global
- ✅ Auditoría completa

---

## 🏗️ Arquitectura Técnica

### Características Principales

#### ✅ **Base de Datos Compartida**
- Una sola PostgreSQL para ambos sistemas
- Sincronización automática (no necesaria)
- Un solo punto de verdad

#### ✅ **Autenticación Compartida**
- JWT con el mismo SECRET
- Un token válido en ambos sistemas
- Login desde web o móvil indistintamente

#### ✅ **Multi-Tenant**
- Aislamiento de datos por agencia
- DJs individuales con sus propios datos
- Admin ve todo

#### ✅ **Responsabilidades Claras**

| Funcionalidad | BACKOFFICE | APP MÓVIL |
|---------------|------------|-----------|
| Crear eventos | ✅ Sí | ❌ No (solo si es DJ individual) |
| Ver eventos | ✅ Todos los permitidos | ✅ Solo propios |
| Editar eventos | ✅ Sí | ❌ No (puede solicitar cambio) |
| Gestionar finanzas | ✅ Completo | ✅ Solo consulta |
| Instagram Analytics | ✅ Completo | ❌ No implementado |
| Push Notifications | ❌ No | ✅ Sí |
| Solicitudes (Requests) | ✅ Ver y aprobar | ✅ Crear |
| Disponibilidad | ✅ Ver | ✅ Actualizar |

---

## 🔄 Flujos de Trabajo Principales

### Flujo 1: Agencia crea evento → DJ recibe notificación

```
1. Manager (BACKOFFICE WEB)
   └─ Crea evento y asigna a DJ "Juan"

2. Express API (puerto 3001)
   └─ Inserta en tabla 'eventos'

3. PostgreSQL
   └─ Evento guardado

4. NestJS API (puerto 3000) - detecta nuevo evento
   └─ Envía Push Notification

5. DJ Juan (APP MÓVIL)
   └─ Recibe: "Nuevo evento: Boda en Madrid - Sábado 20"
```

---

### Flujo 2: DJ solicita cambio → Manager aprueba

```
1. DJ María (APP MÓVIL)
   └─ Ve que horario está mal: "20:00-01:00" ❌
   └─ Crea Request: "Cambiar a 22:00-03:00"

2. NestJS API (puerto 3000)
   └─ Inserta en tabla 'requests'

3. Manager (BACKOFFICE WEB)
   └─ Ve badge "1 solicitud pendiente"
   └─ Revisa solicitud de María
   └─ Aprueba y edita el evento

4. Express API (puerto 3001)
   └─ Actualiza evento
   └─ Marca request como 'approved'

5. NestJS API (puerto 3000)
   └─ Detecta request aprobado
   └─ Envía Push Notification

6. DJ María (APP MÓVIL)
   └─ Recibe: "Tu solicitud fue aprobada" ✅
```

---

## 🗄️ Base de Datos Compartida

### Tablas Principales

| Tabla | Descripción | Usado por |
|-------|-------------|-----------|
| **users** | Autenticación multi-tenant | Ambos |
| **agencies** | Agencias del sistema | BACKOFFICE |
| **djs** | DJs (todos - gestionados e individuales) | Ambos |
| **eventos** | Eventos/bolos | Ambos |
| **clientes** | Locales/clientes | Ambos |
| **categorias_evento** | Categorías de eventos | BACKOFFICE |
| **pagos_djs** | Nóminas mensuales | BACKOFFICE |
| **pagos_clientes** | Cobros a clientes | BACKOFFICE |
| **requests** | Solicitudes de DJs | Ambos |
| **social_media_accounts** | Cuentas de Instagram, etc. | BACKOFFICE |
| **social_media_snapshots** | Métricas históricas | BACKOFFICE |
| **monthly_reports** | Reportes mensuales auto-generados | BACKOFFICE |
| **audit_log** | Log de auditoría | BACKOFFICE |
| **notifications** | Notificaciones del sistema | Ambos |
| **user_devices** | Tokens FCM para push notifications | APP MÓVIL |

**Total**: 15+ tablas compartidas

---

## 🚀 Estado Actual del Proyecto

### ✅ **BACKOFFICE WEB** (intra-media-system)
**Estado**: ✅ **FUNCIONAL EN PRODUCCIÓN**

- Backend Express.js: ✅ Completo
- Frontend React: ✅ Completo
- Base de datos: ✅ Completa
- Autenticación: ✅ JWT implementado
- Multi-tenant: ✅ Funcionando
- Instagram Analytics: ✅ Implementado
- Finanzas: ✅ Completo

**Puerto**: 5174 (frontend) | 3001 (backend)

---

### 🔨 **APP MÓVIL** (app-service)
**Estado**: 🔨 **EN DESARROLLO/INTEGRACIÓN**

#### Backend NestJS:
- ✅ Estructura base (hexagonal)
- ✅ Módulos: User, Event, Client, Payment, Request
- 🔄 **Requiere adaptación** a schema de intra-media-system
- 🔄 **Requiere configurar** BD compartida
- ❌ Push Notifications (por implementar)

#### Frontend Móvil:
- ❌ **NO IMPLEMENTADO** (React Native pendiente)

**Puerto**: 3000 (backend)

---

## 📋 Próximos Pasos (Roadmap)

### 🔨 **FASE 1: Adaptaciones Backend** (5 días estimados)

#### intra-media-system:
- [ ] Crear migración SQL:
  - Agregar campos `availability`, `artistic_name`, `location` a `djs`
  - Agregar campos `hora_inicio`, `hora_fin` a `eventos`
  - Crear tabla `requests`
  - Crear tabla `user_devices`
- [ ] Ejecutar migración en BD
- [ ] Crear endpoint `/api/requests`
- [ ] Testing

#### app-service:
- [ ] Actualizar entidades TypeORM (mapear a schema existente)
- [ ] Configurar DATABASE_URL compartida
- [ ] Configurar JWT_SECRET compartido
- [ ] Ajustar lógica de negocio (permisos por rol)
- [ ] Implementar NotificationService (Firebase)
- [ ] Testing

---

### 🎨 **FASE 2: Frontend Backoffice** (3 días estimados)
- [ ] Crear página "Solicitudes" (`/solicitudes`)
- [ ] Agregar badge de notificaciones en nav
- [ ] Mostrar disponibilidad de DJ al crear evento
- [ ] Agregar campos de horario en formulario de eventos
- [ ] Testing

---

### 📱 **FASE 3: App Móvil** (7 días estimados)
- [ ] Setup proyecto React Native + Expo
- [ ] Implementar pantallas:
  - [ ] LoginScreen
  - [ ] HomeScreen (Dashboard del DJ)
  - [ ] EventsScreen (Lista de bolos)
  - [ ] EventDetailScreen
  - [ ] RequestsScreen (Solicitudes)
  - [ ] ProfileScreen
- [ ] Integrar con backend NestJS
- [ ] Configurar push notifications (Firebase)
- [ ] Testing en iOS/Android

---

### 🔗 **FASE 4: Integración** (3 días estimados)
- [ ] Testing end-to-end
- [ ] Verificar flujo: Agencia crea evento → DJ recibe notificación
- [ ] Verificar flujo: DJ crea request → Manager aprueba
- [ ] Verificar flujo: DJ actualiza disponibilidad → Manager lo ve
- [ ] Ajustes finales

---

### 🚀 **FASE 5: Deployment** (2 días estimados)
- [ ] Deploy backend NestJS (Render/Railway)
- [ ] Verificar conectividad con BD
- [ ] Build app móvil (TestFlight + Play Console)
- [ ] Testing en producción
- [ ] Monitoring y logs

**TOTAL ESTIMADO**: 20 días (4 semanas)

---

## 🛠️ Tecnologías Utilizadas

### BACKOFFICE WEB
- **Frontend**: React 18.3, Vite 5.4, TailwindCSS 3.4, React Router v6
- **Backend**: Node.js, Express.js 4.21, JWT, bcrypt
- **Base de Datos**: PostgreSQL 15
- **Deployment**: Desarrollo local (puerto 5174 + 3001)

### APP MÓVIL
- **Frontend**: React Native (por implementar), Expo
- **Backend**: NestJS 10.x, TypeORM, JWT
- **Base de Datos**: PostgreSQL 15 (compartida)
- **Push Notifications**: Firebase Cloud Messaging
- **Deployment**: Render/Railway (backend), TestFlight/Play Console (app)

---

## 📞 Información de Contacto

**Proyecto**: Intra Media System
**Ecosistema**: BACKOFFICE WEB + APP MÓVIL
**Versión**: 2.0 (Integración en progreso)
**Última actualización**: 2025-01-24

---

## 📖 Cómo Usar Esta Documentación

### Si eres **Desarrollador Backend**:
1. Lee este README completo
2. Consulta `intra-media-system-structure.md` para entender el schema y API actual
3. Consulta `intra-media-system-architecture.md` para ver las adaptaciones necesarias
4. Empieza por **FASE 1** del roadmap

### Si eres **Desarrollador Frontend**:
1. Lee este README completo
2. Consulta `intra-media-system-structure.md` → sección "Frontend"
3. Para la app móvil, consulta `intra-media-system-architecture.md` → sección "App Móvil"
4. Empieza por **FASE 3** del roadmap

### Si eres **Product Manager/Stakeholder**:
1. Lee este README completo
2. Revisa los diagramas de flujo en `intra-media-system-architecture.md`
3. Consulta el roadmap arriba para timeline

### Si eres **QA/Tester**:
1. Lee este README completo
2. Consulta los flujos de trabajo en este documento
3. Revisa `intra-media-system-architecture.md` → sección "Flujos de Integración"

---

## ⚠️ Notas Importantes

1. **NO son proyectos separados**: BACKOFFICE y APP MÓVIL son partes del mismo ecosistema
2. **NO hay sincronización**: Usan la misma BD → datos siempre consistentes
3. **Club Management**: Es un proyecto DIFERENTE e independiente (no relacionado)
4. **Migración**: NO se requiere migración de datos (ya están en la BD)
5. **JWT Compartido**: CRÍTICO usar el mismo SECRET en ambos backends

---

## 🎯 Objetivo Final

```
Un ecosistema donde:

✅ Agencias gestionan a sus DJs desde escritorio (BACKOFFICE)
✅ DJs consultan su info rápido desde móvil (APP MÓVIL)
✅ Comunicación bidireccional (Requests)
✅ Notificaciones en tiempo real
✅ Datos siempre sincronizados
✅ Experiencia optimizada por plataforma
```

---

**¿Listo para empezar?** 🚀

Revisa el documento de arquitectura para pasos detallados:
👉 [intra-media-system-architecture.md](./intra-media-system-architecture.md)
