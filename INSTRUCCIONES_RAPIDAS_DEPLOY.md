# 🚀 Instrucciones Rápidas de Despliegue

## ✅ YA ESTÁ LISTO

Todo el código está preparado y commiteado. Solo necesitas seguir estos pasos:

---

## 📋 PASO 1: Subir a GitHub (5 minutos)

### 1. Crear repositorio en GitHub

1. Ir a: https://github.com/new
2. **Nombre**: `club-management`
3. **Visibilidad**: PRIVADO ⚠️ (importante por seguridad)
4. **NO** marcar "Add README" ni "Add .gitignore"
5. Clic en **"Create repository"**

### 2. Conectar y subir código

GitHub te mostrará comandos. Usa estos:

```bash
cd D:\club-management

# Agregar repositorio remoto (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/club-management.git

# Subir código
git push -u origin main
```

Si pide usuario y contraseña, usa:
- **Usuario**: Tu usuario de GitHub
- **Contraseña**: Personal Access Token (crear en https://github.com/settings/tokens si no tienes)

---

## 📋 PASO 2: Desplegar Backend en Railway (10 minutos)

### 1. Crear cuenta Railway

1. Ir a: https://railway.app
2. Clic en **"Login"** o **"Start a New Project"**
3. **Login con GitHub** (recomendado)
4. Autorizar a Railway

### 2. Crear proyecto PostgreSQL + Backend

1. Clic en **"New Project"**
2. Seleccionar **"Provision PostgreSQL"**
3. Esperar a que se cree la base de datos
4. En el mismo proyecto, clic en **"+ New"**
5. Seleccionar **"GitHub Repo"**
6. Buscar y seleccionar **`club-management`**

### 3. Configurar variables del Backend

1. Clic en tu servicio **backend** (no postgres)
2. Ir a **"Variables"** tab
3. Agregar estas variables:

```bash
SPRING_PROFILES_ACTIVE=prod

# Database (usa variables de Railway)
DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# JWT (copiar de .env.prod)
JWT_SECRET=K9sDTEHpDcJNWIQ1r+mkYL/zEF1uY5TfiW2jivduutPQ7ytu4Q56dCSqcNPrsbtktNG8V5Js1UdNpSkhLmDI3A==
JWT_EXPIRATION=86400000

# CORS (actualizar luego con URL del frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Configurar Build del Backend

1. Ir a **"Settings"** del servicio backend
2. **"Build"** section:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Root Directory**: `/`

3. Clic en **"Deploy"**

### 5. Obtener URL del Backend

1. Esperar a que termine el deploy (~5-10 min)
2. Ir a **"Settings"** → **"Networking"**
3. Clic en **"Generate Domain"**
4. **Copiar la URL**: ejemplo `https://club-backend-production-abc123.up.railway.app`

### 6. Verificar Backend

Abrir en navegador:
```
https://TU-URL-BACKEND.up.railway.app/actuator/health
```

Debería mostrar: `{"status":"UP"}`

---

## 📋 PASO 3: Desplegar Frontend en Railway (5 minutos)

### 1. Agregar servicio Frontend

1. En el mismo proyecto Railway, clic en **"+ New"**
2. Seleccionar **"GitHub Repo"**
3. Seleccionar el mismo repo **`club-management`**

### 2. Configurar variables del Frontend

1. Clic en el servicio **frontend**
2. **"Variables"** tab:

```bash
# Usar URL del backend del paso anterior
VITE_API_URL=https://TU-URL-BACKEND.up.railway.app/api
```

### 3. Configurar Build del Frontend

1. **"Settings"** → **"Build"**:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `frontend/Dockerfile`
   - **Root Directory**: `/`

2. En **"Build"** → **"Build Arguments"**:
   ```
   VITE_API_URL=${{VITE_API_URL}}
   ```

3. Clic en **"Deploy"**

### 4. Obtener URL del Frontend

1. Esperar a que termine (~3-5 min)
2. **"Settings"** → **"Networking"**
3. Clic en **"Generate Domain"**
4. **Copiar URL**: ejemplo `https://club-frontend-xyz789.up.railway.app`

---

## 📋 PASO 4: Actualizar CORS (2 minutos)

Ahora que tienes la URL del frontend, actualiza el CORS del backend:

1. Ir al servicio **backend** en Railway
2. **"Variables"** tab
3. Cambiar `CORS_ALLOWED_ORIGINS`:

```bash
CORS_ALLOWED_ORIGINS=https://TU-URL-FRONTEND.up.railway.app
```

4. Railway re-desplegará automáticamente

---

## ✅ VERIFICACIÓN FINAL

### 1. Abrir tu aplicación

```
https://TU-URL-FRONTEND.up.railway.app
```

### 2. Login

- **Usuario**: `admin`
- **Password**: `admin123`

### 3. Verificar Dashboard

- Debe cargar datos reales
- Auto-refresh cada 30 segundos
- No debe haber errores de CORS

---

## 🔐 IMPORTANTE: Cambiar Contraseña Admin

**INMEDIATAMENTE** después de verificar que funciona:

1. Login como admin
2. Ir a **"Configuración"** → **"Usuarios"**
3. Editar usuario **admin**
4. Cambiar contraseña a algo seguro

---

## 💰 Costos

- **Railway Plan Gratuito**: $5 USD crédito/mes
- Tu aplicación usará ~$2-3/mes
- **TOTALMENTE GRATIS** para uso normal

---

## 📞 Problemas?

### Error CORS
- Verificar que `CORS_ALLOWED_ORIGINS` tenga la URL correcta del frontend
- Incluir `https://`, no solo el dominio

### Backend no conecta a base de datos
- Verificar que las variables `DB_*` usen `${{Postgres.*}}`
- Ver logs en Railway: servicio → "Deployments" → "View Logs"

### Frontend muestra "Network Error"
- Verificar que `VITE_API_URL` apunte al backend correcto
- Debe terminar en `/api`

---

## 🎉 URLs FINALES

Cuando termines, tendrás:

```
✅ Frontend: https://club-frontend-xyz.up.railway.app
✅ Backend:  https://club-backend-abc.up.railway.app
✅ Swagger:  https://club-backend-abc.up.railway.app/swagger-ui/index.html
```

---

## 📚 Documentación Completa

Ver `RAILWAY_DEPLOY.md` para la guía detallada paso a paso.

---

**Estado Actual**: ✅ Código listo y commiteado
**Siguiente Paso**: Crear repositorio en GitHub

🚀 **Tu aplicación estará en internet en ~25 minutos!**
