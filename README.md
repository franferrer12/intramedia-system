# Intra Media System - Sistema de Gestión para Agencia de DJs

Sistema completo de gestión para agencia de DJs que gestiona eventos, pagos y nóminas.

## Estructura del Proyecto

```
intra-media-system/
├── backend/          # API REST (Node.js + Express + PostgreSQL)
├── frontend/         # Aplicación web (React + Vite + TailwindCSS)
├── database/         # Scripts SQL y migraciones
├── docs/             # Documentación
└── ORIGINAL.xlsx     # Datos originales (migrar)
```

## Stack Tecnológico

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de datos:** PostgreSQL 15+
- **ORM:** Prisma
- **Autenticación:** JWT
- **Validación:** Zod

### Frontend
- **Framework:** React 18
- **Build tool:** Vite
- **Estilos:** TailwindCSS
- **Estado:** Zustand
- **HTTP:** Axios
- **Routing:** React Router v6

## Instalación Rápida

### 1. Base de datos
```bash
# Crear base de datos PostgreSQL
createdb intra_media_system

# Ejecutar migraciones
cd database
psql intra_media_system < schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Migración de datos
```bash
cd backend
npm run migrate:excel
```

## Funcionalidades Principales

### Panel Administración
- Dashboard con KPIs en tiempo real
- Gestión de eventos (CRUD completo)
- Control de pagos (cliente → agencia → DJs)
- Generación automática de nóminas
- Reportes y analytics
- Exportación a Excel/PDF

### Portal DJs
- Ver eventos asignados
- Historial de pagos
- Notificaciones

### Automatizaciones
- Recordatorios de pagos pendientes
- Emails de asignación de eventos
- Cálculo automático de fees
- Alertas de eventos próximos

## Desarrollo

```bash
# Backend (http://localhost:3000)
cd backend && npm run dev

# Frontend (http://localhost:5173)
cd frontend && npm run dev
```

## Documentación

### 📚 Guías de Usuario
- **[Guía de Inicio Rápido](docs/GUIA_INICIO_RAPIDO.md)** - Configuración paso a paso del sistema

### 🗺️ Planificación Estratégica
- **[Roadmap Estratégico](docs/ROADMAP_ESTRATEGICO.md)** - Plan completo de evolución del sistema (CRM, Marketing, Analytics, etc.)
- **[Arquitectura Futura](docs/ARQUITECTURA_FUTURA.md)** - Diseño técnico del sistema expandido
- **[Guía de Decisión Rápida](docs/DECISION_RAPIDA.md)** - Ayuda para decidir qué implementar primero

### 🎯 Estado Actual

**Fase 1 - Sistema Base:** ✅ COMPLETADO (100%)
- Gestión de eventos, DJs, clientes, pagos
- Dashboard con KPIs
- Sistema multi-agencia
- Integración con redes sociales
- Exportación Excel/PDF

**Próximas Fases Disponibles:**
- Fase 2: CRM & Sales Pipeline
- Fase 3: Marketing Automation
- Fase 4: Automatizaciones Avanzadas
- Fase 5: Analytics & BI
- Fase 6: Marketplace Público
- ...y más (ver [Roadmap](docs/ROADMAP_ESTRATEGICO.md))

Ver carpeta `/docs` para más información.
