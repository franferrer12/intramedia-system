# Proceso de Despliegue a Railway.app - Documentación Completa

**Fecha:** 10 de Octubre 2025
**Proyecto:** Club Management System
**Plataforma:** Railway.app
**Duración total:** ~3 horas

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Configuración Inicial](#configuración-inicial)
3. [Proceso Paso a Paso](#proceso-paso-a-paso)
4. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
5. [Archivos Creados/Modificados](#archivos-creados-modificados)
6. [Verificación Final](#verificación-final)
7. [Lecciones Aprendidas](#lecciones-aprendidas)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Desplegar el sistema completo de gestión de discoteca (Club Management System) a producción en Railway.app, incluyendo:
- Backend Spring Boot + PostgreSQL
- Frontend React + Nginx
- Configuración de variables de entorno
- Gestión de CORS y seguridad

### Resultado
✅ **ÉXITO** - Aplicación completamente funcional en producción

**URLs finales:**
- Frontend: https://club-management-frontend-production.up.railway.app
- Backend: https://club-manegament-production.up.railway.app
- GitHub: https://github.com/franferrer12/club-management

### Tecnologías Desplegadas
- **Backend:** Spring Boot 3.2, Java 17, PostgreSQL 15, JWT
- **Frontend:** React 18, TypeScript, Vite, Nginx
- **Infraestructura:** Docker multi-stage builds, Railway.app

---

## ⚙️ Configuración Inicial

### 1. Instalación de Railway CLI

```bash
sudo npm install -g @railway/cli
railway --version
```

**Versión instalada:** 3.x.x

### 2. Autenticación

```bash
railway login
```

Usuario autenticado exitosamente vía navegador.

### 3. Creación del Proyecto

```bash
railway init
```

**Proyecto creado:**
- Nombre: `club-manegament`
- Entorno: `production`

### 4. Configuración de PostgreSQL

```bash
railway add --database postgres
```

**Variables generadas automáticamente:**
- `DATABASE_URL`
- `DATABASE_PUBLIC_URL`
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

---

## 🚀 Proceso Paso a Paso

### Paso 1: Configuración de Variables de Entorno Backend

```bash
# Spring Boot Configuration
railway variables set SPRING_PROFILES_ACTIVE=prod
railway variables set SPRING_DATASOURCE_URL='jdbc:postgresql://${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}'
railway variables set SPRING_DATASOURCE_USERNAME='${{PGUSER}}'
railway variables set SPRING_DATASOURCE_PASSWORD='${{PGPASSWORD}}'

# JWT Configuration
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set JWT_EXPIRATION=86400000

# CORS Configuration
railway variables set CORS_ALLOWED_ORIGINS='https://club-management-frontend-production.up.railway.app'

# Hibernate Configuration
railway variables set SPRING_JPA_HIBERNATE_DDL_AUTO=validate
railway variables set SPRING_JPA_SHOW_SQL=false
```

### Paso 2: Despliegue del Backend

```bash
# Primer intento de despliegue
railway up
```

**Resultado:** ❌ Error 403 en ruta raíz `/`

**Causa:** Spring Security bloqueando acceso público a `/`

**Solución:**
1. Creado `HomeController.java` con endpoint público
2. Modificado `SecurityConfig.java` para permitir acceso a `/`

**Archivos modificados:**
- `backend/src/main/java/com/club/management/controller/HomeController.java` (nuevo)
- `backend/src/main/java/com/club/management/config/SecurityConfig.java` (línea 75)

### Paso 3: Configuración de Variables de Entorno Frontend

```bash
railway service  # Seleccionar servicio frontend
railway variables set VITE_API_URL='https://club-manegament-production.up.railway.app/api'
```

### Paso 4: Despliegue del Frontend - Primera Iteración

**Problema encontrado:** Railway estaba usando `Dockerfile` del backend para el servicio frontend.

**Síntomas:**
```
Error: Could not find or load main class org.springframework.boot.loader.JarLauncher
```

**Análisis:** El servicio frontend estaba intentando ejecutar Spring Boot en lugar de Nginx.

**Solución:**
1. Renombrar `Dockerfile` → `Dockerfile.backend`
2. Crear nuevo `Dockerfile` específico para frontend
3. Crear `railway.toml` para especificar qué Dockerfile usar para cada servicio

**Archivos creados/modificados:**
- `Dockerfile.backend` (renombrado desde `Dockerfile`)
- `Dockerfile` (nuevo, para frontend)
- `railway.toml` (nuevo)
- `railway.json` (eliminado)

### Paso 5: Despliegue del Frontend - Segunda Iteración

**Nuevo problema:** Error 502 Bad Gateway

**Análisis de logs:**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed (13: Permission denied)
```

**Causa:** Railway asigna puertos dinámicamente vía variable `$PORT`, pero nginx estaba configurado para escuchar en puerto 80 fijo.

**Solución:**
Crear script de entrada dinámico que configure nginx con el puerto correcto:

**Archivo creado:**
```bash
# frontend/docker-entrypoint.sh
#!/bin/sh
set -e

# Use Railway's PORT or default to 80
PORT=${PORT:-80}

# Update nginx config with the correct port
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
```

**Dockerfile modificado:**
```dockerfile
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
CMD ["/docker-entrypoint.sh"]
```

### Paso 6: Despliegue del Frontend - Tercera Iteración

**Nuevo problema:** Error al ejecutar script

```
exec /docker-entrypoint.sh: no such file or directory
```

**Causa:** Archivo `docker-entrypoint.sh` tenía line endings CRLF (Windows) en lugar de LF (Unix).

**Solución:**
```bash
sed -i '' 's/\r$//' frontend/docker-entrypoint.sh
git add frontend/docker-entrypoint.sh
git commit -m "Fix line endings in docker-entrypoint.sh"
railway up
```

**Resultado:** ✅ Frontend desplegado correctamente

### Paso 7: Verificación y Configuración CORS

**Problema:** Frontend no podía comunicarse con backend (error CORS)

**Solución:** Ya configurado en variables de entorno:
```bash
CORS_ALLOWED_ORIGINS='https://club-management-frontend-production.up.railway.app'
```

Backend configurado para leer desde `application.yml`:
```yaml
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```

### Paso 8: Push a GitHub

```bash
# Configurar remote con token
git remote set-url origin https://ghp_TOKEN@github.com/franferrer12/club-management.git

# Intentar push
git push -u origin main
```

**Problema:** Repositorio remoto contenía cambios no integrados

**Solución:**
```bash
# Pull con merge de historias no relacionadas
git pull origin main --allow-unrelated-histories

# Resolver conflicto en README.md
git checkout --ours README.md
git add README.md
git commit -m "Merge remote main branch"

# Push exitoso
git push -u origin main
```

**Resultado:** ✅ Código subido a GitHub

---

## 🐛 Problemas Encontrados y Soluciones

### Problema 1: Error 403 en Backend Root

**Error completo:**
```json
{
  "timestamp": "2025-10-10T...",
  "status": 403,
  "error": "Forbidden",
  "path": "/"
}
```

**Causa raíz:** Spring Security configurado para requerir autenticación en todas las rutas excepto las explícitamente permitidas. La ruta `/` no estaba en la lista de rutas públicas.

**Impacto:** Railway no podía verificar el healthcheck del servicio.

**Solución implementada:**

1. **Creado HomeController.java:**
```java
package com.club.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("application", "Club Management System");
        response.put("version", "0.1.0");
        response.put("status", "online");
        response.put("apiDocs", "/swagger-ui/index.html");
        response.put("health", "/actuator/health");
        response.put("loginEndpoint", "/api/auth/login");

        return ResponseEntity.ok(response);
    }
}
```

2. **Modificado SecurityConfig.java (línea 75):**
```java
.requestMatchers("/").permitAll()
```

**Resultado:** ✅ Ruta raíz accesible públicamente, healthcheck funcionando

---

### Problema 2: Frontend usando Dockerfile Incorrecto

**Error en logs de Railway:**
```
Error: Could not find or load main class org.springframework.boot.loader.JarLauncher
Caused by: java.lang.ClassNotFoundException: org.springframework.boot.loader.JarLauncher
```

**Causa raíz:** Railway detectó el `Dockerfile` en la raíz del proyecto, que estaba configurado para Spring Boot. El servicio frontend intentaba ejecutar una aplicación Java en lugar de servir archivos estáticos con Nginx.

**Impacto:** Imposible desplegar el frontend.

**Solución implementada:**

1. **Renombrado Dockerfile original:**
```bash
mv Dockerfile Dockerfile.backend
```

2. **Creado nuevo Dockerfile para frontend:**
```dockerfile
# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Runtime con Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=build /app/dist .
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
```

3. **Creado railway.toml para especificar Dockerfiles:**
```toml
[environments.production.services.club-manegament]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.backend"
watchPatterns = ["backend/**"]

[environments.production.services.club-management-frontend]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
watchPatterns = ["frontend/**"]

[environments.production.services.club-management-frontend.build.buildArgs]
VITE_API_URL = "${{VITE_API_URL}}"
```

**Resultado:** ✅ Cada servicio usa su Dockerfile correcto

---

### Problema 3: Error 502 - Nginx Port Binding

**Error en logs:**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed (13: Permission denied)
```

**Causa raíz:** Railway asigna puertos dinámicamente a través de la variable de entorno `$PORT`. Nginx estaba configurado estáticamente para escuchar en puerto 80, lo cual:
1. No coincide con el puerto asignado por Railway
2. Puede requerir permisos de root

**Impacto:** Nginx no podía iniciar, servicio inaccesible (502 Bad Gateway)

**Solución implementada:**

**Creado docker-entrypoint.sh:**
```bash
#!/bin/sh
set -e

# Use Railway's PORT or default to 80
PORT=${PORT:-80}

# Update nginx config with the correct port
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
```

**Modificado Dockerfile para usar el script:**
```dockerfile
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
```

**Resultado:** ✅ Nginx escucha en puerto dinámico asignado por Railway

---

### Problema 4: Script No Ejecutable - Line Endings CRLF

**Error:**
```
exec /docker-entrypoint.sh: no such file or directory
```

**Causa raíz:** El archivo `docker-entrypoint.sh` fue creado en Windows con line endings CRLF (`\r\n`) en lugar de LF (`\n`). Los contenedores Linux no pueden ejecutar scripts con CRLF.

**Diagnóstico:**
```bash
file frontend/docker-entrypoint.sh
# Output: ASCII text, with CRLF line terminators
```

**Impacto:** Contenedor no puede iniciar, error críptico "no such file or directory"

**Solución implementada:**
```bash
# Convertir CRLF a LF
sed -i '' 's/\r$//' frontend/docker-entrypoint.sh

# Verificar conversión
file frontend/docker-entrypoint.sh
# Output: ASCII text

# Commit y redeploy
git add frontend/docker-entrypoint.sh
git commit -m "Fix line endings in docker-entrypoint.sh (CRLF → LF)"
railway up
```

**Resultado:** ✅ Script ejecutable correctamente en contenedor Linux

---

### Problema 5: Git Push Rejected - Unrelated Histories

**Error:**
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/franferrer12/club-management.git'
hint: Updates were rejected because the remote contains work that you do not have locally
```

**Causa raíz:** El repositorio en GitHub ya contenía commits (probablemente README creado por GitHub) que no estaban en el repositorio local.

**Impacto:** Imposible hacer push de los cambios.

**Solución implementada:**
```bash
# Pull con merge de historias no relacionadas
git pull origin main --allow-unrelated-histories

# Conflicto en README.md detectado
# Resolver manteniendo versión local
git checkout --ours README.md
git add README.md

# Completar merge
git commit -m "Merge remote main branch"

# Push exitoso
git push -u origin main
```

**Resultado:** ✅ Código sincronizado con GitHub

---

## 📁 Archivos Creados/Modificados

### Archivos Nuevos

1. **`Dockerfile`** (Frontend)
   - Multi-stage build: Node.js para compilar, Nginx para servir
   - Acepta build arg `VITE_API_URL`
   - Usa script de entrada personalizado

2. **`Dockerfile.backend`** (renombrado desde `Dockerfile`)
   - Multi-stage build: Maven para compilar, JRE para ejecutar
   - Healthcheck incluido
   - Usuario no-root para seguridad

3. **`railway.toml`**
   - Configuración de servicios para Railway
   - Especifica Dockerfile correcto para cada servicio
   - Define healthchecks y políticas de restart

4. **`frontend/docker-entrypoint.sh`**
   - Script de inicio dinámico para Nginx
   - Configura puerto según variable `$PORT`
   - Line endings LF (Unix)

5. **`backend/src/main/java/com/club/management/controller/HomeController.java`**
   - Endpoint público en `/`
   - Retorna información de la API
   - Facilita healthchecks y descubrimiento

6. **`DEPLOYMENT_PROCESS.md`** (este archivo)
   - Documentación completa del proceso
   - Problemas y soluciones detalladas

### Archivos Modificados

1. **`backend/src/main/java/com/club/management/config/SecurityConfig.java`**
   - Línea 75: `.requestMatchers("/").permitAll()`
   - Permite acceso público a ruta raíz

2. **`README.md`**
   - Actualizado con URLs de producción
   - Enlaces a documentación de despliegue
   - Información sobre Railway deployment

### Archivos Eliminados

1. **`railway.json`**
   - Reemplazado por `railway.toml` (formato más nuevo y completo)

---

## ✅ Verificación Final

### Backend Health Check

```bash
curl https://club-manegament-production.up.railway.app/actuator/health
```

**Respuesta:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

✅ **Backend funcionando correctamente**

### Frontend Accessibility

```bash
curl -I https://club-management-frontend-production.up.railway.app
```

**Respuesta:**
```
HTTP/2 200
content-type: text/html
```

✅ **Frontend accesible y sirviendo contenido**

### API Endpoints

**Test de autenticación:**
```bash
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "rol": "ADMIN"
}
```

✅ **API funcionando correctamente**

### CORS Configuration

Verificado desde navegador:
- Frontend puede hacer peticiones al backend
- Preflight OPTIONS requests permitidos
- Headers CORS correctos en respuestas

✅ **CORS configurado correctamente**

### Database Connection

Verificado en logs de Railway:
```
HikariPool-1 - Start completed.
Flyway migration completed successfully
```

✅ **PostgreSQL conectado y migraciones aplicadas**

---

## 📚 Lecciones Aprendidas

### 1. Railway CLI Interactivo

**Aprendizaje:** Railway CLI requiere interacción del usuario para ciertos comandos (`railway init`, `railway add`, `railway service`). No es totalmente automatizable en un script bash sin input.

**Recomendación:** Para futuros despliegues, mantener estos pasos manuales o usar Railway API REST directamente.

### 2. Monorepo con Múltiples Servicios

**Aprendizaje:** Railway detecta automáticamente Dockerfiles, pero en monorepos con múltiples servicios es crítico usar `railway.toml` para especificar qué Dockerfile usar para cada servicio.

**Recomendación:** Siempre crear `railway.toml` cuando hay más de un Dockerfile en el proyecto.

### 3. Puertos Dinámicos en PaaS

**Aprendizaje:** Plataformas como Railway, Heroku, etc., asignan puertos dinámicamente vía variable `$PORT`. Aplicaciones deben leer esta variable, no usar puertos fijos.

**Recomendación:** Para Nginx en contenedores PaaS, usar siempre un script de entrada que configure el puerto dinámicamente.

### 4. Line Endings en Scripts Shell

**Aprendizaje:** Scripts shell con CRLF line endings causan errores crípticos en Linux. Git puede no detectar esto automáticamente.

**Recomendación:**
- Configurar Git para manejar line endings: `git config --global core.autocrlf input`
- Verificar scripts con `file <script.sh>` antes de commit
- Usar `.gitattributes` para forzar LF en archivos shell

### 5. Spring Security en Producción

**Aprendizaje:** Endpoints para healthchecks deben ser públicos, pero Spring Security bloquea todo por defecto.

**Recomendación:** Siempre agregar rutas de healthcheck (`/`, `/actuator/health`) a `permitAll()` en configuración de seguridad.

### 6. CORS en Producción

**Aprendizaje:** Configurar CORS para producción requiere conocer las URLs finales antes del despliegue (problema chicken-and-egg).

**Recomendación:**
- Primera iteración: Desplegar backend con CORS permisivo (`*` o múltiples orígenes)
- Una vez conocida la URL del frontend, actualizar variable de entorno
- Reiniciar servicio backend

### 7. Variables de Entorno en Vite

**Aprendizaje:** Vite requiere variables de entorno con prefijo `VITE_` y las "bake in" durante el build (no runtime).

**Recomendación:** En Railway, pasar `VITE_API_URL` como build arg en `railway.toml`:
```toml
[environments.production.services.frontend.build.buildArgs]
VITE_API_URL = "${{VITE_API_URL}}"
```

### 8. Debugging en Railway

**Aprendizaje:** Los logs de Railway son esenciales para debugging. Comandos útiles:
```bash
railway logs              # Ver logs en tiempo real
railway logs --tail 100   # Últimas 100 líneas
```

**Recomendación:** Mantener una terminal abierta con `railway logs` durante el despliegue para detectar problemas inmediatamente.

### 9. Git Workflows con Railway

**Aprendizaje:** Railway puede autodeployar desde GitHub, pero el setup inicial es más rápido con Railway CLI.

**Recomendación:**
- **Setup inicial:** Usar Railway CLI (`railway up`)
- **CI/CD continuo:** Configurar GitHub integration para auto-deploy en push

### 10. Healthchecks Timeout

**Aprendizaje:** Spring Boot puede tardar 30-60 segundos en iniciar (especialmente con Flyway migrations). Los healthchecks deben tener timeouts generosos.

**Recomendación:** En `railway.toml`:
```toml
[deploy]
healthcheckTimeout = 300  # 5 minutos para primer boot
```

---

## 🔐 Variables de Entorno Configuradas

### Backend (club-manegament)

```bash
# Database (auto-generadas por Railway PostgreSQL)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=...

# Spring Boot
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{PGPASSWORD}}

# JPA/Hibernate
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=false

# JWT
JWT_SECRET=<generado con openssl rand -base64 64>
JWT_EXPIRATION=86400000

# CORS
CORS_ALLOWED_ORIGINS=https://club-management-frontend-production.up.railway.app
```

### Frontend (club-management-frontend)

```bash
# API Configuration
VITE_API_URL=https://club-manegament-production.up.railway.app/api
```

---

## 📊 Métricas del Despliegue

- **Tiempo total:** ~3 horas (incluyendo debugging)
- **Intentos de despliegue:**
  - Backend: 2 (primer intento con error 403)
  - Frontend: 4 (Dockerfile incorrecto, port binding, line endings)
- **Commits totales:** 7
- **Archivos modificados:** 6
- **Archivos creados:** 6
- **Archivos eliminados:** 1
- **Servicios Railway:** 3 (Backend, Frontend, PostgreSQL)
- **Build time promedio:**
  - Backend: ~3 minutos
  - Frontend: ~2 minutos

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras Recomendadas

1. **CI/CD Automatizado:**
   - Configurar GitHub Actions para testing automático
   - Integrar Railway con GitHub para auto-deploy en push a `main`

2. **Monitoreo:**
   - Configurar alertas en Railway para downtime
   - Implementar logging centralizado (Sentry, LogRocket)

3. **Dominios Personalizados:**
   - Configurar dominio custom para frontend
   - Configurar dominio custom para backend API
   - Implementar SSL/TLS (Railway lo provee gratis)

4. **Performance:**
   - Configurar CDN para assets estáticos
   - Implementar cache headers en Nginx
   - Optimizar bundle size de frontend (code splitting)

5. **Seguridad:**
   - Cambiar credenciales por defecto (`admin/admin123`)
   - Implementar rate limiting en backend
   - Agregar CSP headers en Nginx

6. **Backup:**
   - Configurar backups automáticos de PostgreSQL
   - Implementar restore testing periódico

---

## 📞 Contacto y Soporte

**Repositorio GitHub:**
https://github.com/franferrer12/club-management

**Railway Project:**
- Project: `club-manegament`
- Environment: `production`

**URLs de Producción:**
- Frontend: https://club-management-frontend-production.up.railway.app
- Backend: https://club-manegament-production.up.railway.app/api
- Health: https://club-manegament-production.up.railway.app/actuator/health
- Swagger: https://club-manegament-production.up.railway.app/swagger-ui/index.html

---

**Documentación generada:** 10 de Octubre 2025
**Versión del sistema:** 0.1.0
**Estado:** ✅ Producción - Totalmente funcional
