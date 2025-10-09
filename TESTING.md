# 🧪 Guía de Testing - Club Management System

## ✅ Lo que tenemos hasta ahora

### Backend Completado:
- ✅ Entidades: Usuario y Evento
- ✅ Repositorios con queries personalizadas
- ✅ Autenticación JWT completa
- ✅ Spring Security configurado
- ✅ Endpoints de autenticación funcionando
- ✅ 2 migraciones de base de datos

### Migraciones de Base de Datos:
- ✅ V001: Usuarios, Categorías, Proveedores (con usuario admin)
- ✅ V002: Eventos (con 3 eventos de prueba)

---

## 🚀 Cómo Probar el Proyecto

### Opción 1: Con Docker (Recomendado)

#### 1. Verificar Docker instalado:
```bash
docker --version
docker-compose --version
```

#### 2. Levantar servicios:
```bash
cd D:\club-management

# Levantar todo (PostgreSQL + Backend + Frontend)
docker-compose up -d

# Ver logs
docker-compose logs -f

# O solo PostgreSQL para desarrollo local
docker-compose up -d postgres
```

#### 3. Verificar servicios:
```bash
# Ver contenedores corriendo
docker ps

# Verificar PostgreSQL
docker exec -it club_postgres psql -U club_admin -d club_management

# En psql, verificar tablas:
\dt
SELECT * FROM usuarios;
SELECT * FROM eventos;
\q
```

---

### Opción 2: Sin Docker (Desarrollo Local)

#### 1. Instalar dependencias:

**Java 17+**
- Descargar de: https://adoptium.net/
- Verificar: `java -version`

**PostgreSQL 15+**
- Descargar de: https://www.postgresql.org/download/
- Crear base de datos:
```sql
CREATE DATABASE club_management;
CREATE USER club_admin WITH PASSWORD 'club_password';
GRANT ALL PRIVILEGES ON DATABASE club_management TO club_admin;
```

**Maven 3.9+**
- Descargar de: https://maven.apache.org/download.cgi
- Agregar al PATH
- Verificar: `mvn --version`

**Node.js 18+**
- Descargar de: https://nodejs.org/
- Verificar: `node --version` y `npm --version`

#### 2. Configurar variables de entorno:

Editar el archivo `.env` si es necesario:
```bash
# Ya existe con valores por defecto
DB_PASSWORD=club_password
JWT_SECRET=club-management-secret-key-2025...
SPRING_PROFILES_ACTIVE=dev
```

#### 3. Compilar y ejecutar Backend:

```bash
cd D:\club-management\backend

# Compilar
mvn clean install

# Ejecutar
mvn spring-boot:run

# O ejecutar el JAR
java -jar target/club-management-0.0.1-SNAPSHOT.jar
```

El backend estará en: **http://localhost:8080**

#### 4. Instalar y ejecutar Frontend:

```bash
cd D:\club-management\frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

El frontend estará en: **http://localhost:3000** o **http://localhost:5173**

---

## 🔍 Verificar que Todo Funciona

### 1. Backend Health Check
```bash
# Verificar que el backend está corriendo
curl http://localhost:8080/actuator/health

# Debería retornar:
{"status":"UP"}
```

### 2. Swagger UI (Documentación API)
Abrir en navegador: **http://localhost:8080/swagger-ui/index.html**

Deberías ver todos los endpoints documentados.

### 3. Probar Login (Endpoint Público)

**Con curl:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "username": "admin",
  "email": "admin@clubmanagement.com",
  "rol": "ADMIN"
}
```

**Con Postman/Insomnia:**
- Method: POST
- URL: `http://localhost:8080/api/auth/login`
- Body (JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 4. Probar Endpoint Protegido

**Obtener usuario actual (requiere token):**
```bash
# Reemplaza <TOKEN> con el token obtenido del login
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@clubmanagement.com",
  "rol": "ADMIN",
  "activo": true,
  "ultimoAcceso": "2025-01-06T10:30:00",
  "creadoEn": "2025-01-06T08:00:00"
}
```

### 5. Verificar Base de Datos

**Conectarse a PostgreSQL:**
```bash
# Con Docker
docker exec -it club_postgres psql -U club_admin -d club_management

# Sin Docker
psql -U club_admin -d club_management -h localhost
```

**Queries de verificación:**
```sql
-- Ver todas las tablas
\dt

-- Ver usuarios
SELECT id, username, email, rol, activo FROM usuarios;

-- Ver eventos
SELECT id, nombre, fecha, tipo, estado FROM eventos;

-- Ver migraciones aplicadas
SELECT * FROM flyway_schema_history;
```

---

## ✅ Checklist de Verificación

### Backend
- [ ] Backend compila sin errores (`mvn clean install`)
- [ ] Backend arranca sin errores
- [ ] Migraciones de Flyway se aplican correctamente
- [ ] Endpoint `/actuator/health` retorna `{"status":"UP"}`
- [ ] Swagger UI se ve correctamente
- [ ] Login funciona con admin/admin123
- [ ] Se genera un token JWT válido
- [ ] Endpoint `/api/auth/me` funciona con token

### Base de Datos
- [ ] PostgreSQL está corriendo
- [ ] Base de datos `club_management` existe
- [ ] Tabla `usuarios` tiene el usuario admin
- [ ] Tabla `eventos` tiene 3 eventos de prueba
- [ ] Tabla `categorias_producto` tiene 15 categorías
- [ ] Tabla `proveedores` está vacía pero existe

### Frontend (opcional por ahora)
- [ ] Frontend compila sin errores (`npm install`)
- [ ] Frontend arranca sin errores (`npm run dev`)
- [ ] Se ve la página de bienvenida

---

## 🐛 Troubleshooting

### Error: "Connection refused" al arrancar backend
**Causa:** PostgreSQL no está corriendo
**Solución:**
```bash
# Con Docker
docker-compose up -d postgres

# Sin Docker, iniciar servicio PostgreSQL
# Windows: Servicios > PostgreSQL > Iniciar
# Linux: sudo systemctl start postgresql
```

### Error: "Table 'usuarios' doesn't exist"
**Causa:** Flyway no ejecutó las migraciones
**Solución:**
1. Verificar en logs que Flyway se ejecutó
2. Ver tabla `flyway_schema_history` en BD
3. Si no existe, las migraciones no corrieron
4. Verificar conexión a BD en `application.yml`

### Error: "Invalid JWT signature"
**Causa:** El secret de JWT cambió o no coincide
**Solución:**
1. Verificar que `.env` existe con `JWT_SECRET`
2. Verificar que `application.yml` lee `${JWT_SECRET}`
3. Reiniciar backend

### Error: "Port 8080 already in use"
**Causa:** Otro proceso está usando el puerto
**Solución:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

---

## 📊 Endpoints Disponibles

### Públicos (sin autenticación):
- `POST /api/auth/login` - Login
- `GET /actuator/health` - Health check
- `GET /swagger-ui/index.html` - Documentación API

### Protegidos (requieren token JWT):
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/refresh` - Refrescar token

### Próximamente (en desarrollo):
- `GET /api/eventos` - Listar eventos
- `POST /api/eventos` - Crear evento
- `GET /api/eventos/{id}` - Ver detalle
- `PUT /api/eventos/{id}` - Actualizar evento
- `DELETE /api/eventos/{id}` - Eliminar evento

---

## 🎯 Estado Actual del Proyecto

```
✅ Fase 0: Setup Inicial (100%)
✅ Semana 2: Autenticación JWT (100%)
⏳ Semana 2: Módulo Eventos (60%)
  ✅ Entidad Evento
  ✅ EventoRepository
  ✅ Migración V002
  ⏳ EventoService (pendiente)
  ⏳ EventoController (pendiente)
```

**Próximos pasos:** Completar EventoService y EventoController

---

## 📝 Credenciales de Prueba

### Usuario Admin (pre-creado en V001):
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@clubmanagement.com`
- **Rol:** `ADMIN`

⚠️ **IMPORTANTE:** Cambiar la contraseña en producción

---

## 🔗 URLs Útiles

- **Backend API:** http://localhost:8080
- **Swagger UI:** http://localhost:8080/swagger-ui/index.html
- **Actuator Health:** http://localhost:8080/actuator/health
- **Frontend:** http://localhost:3000 (cuando esté corriendo)
- **PostgreSQL:** localhost:5432

---

**Última actualización:** 2025-01-06
**Versión:** 0.0.2 - Autenticación JWT funcionando
