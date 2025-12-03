# Production Roadmap - Intra Media System

**Fecha de Inicio:** 2025-12-03
**Objetivo:** Sistema completo en producción con CI/CD
**Estado:** 📋 PLANIFICADO

---

## 🎯 Visión General del Plan

```
FASE 1: Frontend Security        [████░░░░░░] 0%  → ETA: 2-3 horas
FASE 2: Testing Manual           [░░░░░░░░░░] 0%  → ETA: 3-4 horas
FASE 3: Preparación Producción   [░░░░░░░░░░] 0%  → ETA: 2-3 horas
FASE 4: CI/CD & Automatización   [░░░░░░░░░░] 0%  → ETA: 3-4 horas
FASE 5: Deploy a Producción      [░░░░░░░░░░] 0%  → ETA: 2 horas
────────────────────────────────────────────────────────────────
PROGRESO TOTAL:                   [░░░░░░░░░░] 0%  → ETA: 12-16 horas
```

---

## 📋 FASE 1: Frontend Security & Dependencies

**Objetivo:** Aplicar las mismas mejoras de seguridad del backend al frontend

**Duración Estimada:** 2-3 horas

### 1.1 Auditoría de Dependencias Frontend

**Tasks:**
- [ ] Ejecutar `npm audit` en /frontend
- [ ] Identificar todas las vulnerabilidades
- [ ] Categorizar por severidad (CRITICAL, HIGH, MODERATE, LOW)
- [ ] Documentar estado inicial

**Comandos:**
```bash
cd /frontend
npm audit
npm audit --json > /tmp/frontend-audit-initial.json
```

**Criterio de Éxito:**
- Reporte completo de vulnerabilidades generado
- Estado inicial documentado

---

### 1.2 Actualización de Dependencias

**Tasks:**
- [ ] Actualizar React a v19 (si no está actualizado)
- [ ] Actualizar Vite a v7.x
- [ ] Actualizar todas las dependencias con parches de seguridad
- [ ] Verificar compatibilidad

**Comandos:**
```bash
npm audit fix
npm audit fix --force  # Solo si es necesario
npm outdated
npm update
```

**Criterio de Éxito:**
- 0 vulnerabilidades en `npm audit`
- Build exitoso: `npm run build`
- Dev server funcional: `npm run dev`

---

### 1.3 Verificación de Seguridad Frontend

**Tasks:**
- [ ] Verificar que no hay secretos hardcodeados
- [ ] Revisar configuración de variables de entorno
- [ ] Verificar que API_URL usa variable de entorno
- [ ] Auditar código para XSS en componentes

**Verificaciones:**
```bash
# Buscar secrets hardcodeados
grep -r "api_key\|password\|secret" src/ --include="*.tsx" --include="*.ts"

# Verificar uso de env vars
grep -r "process.env" src/ --include="*.tsx" --include="*.ts"
```

**Criterio de Éxito:**
- 0 secretos hardcodeados
- Todas las configuraciones usan variables de entorno
- No hay vulnerabilidades de XSS evidentes

---

### 1.4 Documentación Frontend

**Tasks:**
- [ ] Crear `frontend/SECURITY_AUDIT_REPORT.md`
- [ ] Documentar vulnerabilidades resueltas
- [ ] Listar dependencias actualizadas
- [ ] Estado final de seguridad

**Criterio de Éxito:**
- Reporte completo creado
- Estado documentado en Git

---

## 🧪 FASE 2: Testing Manual de Funcionalidades

**Objetivo:** Validar que todas las funcionalidades críticas funcionan correctamente

**Duración Estimada:** 3-4 horas

### 2.1 Testing de Autenticación

**Funcionalidades a Probar:**
- [ ] Login con credenciales válidas
- [ ] Login con credenciales inválidas
- [ ] Logout correcto
- [ ] Persistencia de sesión (refresh)
- [ ] Expiración de token
- [ ] Redirección a /login si no autenticado

**Casos de Prueba:**
```
TEST 1: Login Exitoso
- Input: admin / admin123
- Expected: Redirección a dashboard, token guardado

TEST 2: Login Fallido
- Input: admin / wrongpassword
- Expected: Mensaje de error, no redirección

TEST 3: Sesión Persistente
- Action: Refresh página después de login
- Expected: Usuario sigue autenticado

TEST 4: Logout
- Action: Click en logout
- Expected: Token eliminado, redirección a /login
```

**Criterio de Éxito:**
- Todos los tests pasan
- No hay errores en consola

---

### 2.2 Testing CRUD de Entidades

**Entidades a Probar:**
- [ ] Eventos (Events)
- [ ] DJs
- [ ] Clientes (Clients)
- [ ] Agencias (Agencies)
- [ ] Leads
- [ ] Contratos (Contracts)

**Para cada entidad:**
```
CREATE:
- [ ] Formulario se abre correctamente
- [ ] Validación de campos funciona
- [ ] Creación exitosa con datos válidos
- [ ] Mensaje de éxito se muestra
- [ ] Lista se actualiza automáticamente

READ:
- [ ] Lista carga correctamente
- [ ] Paginación funciona
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Detalles se muestran correctamente

UPDATE:
- [ ] Formulario carga con datos existentes
- [ ] Actualización guarda correctamente
- [ ] Cambios se reflejan en la lista
- [ ] Mensaje de éxito se muestra

DELETE:
- [ ] Confirmación se solicita
- [ ] Eliminación funciona (soft delete)
- [ ] Item desaparece de la lista
- [ ] Mensaje de éxito se muestra
```

**Criterio de Éxito:**
- Todos los CRUDs funcionan sin errores
- No hay errores 404 o 500
- UX es fluida sin lags

---

### 2.3 Testing de Funcionalidades Avanzadas

**Dashboards y Analytics:**
- [ ] Dashboard principal carga correctamente
- [ ] Gráficos se renderizan
- [ ] Datos son precisos
- [ ] Filtros de fecha funcionan
- [ ] Export a Excel/PDF funciona

**Sistema Financiero:**
- [ ] Transacciones se registran correctamente
- [ ] Cálculos de P&L son correctos
- [ ] Reportes financieros generan correctamente
- [ ] Distribución de ganancias funciona

**Gestión de Documentos:**
- [ ] Upload de archivos funciona
- [ ] Preview de documentos funciona
- [ ] Download funciona
- [ ] Eliminación funciona

**Reservaciones y Disponibilidad:**
- [ ] Calendario muestra disponibilidad
- [ ] Crear reservación funciona
- [ ] Conflictos de horario se detectan
- [ ] Notificaciones se envían

**Criterio de Éxito:**
- Todas las funcionalidades avanzadas operan correctamente
- Performance es aceptable (< 3s carga)
- No hay errores críticos

---

### 2.4 Testing de Permisos y Roles (RBAC)

**Roles a Probar:**
- [ ] ADMIN - Acceso completo
- [ ] MANAGER - Acceso limitado
- [ ] USER - Solo lectura

**Para cada rol:**
```
- [ ] Login con usuario del rol
- [ ] Verificar menú muestra opciones correctas
- [ ] Verificar permisos de creación
- [ ] Verificar permisos de edición
- [ ] Verificar permisos de eliminación
- [ ] Intentar acceder a ruta no autorizada
```

**Criterio de Éxito:**
- Permisos se aplican correctamente
- Accesos no autorizados son bloqueados
- Mensajes de error son claros

---

### 2.5 Testing Cross-Browser

**Browsers a Probar:**
- [ ] Chrome (último)
- [ ] Firefox (último)
- [ ] Safari (último)
- [ ] Edge (último)

**Para cada browser:**
```
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] CRUD básico funciona
- [ ] Estilos se ven correctos
- [ ] No hay errores en consola
```

**Criterio de Éxito:**
- Sistema funciona en todos los browsers
- No hay problemas críticos de compatibilidad

---

### 2.6 Testing Responsive

**Dispositivos a Probar:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Para cada resolución:**
```
- [ ] Layout se adapta correctamente
- [ ] Menú hamburguesa funciona (mobile)
- [ ] Tablas son scrollables
- [ ] Formularios son usables
- [ ] No hay overflow horizontal
```

**Criterio de Éxito:**
- UI responsive funciona en todos los tamaños
- UX es aceptable en mobile

---

### 2.7 Documentación de Testing

**Tasks:**
- [ ] Crear `TESTING_REPORT.md`
- [ ] Documentar todos los tests ejecutados
- [ ] Listar bugs encontrados
- [ ] Documentar bugs resueltos
- [ ] Estado final de testing

**Criterio de Éxito:**
- Reporte completo de testing
- Todos los bugs críticos resueltos

---

## 🚀 FASE 3: Preparación para Producción

**Objetivo:** Configurar el sistema para deployment seguro

**Duración Estimada:** 2-3 horas

### 3.1 Variables de Entorno

**Backend (.env.production):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=production-db-host
DB_PORT=5432
DB_USER=prod_user
DB_PASSWORD=<strong-password>
DB_NAME=intra_media_prod

# JWT
JWT_SECRET=<256-bit-secret>  # Generar nuevo
JWT_EXPIRES_IN=24h

# Server
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://yourdomain.com

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=<app-password>

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Monitoring (opcional)
SENTRY_DSN=https://...
```

**Tasks:**
- [ ] Crear `.env.production` con valores seguros
- [ ] Generar JWT_SECRET fuerte (256-bit)
- [ ] Configurar DB_PASSWORD fuerte
- [ ] Verificar que `.env.production` está en `.gitignore`
- [ ] Documentar variables requeridas en README

**Comandos:**
```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar DB_PASSWORD
openssl rand -base64 32
```

---

**Frontend (.env.production):**
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Intra Media System
VITE_APP_VERSION=1.0.0
```

**Tasks:**
- [ ] Crear `.env.production`
- [ ] Configurar VITE_API_URL correcto
- [ ] Verificar build con env de producción

**Criterio de Éxito:**
- Todas las variables de entorno configuradas
- Secrets son fuertes y únicos
- Build funciona con variables de producción

---

### 3.2 Optimización de Performance

**Backend:**
- [ ] Habilitar compresión gzip (ya configurado)
- [ ] Configurar rate limiting por IP
- [ ] Optimizar queries SQL lentas
- [ ] Habilitar cache de Redis (opcional)
- [ ] Configurar connection pooling de DB

**Frontend:**
- [ ] Build de producción optimizado
- [ ] Code splitting configurado
- [ ] Lazy loading de rutas
- [ ] Optimización de imágenes
- [ ] Minificación de assets

**Comandos:**
```bash
# Frontend build optimizado
cd frontend
npm run build
npm run preview  # Test build local

# Analizar bundle size
npm run build -- --report
```

**Criterio de Éxito:**
- Build de frontend < 3MB gzipped
- API response time < 200ms (promedio)
- Lighthouse score > 90

---

### 3.3 Configuración de Seguridad

**Backend:**
- [ ] Helmet.js habilitado (ya configurado)
- [ ] CORS configurado con dominio específico
- [ ] Rate limiting configurado
- [ ] HTTPS enforced
- [ ] Security headers verificados

**Verificar headers de seguridad:**
```bash
# Test local
curl -I http://localhost:8080/health

# Verificar headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

**Frontend:**
- [ ] Content Security Policy configurado
- [ ] SRI (Subresource Integrity) habilitado
- [ ] HTTPS only
- [ ] Secure cookies configuradas

**Criterio de Éxito:**
- Todos los security headers presentes
- SSL Labs grade A+
- No vulnerabilidades evidentes

---

### 3.4 Logging y Monitoring

**Backend:**
- [ ] Winston logger configurado (ya está)
- [ ] Logs estructurados (JSON)
- [ ] Log rotation configurado
- [ ] Error tracking (Sentry opcional)
- [ ] Performance monitoring

**Configurar log levels:**
```javascript
// production logging
if (process.env.NODE_ENV === 'production') {
  logger.level = 'warn';  // Solo warnings y errores
} else {
  logger.level = 'debug';
}
```

**Frontend:**
- [ ] Error boundary para React
- [ ] Error reporting (Sentry opcional)
- [ ] Analytics (Google Analytics opcional)

**Criterio de Éxito:**
- Logs se generan correctamente
- Errores se capturan y reportan
- Monitoring funcional

---

### 3.5 Database Preparation

**Tasks:**
- [ ] Crear base de datos de producción
- [ ] Ejecutar todas las migraciones
- [ ] Crear usuario admin de producción
- [ ] Backup de database configurado
- [ ] Verificar índices de performance

**Comandos:**
```bash
# Crear DB de producción
psql -U postgres -c "CREATE DATABASE intra_media_prod;"
psql -U postgres -c "CREATE USER prod_user WITH PASSWORD 'strong_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE intra_media_prod TO prod_user;"

# Ejecutar migraciones (si aplica)
npm run migrate:prod

# Verificar tablas
psql -U prod_user -d intra_media_prod -c "\dt"
```

**Backup automático:**
```bash
# Configurar cron job para backup diario
0 2 * * * pg_dump -U prod_user intra_media_prod > /backups/db_$(date +\%Y\%m\%d).sql
```

**Criterio de Éxito:**
- Database de producción creada
- Migraciones ejecutadas correctamente
- Backups automáticos configurados

---

### 3.6 Health Checks y Graceful Shutdown

**Backend:**
- [ ] Endpoint `/health` funcionando
- [ ] Endpoint `/ready` (DB connection check)
- [ ] Graceful shutdown configurado (ya está)
- [ ] Process manager (PM2) configurado

**Health check:**
```javascript
// Ya implementado en server.js
app.get('/health', async (req, res) => {
  const dbHealth = await pool.query('SELECT 1');
  res.json({
    status: 'ok',
    database: dbHealth ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});
```

**PM2 Configuration (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'intra-media-backend',
    script: './src/server.js',
    instances: 2,  // Cluster mode
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M'
  }]
};
```

**Criterio de Éxito:**
- Health checks responden correctamente
- PM2 configurado y testado
- Graceful shutdown funciona

---

### 3.7 Documentación de Producción

**Tasks:**
- [ ] Crear `DEPLOYMENT_GUIDE.md`
- [ ] Documentar variables de entorno requeridas
- [ ] Documentar comandos de deploy
- [ ] Documentar proceso de rollback
- [ ] Documentar troubleshooting común

**Criterio de Éxito:**
- Documentación completa de deployment
- Cualquier dev puede deployar siguiendo la guía

---

## ⚙️ FASE 4: CI/CD & Automatización

**Objetivo:** Automatizar testing, seguridad y deployment

**Duración Estimada:** 3-4 horas

### 4.1 GitHub Actions - Testing

**Workflow: `.github/workflows/test.yml`**

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run tests
        working-directory: ./backend
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: test_user
          DB_PASSWORD: test_password
          DB_NAME: test_db
          JWT_SECRET: test_secret_key_for_ci
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run tests
        working-directory: ./frontend
        run: npm test

      - name: Build
        working-directory: ./frontend
        run: npm run build
```

**Tasks:**
- [ ] Crear workflow de tests
- [ ] Configurar PostgreSQL service
- [ ] Ejecutar tests backend en CI
- [ ] Ejecutar tests frontend en CI
- [ ] Verificar que workflow pasa

---

### 4.2 GitHub Actions - Security Audit

**Workflow: `.github/workflows/security.yml`**

```yaml
name: Security Audit

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 1'  # Lunes a medianoche

jobs:
  audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Backend Audit
        working-directory: ./backend
        run: |
          npm audit --audit-level=high
          npm audit --json > audit-backend.json

      - name: Frontend Audit
        working-directory: ./frontend
        run: |
          npm audit --audit-level=high
          npm audit --json > audit-frontend.json

      - name: Upload audit results
        uses: actions/upload-artifact@v3
        with:
          name: security-audit
          path: |
            backend/audit-backend.json
            frontend/audit-frontend.json

      - name: Fail on HIGH vulnerabilities
        run: |
          if [ $(jq '.metadata.vulnerabilities.high' backend/audit-backend.json) -gt 0 ]; then
            echo "HIGH vulnerabilities found in backend!"
            exit 1
          fi
          if [ $(jq '.metadata.vulnerabilities.high' frontend/audit-frontend.json) -gt 0 ]; then
            echo "HIGH vulnerabilities found in frontend!"
            exit 1
          fi
```

**Tasks:**
- [ ] Crear workflow de seguridad
- [ ] Configurar schedule semanal
- [ ] Testear workflow
- [ ] Configurar notificaciones de fallos

---

### 4.3 GitHub Actions - Deployment

**Workflow: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags (v1.0.0, v1.1.0, etc.)

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Build Backend
        working-directory: ./backend
        run: |
          npm ci --production
          # Aquí podrías agregar build steps si es necesario

      - name: Build Frontend
        working-directory: ./frontend
        env:
          VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}
        run: |
          npm ci
          npm run build

      - name: Deploy to Server (Example with SCP)
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
        run: |
          # Setup SSH
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Deploy backend
          rsync -avz --delete backend/ $SERVER_USER@$SERVER_HOST:/var/www/intra-media/backend/

          # Deploy frontend
          rsync -avz --delete frontend/dist/ $SERVER_USER@$SERVER_HOST:/var/www/intra-media/frontend/

          # Restart services
          ssh $SERVER_USER@$SERVER_HOST 'pm2 restart intra-media-backend'

      - name: Health Check
        run: |
          sleep 10
          curl -f https://api.yourdomain.com/health || exit 1

      - name: Rollback on Failure
        if: failure()
        run: |
          echo "Deployment failed, rolling back..."
          # Implementar rollback logic
```

**Tasks:**
- [ ] Crear workflow de deployment
- [ ] Configurar secrets en GitHub
  - SSH_PRIVATE_KEY
  - SERVER_HOST
  - SERVER_USER
  - PRODUCTION_API_URL
- [ ] Testear deployment a staging
- [ ] Documentar proceso de rollback

---

### 4.4 Configuración de Secrets

**GitHub Secrets a configurar:**

En Settings → Secrets and variables → Actions:

```
Production Secrets:
- PRODUCTION_API_URL          = https://api.yourdomain.com
- SSH_PRIVATE_KEY             = <contenido de ~/.ssh/id_rsa>
- SERVER_HOST                 = your-server-ip
- SERVER_USER                 = deploy
- DB_PASSWORD                 = <production-db-password>
- JWT_SECRET                  = <production-jwt-secret>

Optional (Monitoring):
- SENTRY_DSN                  = https://...
- SENTRY_AUTH_TOKEN           = ...
```

**Tasks:**
- [ ] Generar par de llaves SSH para deployment
- [ ] Configurar todos los secrets en GitHub
- [ ] Testear acceso SSH desde GitHub Actions
- [ ] Documentar secrets requeridos

---

### 4.5 Monitoreo y Alertas

**Configurar GitHub Actions para notificaciones:**

En cada workflow, agregar:
```yaml
      - name: Notify on Slack (on failure)
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment failed! Check logs.'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Herramientas de Monitoring (opcional):**
- [ ] Configurar Uptime Robot (free tier)
- [ ] Configurar Sentry para error tracking
- [ ] Configurar logs centralizados (Logtail, Papertrail)

**Criterio de Éxito:**
- CI/CD pipelines funcionando
- Tests se ejecutan automáticamente
- Deploy automático en tags
- Notificaciones configuradas

---

## 🚀 FASE 5: Deploy a Producción

**Objetivo:** Sistema live en producción

**Duración Estimada:** 2 horas

### 5.1 Pre-flight Checklist

**Backend:**
- [ ] Variables de entorno configuradas
- [ ] Database de producción lista
- [ ] PM2 configurado
- [ ] Nginx configurado (reverse proxy)
- [ ] SSL/TLS certificates instalados
- [ ] Firewall configurado
- [ ] Backups automáticos activos

**Frontend:**
- [ ] Build de producción generado
- [ ] CDN configurado (opcional)
- [ ] DNS apuntando a servidor
- [ ] SSL certificates instalados

**Criterio de Éxito:**
- Todos los checks en verde
- Sistema listo para deploy

---

### 5.2 Deploy Inicial

**Método 1: Manual (Primera vez)**

```bash
# 1. SSH al servidor
ssh deploy@your-server

# 2. Clonar repositorio
git clone https://github.com/franferrer12/intramedia-system.git
cd intramedia-system

# 3. Setup backend
cd backend
npm ci --production
cp .env.example .env.production
nano .env.production  # Editar con valores reales

# 4. Setup PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 5. Setup frontend
cd ../frontend
npm ci
npm run build

# 6. Configurar Nginx
sudo nano /etc/nginx/sites-available/intra-media
# Paste configuration
sudo ln -s /etc/nginx/sites-available/intra-media /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. SSL con Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

**Método 2: GitHub Actions (Subsecuentes)**

```bash
# Tag nueva versión
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions automáticamente:
# - Ejecuta tests
# - Build de producción
# - Deploy al servidor
# - Health check
# - Notifica resultado
```

---

### 5.3 Nginx Configuration

**Frontend (`/etc/nginx/sites-available/intra-media-frontend`):**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/intra-media/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

**Backend (`/etc/nginx/sites-available/intra-media-backend`):**

```nginx
upstream backend {
    server localhost:8080;
    server localhost:8081;  # Si usas cluster mode PM2
}

server {
    listen 80;
    server_name api.yourdomain.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no auth needed)
    location /health {
        access_log off;
        proxy_pass http://backend/health;
    }
}
```

---

### 5.4 Verificación Post-Deploy

**Checklist:**
- [ ] Frontend carga en https://yourdomain.com
- [ ] API responde en https://api.yourdomain.com/health
- [ ] Login funciona
- [ ] CRUD básico funciona
- [ ] No hay errores en logs
- [ ] SSL Labs grade A+
- [ ] Lighthouse score > 90
- [ ] Health checks pasan

**Comandos de verificación:**
```bash
# Health check
curl https://api.yourdomain.com/health

# SSL test
curl -I https://yourdomain.com

# PM2 status
pm2 status

# Logs
pm2 logs intra-media-backend --lines 50

# Nginx status
sudo systemctl status nginx

# Database connections
psql -U prod_user -d intra_media_prod -c "SELECT COUNT(*) FROM users;"
```

**Criterio de Éxito:**
- Todos los checks pasan
- Sistema accesible públicamente
- Performance aceptable
- Sin errores críticos

---

### 5.5 Monitoreo Post-Deploy

**Primera hora:**
- [ ] Monitorear logs cada 5 minutos
- [ ] Verificar health checks
- [ ] Probar funcionalidades críticas
- [ ] Monitorear uso de CPU/RAM
- [ ] Verificar conexiones a DB

**Primeras 24 horas:**
- [ ] Revisar logs cada hora
- [ ] Monitorear errores
- [ ] Verificar performance
- [ ] Recibir feedback de usuarios

**Comandos útiles:**
```bash
# Monitor logs en tiempo real
pm2 logs intra-media-backend --lines 100

# Monitor recursos
pm2 monit

# Ver métricas
htop

# Ver conexiones de red
netstat -tulpn | grep :8080
```

---

### 5.6 Rollback Plan

**Si algo sale mal:**

**Método 1: Rollback de PM2**
```bash
pm2 stop intra-media-backend
cd /var/www/intra-media/backend
git checkout <previous-commit>
npm ci --production
pm2 restart intra-media-backend
```

**Método 2: Rollback de DB (si hubo migración)**
```bash
# Restaurar backup
psql -U prod_user intra_media_prod < /backups/db_YYYYMMDD.sql
```

**Método 3: Rollback vía GitHub**
```bash
# Revertir tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Deploy versión anterior
git tag -a v0.9.9 -m "Rollback to stable version"
git push origin v0.9.9
```

**Criterio de Éxito:**
- Plan de rollback documentado
- Backups verificados
- Proceso de rollback testeado

---

## 📊 Métricas de Éxito Global

**Al finalizar todas las fases:**

### Seguridad
- [ ] 0 vulnerabilidades en backend
- [ ] 0 vulnerabilidades en frontend
- [ ] SSL Labs grade A+
- [ ] Security headers configurados
- [ ] OWASP Top 10 cubierto

### Performance
- [ ] API response time < 200ms (p95)
- [ ] Frontend load time < 3s
- [ ] Lighthouse score > 90
- [ ] Build size < 3MB gzipped

### Confiabilidad
- [ ] Uptime > 99.9%
- [ ] Backups automáticos diarios
- [ ] Health checks funcionando
- [ ] Monitoring activo
- [ ] Logs centralizados

### Desarrollo
- [ ] CI/CD completamente automatizado
- [ ] Tests automáticos en PRs
- [ ] Deploy automático en tags
- [ ] Documentación completa

### Operaciones
- [ ] Sistema en producción live
- [ ] PM2 en cluster mode
- [ ] Nginx configurado
- [ ] SSL/TLS activo
- [ ] Rollback plan documentado

---

## 📝 Documentación Final

**Documentos a crear/actualizar:**

- [x] `PRODUCTION_ROADMAP.md` (este archivo)
- [ ] `frontend/SECURITY_AUDIT_REPORT.md`
- [ ] `TESTING_REPORT.md`
- [ ] `DEPLOYMENT_GUIDE.md`
- [ ] `ROLLBACK_PROCEDURE.md`
- [ ] `MONITORING_GUIDE.md`
- [ ] `TROUBLESHOOTING.md`
- [ ] README.md actualizado con info de producción

---

## 🎯 Siguientes Pasos

1. **Comenzar con FASE 1:** Frontend Security
2. **Ejecutar tasks secuencialmente**
3. **Documentar problemas encontrados**
4. **Marcar tasks completadas con [x]**
5. **Crear commits por cada fase completada**

---

**Fecha de Última Actualización:** 2025-12-03
**Estado:** READY TO START
**Mantenido por:** Development Team

