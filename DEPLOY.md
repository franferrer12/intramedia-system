# 🚀 Guía de Despliegue a Producción

## Versión: 0.1.0 - Primera Release
**Fecha:** Octubre 2025

---

## 📋 Pre-requisitos

### Software Requerido
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- Al menos 4GB RAM disponible
- 20GB espacio en disco

### Puertos Necesarios
- `80` - Frontend (Nginx)
- `8080` - Backend API (Spring Boot)
- `5432` - PostgreSQL (solo si se expone externamente)

---

## 🔒 Configuración de Seguridad

### 1. Generar Secretos

```bash
# JWT Secret (256 bits)
openssl rand -base64 64

# Contraseña de Base de Datos
openssl rand -base64 32

# Guardar estos valores para el siguiente paso
```

### 2. Crear Archivo de Variables de Entorno

```bash
# Copiar el template
cp .env.prod.example .env.prod

# Editar con tus valores reales
nano .env.prod  # o usar cualquier editor
```

**Variables OBLIGATORIAS a cambiar:**
- `POSTGRES_PASSWORD` - Contraseña de la base de datos
- `JWT_SECRET` - Clave secreta para JWT (mínimo 256 bits)
- `VITE_API_URL` - URL de tu API (http://tu-dominio-o-ip:8080/api)

### 3. Permisos de Archivos

```bash
# Proteger archivo de variables de entorno
chmod 600 .env.prod

# Crear directorios necesarios
mkdir -p uploads logs backups
chmod 755 uploads logs backups
```

---

## 🏗️ Proceso de Despliegue

### Opción 1: Despliegue Completo (Recomendado)

```bash
# 1. Clonar repositorio (si es primera vez)
git clone <repository-url>
cd club-management

# 2. Configurar variables de entorno
cp .env.prod.example .env.prod
# Editar .env.prod con valores reales

# 3. Construir y levantar servicios
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. Verificar estado
docker-compose -f docker-compose.prod.yml ps

# 5. Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Opción 2: Despliegue sin Rebuild

```bash
# Si ya están construidas las imágenes
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## ✅ Verificación Post-Despliegue

### 1. Verificar Salud de los Servicios

```bash
# Estado de contenedores
docker-compose -f docker-compose.prod.yml ps

# Todos deben estar "healthy"
# Si alguno está "unhealthy", revisar logs
```

### 2. Verificar Endpoints

```bash
# Health Check Backend
curl http://localhost:8080/actuator/health

# Respuesta esperada: {"status":"UP"}

# Health Check Frontend
curl http://localhost:80

# Debe devolver HTML de la aplicación
```

### 3. Verificar Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it club_postgres_prod psql -U club_admin -d club_management

# Dentro de psql:
\dt  # Listar tablas
\q   # Salir
```

### 4. Prueba de Login

```bash
# Login con usuario por defecto
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# ⚠️ IMPORTANTE: Cambiar contraseña del admin inmediatamente
```

---

## 🔄 Actualización

### Actualizar a Nueva Versión

```bash
# 1. Backup de base de datos
docker exec club_postgres_prod pg_dump -U club_admin club_management > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Detener servicios
docker-compose -f docker-compose.prod.yml down

# 3. Actualizar código
git pull origin main

# 4. Rebuild y levantar
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 5. Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 💾 Backup y Restauración

### Backup Manual

```bash
# Backup de base de datos
docker exec club_postgres_prod pg_dump -U club_admin club_management > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de archivos subidos
tar -czf backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### Restauración

```bash
# Restaurar base de datos
docker exec -i club_postgres_prod psql -U club_admin club_management < backups/backup_YYYYMMDD_HHMMSS.sql

# Restaurar archivos subidos
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz
```

### Backup Automático (Cron)

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * cd /path/to/club-management && docker exec club_postgres_prod pg_dump -U club_admin club_management > backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

---

## 🔍 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Solo backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Solo frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Solo postgres
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Ver Logs Históricos

```bash
# Últimas 100 líneas
docker-compose -f docker-compose.prod.yml logs --tail=100

# Desde una fecha específica
docker-compose -f docker-compose.prod.yml logs --since="2025-10-06T10:00:00"
```

### Logs de Aplicación (Backend)

```bash
# Los logs de Spring Boot están en ./logs/
tail -f logs/club-management.log
```

---

## 🛑 Detener Servicios

### Detener sin Eliminar Datos

```bash
docker-compose -f docker-compose.prod.yml stop
```

### Detener y Eliminar Contenedores (Mantener Datos)

```bash
docker-compose -f docker-compose.prod.yml down
```

### Detener y Eliminar TODO (⚠️ PELIGRO - Elimina base de datos)

```bash
docker-compose -f docker-compose.prod.yml down -v
```

---

## 🔧 Troubleshooting

### Problema: Contenedor "unhealthy"

```bash
# Ver logs del servicio problemático
docker-compose -f docker-compose.prod.yml logs backend

# Revisar health check
docker inspect club_backend_prod | grep -A 20 Health
```

### Problema: No se puede conectar al backend

```bash
# Verificar que el puerto esté abierto
netstat -tuln | grep 8080

# Verificar que el backend esté corriendo
docker exec club_backend_prod curl localhost:8080/actuator/health
```

### Problema: Error de base de datos

```bash
# Verificar logs de Postgres
docker-compose -f docker-compose.prod.yml logs postgres

# Conectar manualmente a la BD
docker exec -it club_postgres_prod psql -U club_admin -d club_management
```

### Problema: Migración de Flyway falla

```bash
# Ver estado de migraciones
docker exec -it club_postgres_prod psql -U club_admin -d club_management -c "SELECT * FROM flyway_schema_history;"

# Si es necesario, limpiar y re-migrar (⚠️ solo en desarrollo)
# EN PRODUCCIÓN: Nunca ejecutar flyway clean
```

---

## 🔐 Seguridad Post-Despliegue

### Checklist de Seguridad

- [ ] Cambiar contraseña del usuario `admin`
- [ ] Cambiar `POSTGRES_PASSWORD` del valor por defecto
- [ ] Cambiar `JWT_SECRET` a un valor aleatorio de 256 bits
- [ ] Configurar firewall (solo puertos 80, 8080, 443 si usas HTTPS)
- [ ] Configurar CORS con tu dominio real en `application.yml`
- [ ] Deshabilitar endpoint de Actuator `/metrics` en producción
- [ ] Implementar HTTPS con certificado SSL (Let's Encrypt recomendado)
- [ ] Configurar backups automáticos
- [ ] Revisar logs regularmente

### Cambiar Contraseña del Admin

```bash
# 1. Login y obtener token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Actualizar contraseña
curl -X PUT http://localhost:8080/api/usuarios/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"nueva-contraseña-segura"}'
```

---

## 📊 Recursos del Sistema

### Recursos Asignados

| Servicio   | CPU Límite | RAM Límite | CPU Reserva | RAM Reserva |
|------------|------------|------------|-------------|-------------|
| Frontend   | 0.5 cores  | 512 MB     | 0.25 cores  | 256 MB      |
| Backend    | 2.0 cores  | 2 GB       | 1.0 cores   | 1 GB        |
| PostgreSQL | 1.0 cores  | 1 GB       | 0.5 cores   | 512 MB      |
| **TOTAL**  | **3.5**    | **3.5 GB** | **1.75**    | **1.75 GB** |

### Monitorear Uso de Recursos

```bash
# Ver uso de recursos en tiempo real
docker stats

# Ver uso de disco
docker system df
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs: `docker-compose -f docker-compose.prod.yml logs`
2. Consultar [BUGFIXES.md](BUGFIXES.md) para errores conocidos
3. Consultar [README.md](README.md) para documentación general

---

## 📝 Changelog

### v0.1.0 (2025-10-06)
- ✅ Setup inicial completo
- ✅ Dashboard con datos reales
- ✅ Autenticación JWT
- ✅ Gestión de eventos, usuarios, proveedores
- ✅ Transacciones y finanzas
- ✅ Empleados y nóminas
- ✅ Inventario y productos
- ✅ Reportes Excel y analytics
- ✅ Configuración de producción
