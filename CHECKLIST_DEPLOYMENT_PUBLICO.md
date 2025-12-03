# ✅ CHECKLIST PARA HACER PÚBLICA LA HERRAMIENTA

**Fecha:** 2025-10-09
**Proyecto:** Club Management System v0.1.0
**Estado:** PRE-PRODUCCIÓN

---

## 🔴 TAREAS CRÍTICAS - OBLIGATORIAS ANTES DE HACER PÚBLICO

### ✅ 1. Seguridad del Password Admin
- [x] Migración V010 creada para cambiar password admin
- [ ] **ACCIÓN REQUERIDA:** Ejecutar migración V010
- [ ] **ACCIÓN REQUERIDA:** Guardar nueva contraseña en gestor de passwords (1Password, Bitwarden, etc.)
- [ ] **ACCIÓN REQUERIDA:** Compartir credenciales de forma segura con administradores

**Password actual en V001:** `admin123` ⚠️ PÚBLICO EN CÓDIGO
**Nueva password en V010:** `ClubManagement2025!Secure#ProdPass` (o cambiar por una propia)

**Ejecutar migración:**
```bash
# La migración se ejecutará automáticamente al iniciar la aplicación
docker-compose -f docker-compose.prod.yml up -d

# Verificar que se ejecutó
docker exec -it club_backend psql -U club_admin -d club_management -c "SELECT version FROM flyway_schema_history WHERE version = '010';"
```

---

### ✅ 2. JWT Secret de Producción
- [x] JWT Secret generado (512 bits)
- [x] Configurado en `.env.prod`
- [ ] **ACCIÓN REQUERIDA:** Verificar que `.env.prod` NO está en git

**JWT Secret generado:** `bNqm8OtlzLZrG9tTVIVPekbGVEluHoRzQRyX1/ljSxgmTGwSW2SpsfQ7JIfOYzQe8B56MBtMsp0rSun0yPMZtQ==`

**Verificar que está en .gitignore:**
```bash
grep -E "^\.env\.prod$|^\.env\.prod" .gitignore
# Debe retornar: .env.prod
```

---

### ✅ 3. CORS Configuration
- [x] CORS inseguro eliminado de controllers
- [ ] **ACCIÓN REQUERIDA:** Configurar dominio real en `application.yml`

**Archivo:** `backend/src/main/resources/application.yml` línea 114

**Cambiar:**
```yaml
# ANTES (línea 114):
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:https://yourdomain.com}

# DESPUÉS:
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:https://tudominio.com,https://www.tudominio.com}
```

O configurar variable de entorno:
```bash
export CORS_ALLOWED_ORIGINS="https://tudominio.com,https://www.tudominio.com"
```

---

### 4. Frontend API URL
- [ ] **ACCIÓN REQUERIDA:** Configurar VITE_API_URL en `.env.prod`

**Archivo:** `.env.prod` línea 42

**Cambiar:**
```bash
# ANTES:
VITE_API_URL=https://CAMBIAR_POR_TU_DOMINIO/api

# DESPUÉS (ejemplos):
VITE_API_URL=https://api.tuclub.com/api
# o
VITE_API_URL=https://backend.tudominio.com/api
# o si backend y frontend están en mismo servidor:
VITE_API_URL=https://tudominio.com:8080/api
```

---

### 5. Base de Datos
- [x] Password de BD generado
- [ ] **ACCIÓN REQUERIDA:** Backup de base de datos configurado
- [ ] **ACCIÓN REQUERIDA:** Conexiones SSL habilitadas (recomendado)

**Password BD:** Configurado en `.env.prod` línea 16

**Configurar backups automáticos:**
```bash
# Crear directorio de backups
mkdir -p backups

# Agregar a crontab (backup diario a las 2 AM)
0 2 * * * docker exec club_postgres_prod pg_dump -U club_admin club_management > /ruta/backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql

# Backup manual
docker exec club_postgres_prod pg_dump -U club_admin club_management > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🟠 TAREAS IMPORTANTES - ALTAMENTE RECOMENDADAS

### 6. HTTPS/SSL
- [ ] **ACCIÓN REQUERIDA:** Certificado SSL configurado
- [ ] **ACCIÓN REQUERIDA:** Redirección HTTP → HTTPS activa

**Opciones:**
1. **Let's Encrypt (gratis):**
   ```bash
   # Usar Certbot
   sudo certbot --nginx -d tudominio.com -d www.tudominio.com
   ```

2. **Cloudflare (gratis):**
   - Configurar DNS en Cloudflare
   - Activar SSL/TLS mode "Full (strict)"

3. **Reverse Proxy (Nginx/Traefik):**
   - Configurar proxy con SSL termination

---

### 7. Logging y Monitoreo
- [ ] Logs de aplicación configurados
- [ ] Monitoreo de errores configurado (opcional: Sentry, LogRocket)
- [ ] Alertas de disco/CPU configuradas

**Verificar logs:**
```bash
# Ver logs de backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Ver logs de base de datos
docker-compose -f docker-compose.prod.yml logs -f postgres

# Logs persistentes (configurado en application.yml:129)
tail -f /app/logs/club-management.log
```

---

### 8. Límites de Rate Limiting
- [ ] Rate limiting configurado en API (recomendado)
- [ ] Protección contra brute force en login

**Opción 1: Nginx rate limiting**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20;
}
```

**Opción 2: Spring Boot (futuro)**
- Agregar dependencia `bucket4j`
- Configurar límites por endpoint

---

### 9. Backup Strategy
- [ ] Backups automáticos de BD configurados
- [ ] Backups de archivos/uploads configurados
- [ ] Estrategia de retención definida (30 días recomendado)
- [ ] Procedimiento de restore probado

**Script de backup completo:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup BD
docker exec club_postgres_prod pg_dump -U club_admin club_management > $BACKUP_DIR/db_$DATE.sql

# Backup archivos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./uploads

# Eliminar backups antiguos (>30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

---

## 🟡 TAREAS OPCIONALES - MEJORAS ADICIONALES

### 10. Performance
- [ ] Compresión Gzip/Brotli habilitada
- [ ] Cache de assets estáticos configurado
- [ ] CDN para assets (opcional)

### 11. Seguridad Adicional
- [ ] Headers de seguridad configurados (CSP, X-Frame-Options, etc.)
- [ ] Fail2ban configurado para proteger SSH
- [ ] Firewall configurado (solo puertos 80, 443, 22)

### 12. Monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Alertas de caída de servicio
- [ ] Dashboard de métricas (Grafana + Prometheus)

---

## 📋 COMANDOS DE DEPLOYMENT

### Pre-Deployment Checks

```bash
# 1. Verificar que no hay CORS inseguro
grep -r "@CrossOrigin" backend/src/
# Debe retornar: 0 resultados

# 2. Verificar que todos los @RequestBody tienen @Valid
grep -r "@RequestBody" backend/src/ | grep -v "@Valid"
# Debe retornar: 0 resultados

# 3. Verificar que .env.prod no está en git
git check-ignore .env.prod
# Debe retornar: .env.prod

# 4. Compilar backend
cd backend && ./mvnw clean package -DskipTests
# Debe retornar: BUILD SUCCESS

# 5. Compilar frontend
cd frontend && npm run build
# Debe retornar: sin errores

# 6. Verificar variables de entorno
cat .env.prod | grep -E "JWT_SECRET|VITE_API_URL|SPRING_PROFILES_ACTIVE"
# Verificar que todo está configurado correctamente
```

---

### Deployment a Producción

#### Opción 1: Docker Compose (Recomendado para VPS)

```bash
# 1. Clonar repositorio en servidor
git clone https://github.com/tu-usuario/club-management.git
cd club-management

# 2. Copiar archivo de entorno
cp .env.prod.example .env.prod
# Editar .env.prod con valores reales

# 3. Construir y levantar servicios
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Verificar que están corriendo
docker-compose -f docker-compose.prod.yml ps

# 5. Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# 6. Verificar migración V010 se ejecutó
docker exec -it club_postgres_prod psql -U club_admin -d club_management \
  -c "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

#### Opción 2: Railway.app

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto
railway init

# 4. Agregar servicio PostgreSQL
railway add

# 5. Configurar variables de entorno
railway variables set JWT_SECRET="<secret-generado>"
railway variables set SPRING_PROFILES_ACTIVE="prod"
railway variables set VITE_API_URL="https://tu-app.up.railway.app/api"

# 6. Desplegar
railway up
```

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### 1. Health Check
```bash
# Verificar backend
curl https://tudominio.com/actuator/health
# Debe retornar: {"status":"UP"}

# Verificar frontend
curl -I https://tudominio.com
# Debe retornar: 200 OK
```

### 2. Login Test
```bash
# Probar login con nueva contraseña
curl -X POST https://tudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ClubManagement2025!Secure#ProdPass"}'
# Debe retornar: JWT token
```

### 3. CORS Test
```bash
# Verificar CORS permite solo orígenes configurados
curl -H "Origin: https://malicioso.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://tudominio.com/api/eventos
# NO debe retornar Access-Control-Allow-Origin
```

### 4. Security Headers
```bash
# Verificar headers de seguridad
curl -I https://tudominio.com
# Verificar presencia de:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - Strict-Transport-Security: max-age=31536000
```

---

## ⚠️ LISTA DE VERIFICACIÓN FINAL

Antes de hacer público, confirmar:

### Seguridad
- [ ] ✅ Password admin cambiado (V010 ejecutada)
- [ ] ✅ JWT secret único en producción
- [ ] ✅ CORS configurado con dominios reales
- [ ] ✅ .env.prod NO está en git
- [ ] ✅ HTTPS/SSL habilitado
- [ ] Backups de BD configurados

### Configuración
- [ ] ✅ VITE_API_URL apunta a dominio real
- [ ] ✅ SPRING_PROFILES_ACTIVE=prod
- [ ] Logs de aplicación configurados
- [ ] Monitoring básico configurado

### Testing
- [ ] Login funciona con nueva password
- [ ] Frontend se conecta correctamente al backend
- [ ] Operaciones CRUD funcionan
- [ ] Exports PDF/Excel funcionan

### Documentación
- [ ] README.md actualizado con info de producción
- [ ] Credenciales guardadas en gestor de passwords
- [ ] Equipo informado del deployment

---

## 📞 CONTACTOS DE EMERGENCIA

**En caso de problemas:**
1. Revisar logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Rollback: `docker-compose -f docker-compose.prod.yml down && git checkout <version-anterior>`
3. Restore BD: `psql -U club_admin -d club_management < backups/ultimo_backup.sql`

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `DEPLOY.md` - Guía de deployment con Docker
- `RAILWAY_DEPLOY.md` - Deployment en Railway.app
- `TESTING.md` - Credenciales y guía de testing
- `SESION_OPTIMIZACION_2025-10-09.md` - Mejoras de seguridad aplicadas
- `TAREAS_OPTIMIZACION.md` - Tareas pendientes (27 restantes)

---

**Última actualización:** 2025-10-09
**Versión:** 0.1.0
**Estado:** ✅ LISTO PARA PRODUCCIÓN (después de completar checklist)
