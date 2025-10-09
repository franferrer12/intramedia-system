# 🚀 Guía de Despliegue en Railway.app

## Despliegue Gratuito a Internet con Railway + GitHub

Esta guía te permitirá desplegar tu aplicación Club Management en internet **completamente gratis** usando Railway.app y GitHub.

---

## 📋 Paso 1: Preparar el Código para GitHub

### 1.1 Verificar que .env.prod NO se subirá a GitHub

Ya está configurado en `.gitignore`. Verifica que aparezca:

```bash
cd D:\club-management
type .gitignore | findstr env.prod
```

✅ Deberías ver: `.env.prod`

### 1.2 Agregar todos los archivos al repositorio

```bash
cd D:\club-management

# Agregar todos los archivos nuevos y modificados
git add .

# Ver qué se va a commitear
git status

# Crear commit
git commit -m "feat: preparar aplicación para despliegue en Railway

- Agregar dashboard con datos reales sincronizados
- Configurar CORS para producción
- Agregar archivos de configuración Railway
- Actualizar documentación de despliegue

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📋 Paso 2: Subir a GitHub

### Opción A: Si ya tienes un repositorio remoto configurado

```bash
# Ver repositorio remoto actual
git remote -v

# Subir cambios
git push origin main
```

### Opción B: Si es un nuevo repositorio

#### 2.1 Crear repositorio en GitHub

1. Ir a https://github.com/new
2. Nombre del repositorio: `club-management`
3. **IMPORTANTE**: Dejar como PRIVADO (tiene secretos en archivos locales)
4. No agregar README, .gitignore ni licencia (ya existen localmente)
5. Clic en "Create repository"

#### 2.2 Conectar tu repositorio local con GitHub

```bash
cd D:\club-management

# Agregar repositorio remoto (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/club-management.git

# Verificar
git remote -v

# Subir código
git branch -M main
git push -u origin main
```

---

## 📋 Paso 3: Desplegar Backend en Railway

### 3.1 Crear cuenta en Railway.app

1. Ir a https://railway.app/
2. Clic en "Login" o "Start a New Project"
3. **Conectar con GitHub** (Recommended)
4. Autorizar a Railway para acceder a tus repositorios

### 3.2 Crear Proyecto en Railway

1. Clic en "New Project"
2. Seleccionar "Deploy from GitHub repo"
3. Buscar y seleccionar `club-management`
4. Railway detectará automáticamente el proyecto

### 3.3 Configurar PostgreSQL

1. En tu proyecto de Railway, clic en "+ New"
2. Seleccionar "Database" → "PostgreSQL"
3. Railway creará una base de datos PostgreSQL automáticamente
4. Tomar nota de las variables de entorno que Railway genera (no necesitas copiarlas manualmente, las usaremos en el siguiente paso)

### 3.4 Configurar Backend Service

1. En Railway, clic en "+ New" → "GitHub Repo"
2. Seleccionar tu repositorio `club-management`
3. Railway detectará que es un proyecto con Dockerfile
4. Configurar las siguientes variables de entorno:

**Ir a tu servicio → Settings → Variables**

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# Database (Railway genera estas automáticamente al conectar PostgreSQL)
# Copiar desde tu servicio PostgreSQL: Settings → Variables → DATABASE_URL
DB_URL=jdbc:postgresql://[HOST_DE_RAILWAY]:[PUERTO]/railway
DB_USER=[USUARIO_DE_RAILWAY]
DB_PASSWORD=[PASSWORD_DE_RAILWAY]

# JWT (usar el mismo que generamos en .env.prod)
JWT_SECRET=K9sDTEHpDcJNWIQ1r+mkYL/zEF1uY5TfiW2jivduutPQ7ytu4Q56dCSqcNPrsbtktNG8V5Js1UdNpSkhLmDI3A==
JWT_EXPIRATION=86400000

# CORS (actualizar cuando tengas el dominio del frontend)
CORS_ALLOWED_ORIGINS=https://tu-frontend.railway.app
```

**IMPORTANTE**: Para obtener las variables de PostgreSQL:

1. Clic en tu servicio PostgreSQL
2. Ir a "Variables" tab
3. Copiar: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
4. En tu servicio backend, variables, agregar:
   ```
   DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

### 3.5 Configurar Dockerfile Build

1. En tu servicio backend → Settings → Build
2. **Builder**: Docker
3. **Dockerfile Path**: `backend/Dockerfile`
4. **Root Directory**: `/` (dejar en raíz)

### 3.6 Desplegar

1. Clic en "Deploy" o esperar a que se despliegue automáticamente
2. Ver logs en tiempo real: pestaña "Deployments" → "View Logs"
3. Esperar a que termine el build (puede tardar 5-10 minutos la primera vez)

### 3.7 Obtener URL del Backend

1. Una vez desplegado, ir a Settings → Networking
2. Clic en "Generate Domain"
3. Railway generará una URL como: `https://club-management-production-xxxx.up.railway.app`
4. **Guardar esta URL**, la necesitarás para el frontend

### 3.8 Verificar Despliegue del Backend

```bash
# Reemplaza URL_DE_RAILWAY con tu URL generada
curl https://club-management-production-xxxx.up.railway.app/actuator/health

# Debería devolver: {"status":"UP"}
```

---

## 📋 Paso 4: Desplegar Frontend en Railway

### 4.1 Crear Nuevo Servicio para Frontend

1. En el mismo proyecto de Railway, clic en "+ New"
2. Seleccionar "GitHub Repo"
3. Seleccionar el mismo repositorio `club-management`
4. **IMPORTANTE**: Cambiar configuración de build

### 4.2 Configurar Variables de Entorno del Frontend

**Ir a Settings → Variables del servicio frontend**

```bash
# URL de tu backend en Railway (obtenida en el paso 3.7)
VITE_API_URL=https://club-management-production-xxxx.up.railway.app/api
```

### 4.3 Configurar Build del Frontend

1. Settings → Build
2. **Builder**: Dockerfile
3. **Dockerfile Path**: `frontend/Dockerfile`
4. **Root Directory**: `/`
5. **Build Arguments**:
   ```
   VITE_API_URL=${{VITE_API_URL}}
   ```

### 4.4 Desplegar Frontend

1. Guardar configuración
2. Railway desplegará automáticamente
3. Ver logs: Deployments → View Logs
4. Esperar a que termine (3-5 minutos)

### 4.5 Obtener URL del Frontend

1. Settings → Networking
2. Clic en "Generate Domain"
3. Railway generará URL como: `https://club-frontend-xxxx.up.railway.app`
4. **Esta es tu URL pública de la aplicación**

---

## 📋 Paso 5: Actualizar CORS del Backend

Ahora que tienes la URL del frontend, debes actualizar el CORS del backend:

1. Ir a tu servicio **backend** en Railway
2. Settings → Variables
3. Actualizar `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://club-frontend-xxxx.up.railway.app
   ```
4. Railway re-desplegará automáticamente

---

## ✅ Verificación Final

### 1. Verificar Backend

```bash
curl https://tu-backend.railway.app/actuator/health
# Debería devolver: {"status":"UP"}
```

### 2. Verificar Frontend

1. Abrir en navegador: `https://tu-frontend.railway.app`
2. Debería cargar la página de login
3. Probar login con:
   - Username: `admin`
   - Password: `admin123`
4. Verificar que el dashboard cargue datos reales

### 3. Verificar Conexión Frontend-Backend

1. Abrir Developer Tools (F12)
2. Network tab
3. Hacer login
4. Verificar que las peticiones a `/api/auth/login` sean exitosas (status 200)
5. Verificar que el dashboard haga peticiones a `/api/dashboard/stats` correctamente

---

## 🔧 Troubleshooting

### Error: CORS blocked

**Problema**: Frontend no puede conectar con backend

**Solución**:
1. Verificar que `CORS_ALLOWED_ORIGINS` en backend incluya la URL del frontend
2. Incluir protocolo completo: `https://`, no solo el dominio
3. NO incluir `/` al final de la URL

### Error: Cannot connect to database

**Problema**: Backend no se conecta a PostgreSQL

**Solución**:
1. Verificar que el servicio PostgreSQL esté "healthy" (verde) en Railway
2. Verificar variables `DB_URL`, `DB_USER`, `DB_PASSWORD`
3. Usar referencias a variables de Railway: `${{Postgres.PGHOST}}`

### Error: Flyway migration failed

**Problema**: Migraciones de base de datos fallan

**Solución**:
1. Railway crea base de datos limpia, esto NO debería pasar
2. Si pasa, ir a PostgreSQL service → Data → Query
3. Ejecutar: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
4. Re-desplegar backend

### Frontend muestra "Network Error"

**Problema**: No puede conectar con API

**Solución**:
1. Verificar `VITE_API_URL` en variables del frontend
2. Debe apuntar a: `https://tu-backend.railway.app/api` (con `/api` al final)
3. Verificar que backend esté corriendo (healthy)

---

## 💰 Límites del Plan Gratuito de Railway

- **$5 USD de crédito gratis al mes**
- **500 horas de ejecución gratis al mes**
- **100 GB de ancho de banda**
- **1 GB de RAM por servicio**

Para una aplicación pequeña/mediana, esto es más que suficiente.

**Consejo**: Railway pausará servicios inactivos automáticamente para ahorrar créditos.

---

## 🔐 Cambiar Contraseña del Admin

**MUY IMPORTANTE**: Cambiar contraseña por defecto inmediatamente

```bash
# 1. Login y obtener token
curl -X POST https://tu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copiar el token de la respuesta

# 2. Actualizar contraseña
curl -X PUT https://tu-backend.railway.app/api/usuarios/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"password":"TuNuevaContraseñaSegura123!"}'
```

O hacerlo desde el frontend:
1. Login como admin
2. Ir a Configuración → Usuarios
3. Editar usuario admin
4. Cambiar contraseña

---

## 📊 Monitoreo

### Ver Logs en Railway

1. Seleccionar servicio (backend o frontend)
2. Deployments → View Logs
3. Filtrar por errores: buscar "ERROR" o "Exception"

### Métricas

1. Servicio → Metrics
2. Ver: CPU usage, Memory usage, Network

---

## 🔄 Actualizar Aplicación

### Cada vez que hagas cambios:

```bash
cd D:\club-management

# 1. Hacer cambios en código

# 2. Commit
git add .
git commit -m "descripción de cambios"

# 3. Push a GitHub
git push origin main

# 4. Railway desplegará automáticamente (CI/CD)
```

Railway detectará el push a GitHub y desplegará automáticamente en ~5 minutos.

---

## 📞 Resultado Final

Al completar todos los pasos, tendrás:

✅ **Backend desplegado**: `https://tu-backend.railway.app`
✅ **Frontend desplegado**: `https://tu-frontend.railway.app`
✅ **Base de datos PostgreSQL** en Railway
✅ **Despliegue automático** cada vez que hagas push a GitHub
✅ **100% GRATIS** (dentro de límites del plan gratuito)
✅ **HTTPS automático** (SSL incluido)
✅ **Accesible desde cualquier dispositivo con internet**

---

## 🎯 URLs Finales

Una vez completado el despliegue, guarda estas URLs:

```
Frontend (Aplicación Web): https://club-frontend-xxxx.up.railway.app
Backend (API):            https://club-backend-xxxx.up.railway.app
Swagger UI:               https://club-backend-xxxx.up.railway.app/swagger-ui/index.html
Health Check:             https://club-backend-xxxx.up.railway.app/actuator/health
```

---

**Versión**: 1.0.0
**Última actualización**: 2025-10-06
**Autor**: Club Management System

🎉 **¡Tu aplicación ya está en internet!**
