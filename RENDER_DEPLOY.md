# Guía de Deployment en Render.com

Esta guía te ayudará a desplegar el sistema de Club Management en Render.com usando el archivo `render.yaml` incluido en el proyecto.

## Requisitos Previos

1. **Cuenta en Render**: Crea una cuenta gratuita en [render.com](https://render.com)
2. **Repositorio Git**: Tu código debe estar en GitHub, GitLab o Bitbucket
3. **Git CLI** (opcional): Para hacer push de los cambios

## Arquitectura del Deployment

El sistema se despliega en 3 componentes:

1. **Base de Datos PostgreSQL**: Base de datos PostgreSQL 15
2. **Backend (Spring Boot)**: API REST con Java 17
3. **Frontend (React + Vite)**: Interfaz de usuario servida con Nginx

## Plan Gratuito de Render

Con el plan gratuito obtienes:

- **Web Services**: Servicios que entran en "sleep" después de 15 minutos de inactividad
  - Primera solicitud después del sleep toma ~30-50 segundos
  - 750 horas/mes compartidas entre todos tus servicios
- **PostgreSQL**: 1GB de almacenamiento
  - Expira en 90 días (puedes recrear la BD sin perder el servicio)
- **Sin límite de deploys**: Puedes hacer deploy tantas veces como quieras

### Upgrade a Paid (Recomendado para Producción)

- **Starter plan ($7/mes por servicio)**: Sin sleep, mejor performance
- **PostgreSQL Starter ($7/mes)**: Sin expiración, backups automáticos

## Opción 1: Deploy Automático con Blueprint (Recomendado)

### Paso 1: Subir Código a Git

```bash
cd /Users/franferrer/workspace/club-management

# Si no has hecho commit de los cambios
git add .
git commit -m "Preparar proyecto para Render"
git push origin main
```

### Paso 2: Importar en Render

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona el repositorio `club-management`
5. Render detectará automáticamente el archivo `render.yaml`
6. Click en **"Apply"**

Render creará automáticamente:
- Base de datos PostgreSQL
- Backend service
- Frontend service

### Paso 3: Esperar el Deploy

- La base de datos se crea en ~2 minutos
- El backend build toma ~5-7 minutos (compilación de Maven)
- El frontend build toma ~3-5 minutos (build de Vite)
- **Total: ~10-15 minutos aproximadamente**

### Paso 4: Verificar el Deployment

Una vez completado, tendrás 3 servicios activos:

1. **club-management-db**: Base de datos PostgreSQL
2. **club-management-backend**:
   - URL: `https://club-management-backend.onrender.com`
   - Health check: `https://club-management-backend.onrender.com/actuator/health`
3. **club-management-frontend**:
   - URL: `https://club-management-frontend.onrender.com`

Accede al frontend en tu navegador: `https://club-management-frontend.onrender.com`

**Credenciales por defecto:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambia las credenciales después del primer login.

## Opción 2: Deploy Manual (Paso a Paso)

Si prefieres crear cada servicio manualmente:

### 1. Crear Base de Datos

1. En Render Dashboard: **New +** → **PostgreSQL**
2. Configuración:
   - **Name**: `club-management-db`
   - **Database**: `club_management`
   - **User**: `club_admin`
   - **Region**: Oregon (o el más cercano a ti)
   - **Plan**: Free
3. Click en **Create Database**
4. Guarda la **Internal Database URL** (la necesitarás para el backend)

### 2. Crear Backend Service

1. **New +** → **Web Service**
2. Conecta tu repositorio Git
3. Configuración:
   - **Name**: `club-management-backend`
   - **Region**: Oregon (misma que la BD)
   - **Branch**: `main`
   - **Root Directory**: dejar vacío
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
4. **Environment Variables** (Advanced):
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=[URL de la BD copiada en paso 1]
   DB_URL=[URL de la BD copiada en paso 1]
   JWT_SECRET=[genera un secret con: openssl rand -base64 64]
   JWT_EXPIRATION=86400000
   CORS_ALLOWED_ORIGINS=https://club-management-frontend.onrender.com
   ```
5. **Health Check Path**: `/actuator/health`
6. Click en **Create Web Service**

### 3. Crear Frontend Service

1. **New +** → **Web Service**
2. Conecta tu repositorio Git
3. Configuración:
   - **Name**: `club-management-frontend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Docker Context**: `./frontend`
   - **Plan**: Free
4. **Environment Variables** (Advanced):
   ```
   VITE_API_URL=https://club-management-backend.onrender.com/api
   ```
5. Click en **Create Web Service**

## Post-Deployment

### 1. Verificar Health del Backend

```bash
curl https://club-management-backend.onrender.com/actuator/health
```

Deberías ver:
```json
{
  "status": "UP"
}
```

### 2. Verificar Frontend

Abre en tu navegador:
```
https://club-management-frontend.onrender.com
```

Deberías ver la página de login.

### 3. Acceder al Sistema

- **Username**: `admin`
- **Password**: `admin123`

### 4. Cambiar Credenciales

⚠️ **IMPORTANTE**: Una vez dentro del sistema:
1. Ve a **Configuración** o **Mi Perfil**
2. Cambia la contraseña del usuario admin
3. Considera crear usuarios adicionales con roles específicos

## Configuración de Dominio Personalizado (Opcional)

Si tienes un dominio propio:

1. En cada servicio → **Settings** → **Custom Domains**
2. Agrega tu dominio (ej: `api.tuclub.com` para backend, `app.tuclub.com` para frontend)
3. Configura los registros DNS según las instrucciones de Render
4. Actualiza las variables de entorno:
   - Backend `CORS_ALLOWED_ORIGINS`: agregar tu dominio del frontend
   - Frontend `VITE_API_URL`: cambiar a tu dominio del backend

## Troubleshooting

### El backend no inicia

1. Verifica los logs: Dashboard → Backend Service → Logs
2. Errores comunes:
   - **"Cannot connect to database"**: Verifica que `DATABASE_URL` esté correcta
   - **"Driver claims to not accept jdbcUrl, postgresql://"**: Este error ocurre si Render proporciona la URL en formato `postgresql://` en lugar de `jdbc:postgresql://`. El Dockerfile incluye un script de startup que convierte automáticamente el formato. Si persiste, verifica que el contenedor esté usando la última versión del Dockerfile.
   - **"JWT secret too short"**: El `JWT_SECRET` debe tener al menos 256 bits (44 caracteres en base64)
   - **"Port already in use"**: Render asigna el puerto automáticamente vía `$PORT`
   - **"Cannot commit when autoCommit is enabled"**: Asegúrate de tener `SPRING_DATASOURCE_HIKARI_AUTO_COMMIT=false` en las variables de entorno

### El frontend no se conecta al backend

1. Verifica que `VITE_API_URL` en el frontend apunte correctamente al backend
2. Verifica que `CORS_ALLOWED_ORIGINS` en el backend incluya la URL del frontend
3. Revisa la consola del navegador (F12 → Console) para ver errores CORS

### "Application Error" al primer acceso

Si ves este error y estás en el plan gratuito:
- El servicio está "despertando" del sleep
- Espera 30-50 segundos y recarga la página
- Esto solo pasa después de 15 minutos de inactividad

### Base de datos expira en 90 días

Con el plan free, la BD expira en 90 días. Opciones:

1. **Exportar y recrear** (Gratis):
   ```bash
   # Exportar datos
   pg_dump [DATABASE_URL] > backup.sql

   # Crear nueva BD en Render
   # Importar datos
   psql [NEW_DATABASE_URL] < backup.sql
   ```

2. **Upgrade a Starter** ($7/mes): Sin expiración

## Monitoring y Logs

### Ver Logs en Tiempo Real

1. Ve al dashboard de Render
2. Selecciona el servicio (backend o frontend)
3. Click en **Logs**

### Métricas

Render proporciona métricas básicas:
- CPU usage
- Memory usage
- Request count
- Response times

Disponibles en: Service → Metrics

### Alertas

Configura alertas para:
- Service down
- Deploy failed
- High error rate

En: Service → Settings → Notifications

## Auto-Deploy desde Git

Render automáticamente hace deploy cuando haces push a la rama configurada:

```bash
git add .
git commit -m "Nueva feature"
git push origin main
```

Render detectará el push y automáticamente:
1. Rebuildeará la imagen Docker
2. Desplegará la nueva versión
3. Ejecutará health checks

Puedes ver el progreso en: Service → Events

### Deshabilitar Auto-Deploy

Si quieres control manual:
1. Service → Settings → Build & Deploy
2. **Auto-Deploy**: Off

Luego puedes hacer deploy manual con: **Manual Deploy** → **Deploy latest commit**

## Costos Estimados

### Plan Gratuito
- **PostgreSQL**: Gratis (1GB, expira en 90 días)
- **Backend**: Gratis (con sleep después de 15 min)
- **Frontend**: Gratis (con sleep después de 15 min)
- **Total**: $0/mes

### Plan Recomendado para Producción
- **PostgreSQL Starter**: $7/mes (sin expiración, backups)
- **Backend Starter**: $7/mes (sin sleep, 0.5GB RAM)
- **Frontend Starter**: $7/mes (sin sleep, 0.5GB RAM)
- **Total**: $21/mes

### Optimización de Costos

Si el presupuesto es limitado:

1. **Prioriza el backend** ($7/mes):
   - El backend sin sleep mejora significativamente la experiencia
   - El frontend puede tolerar mejor el sleep (cache del navegador)

2. **Base de datos compartida**:
   - Usa una sola instancia de PostgreSQL para múltiples proyectos
   - Separa por schemas o databases diferentes

3. **Use Railway alternativo**:
   - Railway ofrece $5 de crédito mensual gratis
   - Puede ser suficiente para proyectos de bajo tráfico

## Backup de Base de Datos

### Manual Export

```bash
# Export completo
pg_dump [DATABASE_URL] > backup-$(date +%Y%m%d).sql

# Export solo datos (sin schema)
pg_dump [DATABASE_URL] --data-only > data-backup.sql

# Export schema only
pg_dump [DATABASE_URL] --schema-only > schema-backup.sql
```

### Import

```bash
psql [DATABASE_URL] < backup.sql
```

### Backup Automático

El plan Starter de PostgreSQL incluye:
- Daily backups
- Retention de 7 días
- Point-in-time recovery

## Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente al iniciar el backend gracias a Flyway.

Si necesitas ejecutar una migración manualmente:

1. Conecta a la BD:
   ```bash
   psql [DATABASE_URL]
   ```

2. Ejecuta el SQL de migración:
   ```sql
   \i /path/to/migration.sql
   ```

3. Actualiza Flyway history:
   ```sql
   INSERT INTO flyway_schema_history (...)
   ```

## Recursos Adicionales

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Docker on Render](https://render.com/docs/docker)

## Soporte

- **Render Community**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)
- **Email**: support@render.com

---

## Resumen de URLs

Después del deployment, tendrás:

| Componente | URL | Propósito |
|------------|-----|-----------|
| Frontend | `https://club-management-frontend.onrender.com` | Interfaz de usuario |
| Backend | `https://club-management-backend.onrender.com` | API REST |
| Backend Health | `https://club-management-backend.onrender.com/actuator/health` | Health check |
| Database | Internal URL (no expuesta públicamente) | PostgreSQL |

Guarda estas URLs para referencia futura.
