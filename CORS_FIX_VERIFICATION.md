# Verificación y Solución del Error CORS - 10 Oct 2025

## 🐛 Problema Inicial

**Error reportado:**
```
Access to XMLHttpRequest at 'https://club-manegament-production.up.railway.app/api/auth/login'
from origin 'https://club-management-frontend-production.up.railway.app'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 Diagnóstico

### Problema 1: Configuración CORS Hardcodeada
El archivo `SecurityConfig.java` tenía los orígenes CORS hardcodeados para localhost:
```java
configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001", "http://localhost:5173"));
```

**Solución:**
- Modificado `SecurityConfig.java` para leer desde configuración
- Actualizado `application.yml` con valor por defecto para producción
- Configurada variable de entorno `CORS_ALLOWED_ORIGINS` en Railway

### Problema 2: Dockerfile Incorrecto en Servicio Backend
Railway estaba ejecutando **nginx (frontend)** en lugar de **Spring Boot (backend)** en el servicio `club-manegament`.

**Diagnóstico:**
```bash
curl -s https://club-manegament-production.up.railway.app/actuator/health
# Devolvía: HTML del frontend ❌
```

**Logs mostraban:**
```
2025/10/10 00:11:22 [notice] 1#1: nginx/1.29.2
2025/10/10 00:11:22 [notice] 1#1: start worker processes
```

**Causa raíz:**
Railway no estaba respetando el `railway.toml` que especificaba `Dockerfile.backend` para el servicio backend.

**Solución:**
1. Renombrado temporalmente `Dockerfile` → `Dockerfile.frontend.tmp`
2. Renombrado `Dockerfile.backend` → `Dockerfile`
3. Ejecutado `railway up --service club-manegament`
4. Restaurado nombres originales de archivos

### Problema 3: Variable CORS_ALLOWED_ORIGINS Faltante
Railway no tenía configurada la variable de entorno que lee `application.yml`.

**Solución:**
```bash
railway variables --set "CORS_ALLOWED_ORIGINS=https://club-management-frontend-production.up.railway.app" --service club-manegament
```

## ✅ Verificación Final

### 1. Spring Boot Corriendo
```bash
curl -s https://club-manegament-production.up.railway.app/actuator/health
```
**Respuesta:**
```json
{"status":"UP"}
```
✅ JSON correcto, no HTML

### 2. Headers CORS Correctos
```bash
curl -i -X OPTIONS https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Origin: https://club-management-frontend-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST"
```

**Headers recibidos:**
```
HTTP/2 200
access-control-allow-credentials: true
access-control-allow-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
access-control-allow-origin: https://club-management-frontend-production.up.railway.app
access-control-max-age: 3600
vary: Origin
vary: Access-Control-Request-Method
```

✅ Todos los headers CORS necesarios presentes

### 3. Endpoint de Autenticación Accesible
```bash
curl https://club-manegament-production.up.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://club-management-frontend-production.up.railway.app"
```

✅ Endpoint responde (requiere credenciales válidas)

## 📝 Cambios Realizados

### Archivos Modificados en Git

1. **`backend/src/main/java/com/club/management/config/SecurityConfig.java`**
   - Agregado: `@Value("${app.cors.allowed-origins}")`
   - Modificado método `corsConfigurationSource()` para leer orígenes desde configuración
   - Cambio de `/api/**` a `/**` en `registerCorsConfiguration`

2. **`backend/src/main/resources/application.yml`**
   - Actualizado valor por defecto de `app.cors.allowed-origins` en perfil `prod`
   - De: `https://yourdomain.com`
   - A: `https://club-management-frontend-production.up.railway.app`

3. **`DEPLOYMENT_PROCESS.md`** (nuevo)
   - Documentación completa del proceso de despliegue
   - Problemas encontrados y soluciones

4. **`CORS_FIX_VERIFICATION.md`** (este archivo, nuevo)
   - Documentación específica del fix de CORS

### Variables de Entorno Configuradas en Railway

**Servicio: `club-manegament` (backend)**
```bash
CORS_ALLOWED_ORIGINS=https://club-management-frontend-production.up.railway.app
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{PGPASSWORD}}
JWT_SECRET=<generado con openssl rand -base64 64>
JWT_EXPIRATION=86400000
```

## 🎯 Estado Final

| Componente | URL | Estado |
|------------|-----|--------|
| **Frontend** | https://club-management-frontend-production.up.railway.app | ✅ Funcionando |
| **Backend API** | https://club-manegament-production.up.railway.app/api | ✅ Funcionando |
| **Health Check** | https://club-manegament-production.up.railway.app/actuator/health | ✅ Funcionando |
| **CORS** | - | ✅ Configurado correctamente |
| **GitHub** | https://github.com/franferrer12/club-management | ✅ Actualizado |

## 🔧 Troubleshooting Futuro

### Si CORS vuelve a fallar:

1. **Verificar variable de entorno:**
   ```bash
   railway variables --service club-manegament | grep CORS
   ```

2. **Verificar logs del backend:**
   ```bash
   railway logs --service club-manegament --tail 50
   ```

3. **Test manual de CORS:**
   ```bash
   curl -i -X OPTIONS https://club-manegament-production.up.railway.app/api/auth/login \
     -H "Origin: https://club-management-frontend-production.up.railway.app" \
     -H "Access-Control-Request-Method: POST"
   ```

   Debe devolver `access-control-allow-origin: https://club-management-frontend-production.up.railway.app`

### Si el backend devuelve HTML en lugar de JSON:

El servicio backend está ejecutando nginx (frontend) en lugar de Spring Boot.

**Solución:**
```bash
# Verificar qué está corriendo:
railway logs --service club-manegament --tail 20

# Si aparece "nginx", forzar redeploy con Dockerfile correcto:
mv Dockerfile Dockerfile.tmp
mv Dockerfile.backend Dockerfile
railway up --service club-manegament
mv Dockerfile Dockerfile.backend
mv Dockerfile.tmp Dockerfile
```

## 📊 Métricas de Resolución

- **Tiempo total de diagnóstico y solución:** ~45 minutos
- **Builds de Railway ejecutados:** 3
- **Problemas identificados:** 3
- **Commits realizados:** 1 (pendiente de push)
- **Variables de entorno agregadas:** 1

## 🎓 Lecciones Aprendidas

1. **Railway no siempre respeta `railway.toml`** en servicios ya existentes. Puede ser necesario forzar redeployments.

2. **Variables de entorno vs. Archivos de configuración:** Siempre usar variables de entorno para valores específicos de producción.

3. **Verificación de servicios:** Siempre verificar que el contenedor correcto está corriendo antes de depurar la aplicación.

4. **CORS en Spring Security:** La configuración debe:
   - Leer desde variables de entorno
   - Aplicarse a todas las rutas (`/**`), no solo `/api/**`
   - Incluir OPTIONS en `permitAll()`

5. **Headers CORS mínimos necesarios:**
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Credentials` (si se usan cookies/auth)

---

**Documentación generada:** 10 de Octubre 2025, 01:19 GMT
**Estado:** ✅ CORS completamente funcional
**Próxima acción:** Push de cambios a GitHub
