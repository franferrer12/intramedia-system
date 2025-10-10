# Club Management System

Sistema integral de gestión para discoteca - **100% autónomo y sin integraciones externas**

## 🎯 Características Principales

- ✅ **Gestión de Eventos** - CRUD completo con calendario visual
- ✅ **Gestión Financiera** - Registro manual de gastos/ingresos + P&L automático
- ✅ **Gestión de Personal** - Empleados, turnos y nóminas automáticas
- ✅ **Inventario** - Control de stock con alertas automáticas
- ✅ **Compras** - Pedidos a proveedores con actualización automática de stock
- ✅ **Analytics & Reportes** - Dashboard ejecutivo con KPIs y exportación PDF/Excel

## 🏗️ Stack Tecnológico

### Backend
- Spring Boot 3.2 + Java 17
- PostgreSQL 15
- Spring Security + JWT
- JasperReports (PDFs)
- Apache POI (Excel)

### Frontend
- React 18 + TypeScript
- TanStack Query + Zustand
- TailwindCSS + Shadcn/ui
- Recharts (gráficos)

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)

## 🚀 Quick Start

### Requisitos Previos
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Git

### Instalación

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd club-management
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus valores
```

3. **Levantar con Docker Compose:**
```bash
docker-compose up -d
```

4. **Acceder a:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- PostgreSQL: localhost:5432

### Desarrollo Local (sin Docker)

#### Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Base de Datos

La base de datos se inicializa automáticamente con Flyway.

**Usuario por defecto:**
- Username: `admin`
- Password: `admin123`
- **⚠️ CAMBIAR EN PRODUCCIÓN**

## 📁 Estructura del Proyecto

```
club-management/
├── backend/               # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/club/management/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── entity/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   └── security/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
├── docs/                  # Documentación
├── scripts/               # Scripts de utilidad
├── docker-compose.yml
└── README.md
```

## 🧪 Testing

### Backend
```bash
cd backend
./mvnw test
./mvnw verify  # Con cobertura
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## 📦 Build para Producción

```bash
# Con Docker
docker-compose -f docker-compose.prod.yml up -d

# Sin Docker
cd backend && ./mvnw clean package
cd frontend && npm run build
```

## 📚 Documentación

### 🚀 Despliegue a Producción

- **[INSTRUCCIONES_RAPIDAS_DEPLOY.md](INSTRUCCIONES_RAPIDAS_DEPLOY.md)** - ⚡ Guía rápida para desplegar en Railway (25 min)
- **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** - 📖 Guía detallada paso a paso para Railway.app
- **[DEPLOY.md](DEPLOY.md)** - 🐳 Guía completa de despliegue local con Docker
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - 🔧 **Solución de errores de deployment** (OOM, 403, CORS, transacciones)

### Documentación del Proyecto

- **[PROGRESS.md](PROGRESS.md)** - Estado actual y progreso del desarrollo
- **[BUGFIXES.md](BUGFIXES.md)** - 🐛 Registro detallado de errores solucionados
- **[STATUS.md](STATUS.md)** - Estado de funcionalidades
- **[TESTING.md](TESTING.md)** - Guía de testing

### Documentación Base

Ver carpeta `Heramienta de gestión discoteca/Documentación Base/` para documentación detallada:

- **readme_sin_integraciones.txt** - Visión general del proyecto
- **roadmap_sin_integraciones.txt** - Plan de implementación de 12 semanas
- **doc_modelo_datos.txt** - Modelo de datos completo
- **doc_setup_despliegue.txt** - Guía de instalación y deploy
- **prompts_completos.txt** - Prompts para desarrollo con IA

## 🎯 Roadmap

- **Semana 1**: Setup inicial ✅ (COMPLETADO)
- **Semanas 2-3**: Autenticación + Eventos
- **Semanas 4-5**: Gestión Financiera
- **Semana 6**: Personal básico (**MVP funcional**)
- **Semanas 7-8**: Nóminas automáticas
- **Semanas 9-10**: Inventario completo
- **Semana 11**: Compras y proveedores
- **Semanas 12-13**: Dashboard ejecutivo
- **Semana 14**: Reportes avanzados
- **Semana 15**: Optimización final

Ver `roadmap_sin_integraciones.txt` para detalles completos.

## 💰 Coste

**€0** - Sin integraciones externas, sin dependencias de pago.

## 📄 Licencia

Uso privado interno.

## 🤝 Contribuir

Este es un proyecto privado. Ver documentación para guías de desarrollo.

---

**Versión:** 0.2.0
**Última actualización:** Octubre 2025
**Estado:** ✅ Versión funcional con UX optimizada para usuarios no técnicos

### ✨ Nuevas Características (v0.2.0)
- ✅ **UX adaptada para dueños de discotecas** - Lenguaje simplificado y conversacional
- ✅ **Responsive mobile mejorado** - Sidebar con scroll en dispositivos móviles
- ✅ Dashboard con datos reales sincronizados
- ✅ Auto-refresh de estadísticas cada 30 segundos
- ✅ Exportación PDF/Excel de transacciones
- ✅ Configuración de producción optimizada
- ✅ Guía de despliegue completa para Railway.app

### 🎨 Adaptaciones UX para Buyer Persona (v0.2.0)
- ✅ **Inicio** (antes "Dashboard") - "Resumen de tu club"
- ✅ **Eventos y Fiestas** - "Todas tus fiestas y eventos"
- ✅ **Mi Equipo** (antes "Empleados") - "Personas que trabajan contigo"
- ✅ **Ingresos y Gastos** (antes "Finanzas") - "Control de dinero"
- ✅ **Sueldos** (antes "Nóminas") - "Pagos a tu equipo"
- ✅ **Productos y Stock** (antes "Inventario") - "Tus productos y bebidas"
- ✅ **Análisis del Negocio** (antes "Analytics") - "Cómo va tu club"

### 🐛 Bugfixes Aplicados

#### Deployment en Railway (2025-10-10)
- ✅ **Out of Memory (OOM)** - Backend no iniciaba en Railway
  - **Solución:** Configurar `JAVA_TOOL_OPTIONS` con límites de memoria JVM
  - **Tiempo de inicio:** Reducido de timeout a ~40 segundos
- ✅ **403 Forbidden en `/api/auth/login`** - Spring Security bloqueaba autenticación
  - **Solución:** Reordenar requestMatchers (específicos antes de genéricos)
- ✅ **500 Error "Cannot commit when autoCommit is enabled"** - Transacciones JPA fallaban
  - **Solución:** Configurar `SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false`
- ✅ **CORS Policy Error** - Frontend bloqueado por browser
  - **Solución:** Agregar `withCredentials: true` en axios

#### Anteriores
- ✅ **(2025-10-10)** Menú lateral móvil sin scroll - agregado `overflow-y-auto`
- ✅ **(2025-10-06)** Error 403 en exportaciones Excel
- ✅ **(2025-10-06)** Token JWT no enviado en peticiones
- ✅ **(2025-10-06)** Error CORS con localhost:3001
- ✅ **(2025-10-06)** Carácter inválido "/" en hoja Excel

Ver [BUGFIXES.md](BUGFIXES.md) para detalles completos.
Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md) para guía completa de solución de errores de deployment.
Ver [ROADMAP.md](ROADMAP.md) para la hoja de ruta detallada.
Ver [DEPLOY.md](DEPLOY.md) para instrucciones de despliegue.
