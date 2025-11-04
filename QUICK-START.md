# 🚀 Guía Rápida - IntraMedia System

## Inicio Rápido (5 minutos)

### 1. Iniciar los Servicios

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:5174
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

---

### 2. Cargar Datos de Prueba

```bash
cd backend

# Opción A: Dataset completo (recomendado)
node seeds/comprehensive-test-data.js

# Opción B: Demo rápida (20 eventos)
node seeds/quick-demo.js

# Opción C: Prueba de rendimiento (1000 eventos)
node seeds/stress-test.js

# Opción D: Casos límite
node seeds/edge-cases.js
```

---

### 3. Verificar Instalación

```bash
# Ver métricas del dashboard
curl http://localhost:3001/api/executive-dashboard/metrics | python3 -m json.tool

# Ver eventos
curl http://localhost:3001/api/eventos | python3 -m json.tool

# Ver alertas
curl http://localhost:3001/api/financial-alerts | python3 -m json.tool
```

---

## Funcionalidades Principales

### 📊 Dashboard Ejecutivo
**URL:** `/dashboard-ejecutivo`

Métricas consolidadas en tiempo real:
- KPIs financieros
- Top 10 clientes/DJs
- Facturación mensual
- Alertas activas
- Health score financiero

### 💰 Gestión Financiera

**Cobros Pendientes:**
- `/clientes-financial` - Análisis por cliente
- `/djs-financial` - Pagos pendientes a DJs

**Reportes Exportables:**
- PDF con análisis completo
- Excel con datos detallados

### 📈 Análisis Comparativo
**URL:** `/comparative-analysis`

- Comparación entre períodos
- Benchmarking clientes/DJs
- Análisis estacional
- Forecasting y tendencias

### 🚨 Alertas Financieras

**Tipos de alertas:**
- 🔴 Críticas: Cobros >60 días
- 🟡 Urgentes: Cobros 30-60 días
- 🔵 Info: Notificaciones generales

---

## API Endpoints Principales

### Executive Dashboard
```bash
GET /api/executive-dashboard/metrics       # Métricas consolidadas
GET /api/executive-dashboard/health-score  # Score de salud financiera
```

### Análisis Comparativo
```bash
GET /api/comparative-analysis/period-comparison?metric=revenue&period=month
GET /api/comparative-analysis/client/:clientId
GET /api/comparative-analysis/dj/:djId
GET /api/comparative-analysis/seasonal
GET /api/comparative-analysis/forecast?metric=revenue&periods=6
GET /api/comparative-analysis/top-performers?entity=client&limit=10
```

### Gestión Financiera
```bash
GET /api/clientes-financial              # Análisis financiero clientes
GET /api/clientes-financial/:id          # Cliente específico
GET /api/clientes-financial/cobros-pendientes
GET /api/clientes-financial/:id/export/pdf

GET /api/djs-financial                   # Análisis financiero DJs
GET /api/djs-financial/:id               # DJ específico
GET /api/djs-financial/pagos-pendientes
GET /api/djs-financial/:id/export/pdf
```

### Alertas
```bash
GET /api/financial-alerts                # Todas las alertas
GET /api/financial-alerts/unread         # Solo no leídas
PATCH /api/financial-alerts/:id/read     # Marcar como leída
PATCH /api/financial-alerts/:id/resolve  # Resolver alerta
```

### Eventos, Clientes, DJs
```bash
GET /api/eventos                         # Listar eventos
POST /api/eventos                        # Crear evento
GET /api/eventos/:id                     # Ver evento
PUT /api/eventos/:id                     # Actualizar evento
DELETE /api/eventos/:id                  # Eliminar evento

GET /api/clientes                        # Similar para clientes
GET /api/djs                             # Similar para DJs
```

---

## Datos de Prueba Generados

### Comprehensive Test Data (Recomendado)
```
📊 Estadísticas:
- 15 clientes (VIP, Premium, Regular)
- 8 DJs (Senior, Mid, Junior)
- ~140 eventos (últimos 12 meses + 2 futuros)
- €72,404 facturación total
- 1,098 alertas activas

🏢 Clientes incluidos:
- Disco Pacha (VIP)
- Sala Apolo (VIP)
- Café del Mar (VIP)
- Marina Beach Club (Premium)
- Hotel Arts (Premium)
- Terraza Umbracle (Premium)
- y más...

🎧 DJs incluidos:
- DJ Luisma (Senior - €300/evento)
- DJ Carlitos (Senior - €280/evento)
- DJ Marina (Mid - €200/evento)
- DJ Alex (Mid - €180/evento)
- y más...
```

### Quick Demo
```
📊 Estadísticas:
- 5 clientes
- 3 DJs
- 20 eventos
- Perfecto para demos rápidas
```

### Stress Test
```
📊 Estadísticas:
- 50 clientes
- 20 DJs
- 1000 eventos
- Prueba de rendimiento
```

### Edge Cases
```
📊 Casos especiales:
- Cliente moroso (2 años sin pagar)
- Cliente VIP perfecto
- Evento premium (€50,000)
- Evento económico (€50)
- DJ sin cobrar (€600 pendientes)
- Evento maratón (24 horas)
```

---

## Troubleshooting Rápido

### Backend no inicia
```bash
# Verificar puerto 3001
lsof -i :3001
# Matar proceso si está ocupado
kill -9 $(lsof -t -i :3001)
```

### Frontend no inicia
```bash
# Verificar puerto 5174
lsof -i :5174
# Reinstalar dependencias
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### No hay datos
```bash
# Ejecutar seed
cd backend
node seeds/comprehensive-test-data.js

# Verificar conexión DB
PGPASSWORD=postgres psql -U postgres -d intra_media_system -c "SELECT COUNT(*) FROM eventos"
```

### Error 500 en API
```bash
# Ver logs del backend
cd backend
npm run dev
# Los errores aparecerán en la consola
```

### Dashboard muestra datos incorrectos
```bash
# Limpiar cache Redis (si está activo)
redis-cli FLUSHALL

# O reiniciar backend
pkill -f "node.*dev"
cd backend && npm run dev
```

---

## Comandos Útiles

### Base de Datos
```bash
# Conectar a PostgreSQL
PGPASSWORD=postgres psql -U postgres -d intra_media_system

# Ver tablas
\dt

# Ver estructura de tabla
\d eventos

# Consultar datos
SELECT COUNT(*) FROM eventos;
SELECT * FROM eventos LIMIT 5;

# Resetear datos (CUIDADO!)
DELETE FROM financial_alerts;
DELETE FROM eventos;
DELETE FROM clientes WHERE id > 0;
DELETE FROM djs WHERE id > 0;
```

### Redis
```bash
# Ver keys en cache
redis-cli KEYS "*"

# Limpiar cache
redis-cli FLUSHALL

# Ver info
redis-cli INFO
```

### Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E (si está configurado)
npm run test:e2e
```

---

## Estructura del Proyecto

```
intra-media-system/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Servicios (Redis, exports)
│   │   └── utils/          # Utilidades
│   ├── seeds/              # Scripts de datos de prueba
│   └── database/           # Migraciones (si existen)
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # API calls
│   │   └── utils/          # Utilidades
│   └── public/             # Assets estáticos
└── docs/                   # Documentación (si existe)
```

---

## Próximos Pasos

1. ✅ **Explorar el Dashboard** - Ve a http://localhost:5174
2. ✅ **Probar las APIs** - Usa Postman o curl
3. ✅ **Generar reportes** - Exporta PDFs y Excel
4. ✅ **Revisar alertas** - Gestiona situaciones críticas
5. ✅ **Crear tus propios datos** - Modifica los seeds o crea manualmente

---

## Recursos Adicionales

- **README Principal**: `/README.md`
- **Docs Seeds**: `/backend/seeds/README.md`
- **API Docs**: (Próximamente con Swagger)
- **Guías de Usuario**: (En desarrollo)

---

## Soporte

Para problemas o preguntas:
1. Revisa los logs del backend/frontend
2. Verifica la conexión a PostgreSQL
3. Consulta esta guía y los READMEs
4. Revisa el código en GitHub (si aplica)

**¡Listo para empezar! 🚀**
