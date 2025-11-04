# Guía de Inicio Rápido - Intra Media System

Esta guía te ayudará a configurar y ejecutar el sistema completo en tu máquina local.

## Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** 18 o superior → [Descargar](https://nodejs.org/)
- **PostgreSQL** 15 o superior → [Descargar](https://www.postgresql.org/download/)
- **Git** (opcional) → [Descargar](https://git-scm.com/)

## Paso 1: Configurar la Base de Datos

### 1.1 Crear la base de datos

Abre tu terminal y ejecuta:

```bash
# Crear la base de datos
createdb intra_media_system

# O si tienes problemas, usa psql:
psql -U postgres -c "CREATE DATABASE intra_media_system;"
```

### 1.2 Ejecutar las migraciones

```bash
cd database
psql -U postgres -d intra_media_system -f schema.sql
```

Deberías ver mensajes de creación de tablas exitosa.

## Paso 2: Configurar el Backend

### 2.1 Instalar dependencias

```bash
cd backend
npm install
```

### 2.2 Configurar variables de entorno

Crea un archivo `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

```env
PORT=3000
NODE_ENV=development

# Ajusta estos valores según tu configuración de PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intra_media_system
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres

# Genera un secreto aleatorio (puedes usar: openssl rand -base64 32)
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio

FRONTEND_URL=http://localhost:5173
```

### 2.3 Migrar datos desde Excel (Opcional)

Si quieres importar tus datos existentes del Excel:

```bash
npm run migrate:excel
```

Este comando:
- Lee el archivo `ORIGINAL.xlsx`
- Crea DJs y clientes automáticamente
- Importa todos los eventos

### 2.4 Iniciar el servidor backend

```bash
npm run dev
```

Deberías ver:

```
✅ Conexión a PostgreSQL exitosa
🚀 Intra Media System API
🌐 Servidor corriendo en: http://localhost:3000
```

## Paso 3: Configurar el Frontend

Abre una **nueva terminal** (deja el backend corriendo).

### 3.1 Instalar dependencias

```bash
cd frontend
npm install
```

### 3.2 Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` debería contener:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3.3 Iniciar el servidor frontend

```bash
npm run dev
```

Deberías ver:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Paso 4: Acceder al Sistema

Abre tu navegador en:

**http://localhost:5173**

Verás el dashboard del sistema con:
- Dashboard con estadísticas
- Gestión de eventos
- Gestión de DJs
- Gestión de clientes
- Control de nóminas

## Verificación del Sistema

### Health Check del Backend

Verifica que el backend funcione correctamente:

```bash
curl http://localhost:3000/health
```

Deberías ver:

```json
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-..."
}
```

### Verificar API de Eventos

```bash
curl http://localhost:3000/api/eventos
```

Deberías ver una lista de eventos (o un array vacío si no has migrado datos).

## Comandos Útiles

### Backend

```bash
npm run dev      # Modo desarrollo con auto-reload
npm start        # Modo producción
npm run migrate:excel  # Importar datos del Excel
```

### Frontend

```bash
npm run dev      # Modo desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
```

### Base de datos

```bash
# Conectar a PostgreSQL
psql -U postgres -d intra_media_system

# Ver tablas
\dt

# Ver datos de eventos
SELECT * FROM eventos LIMIT 5;

# Ver DJs
SELECT * FROM djs;

# Borrar todos los datos (¡CUIDADO!)
TRUNCATE eventos, djs, clientes RESTART IDENTITY CASCADE;
```

## Problemas Comunes

### El backend no conecta a PostgreSQL

**Error:** `Connection refused` o `ECONNREFUSED`

**Solución:**
1. Verifica que PostgreSQL esté corriendo: `pg_isready`
2. Verifica usuario y contraseña en `.env`
3. Verifica que el puerto sea el correcto (por defecto 5432)

### Puerto 3000 o 5173 ya en uso

**Error:** `EADDRINUSE`

**Solución:**
```bash
# Cambiar puerto en backend/.env
PORT=3001

# O matar el proceso que usa el puerto
lsof -ti:3000 | xargs kill -9
```

### Errores de migración de Excel

**Error:** Al ejecutar `npm run migrate:excel`

**Solución:**
1. Verifica que `ORIGINAL.xlsx` esté en la raíz del proyecto
2. Verifica que las columnas en el Excel coincidan con las esperadas
3. Revisa los logs para ver qué filas tienen errores

### No se ven datos en el frontend

**Posibles causas:**
1. El backend no está corriendo
2. La URL de la API es incorrecta (revisa `frontend/.env`)
3. No hay datos en la base de datos (ejecuta la migración)

## Próximos Pasos

Una vez que tengas todo funcionando:

1. **Explora el sistema**: Navega por todas las páginas
2. **Migra tus datos**: Ejecuta `npm run migrate:excel`
3. **Personaliza**: Ajusta colores, textos, etc.
4. **Añade funcionalidades**: Consulta la documentación de desarrollo

## Soporte

Si tienes problemas:

1. Revisa los logs del terminal (backend y frontend)
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que PostgreSQL esté corriendo
4. Consulta la documentación en `/docs`

## Comandos de Verificación Rápida

```bash
# ¿Está PostgreSQL corriendo?
pg_isready

# ¿Qué versión de Node tengo?
node --version  # Debe ser >= 18

# ¿Existen las tablas en la DB?
psql -U postgres -d intra_media_system -c "\dt"

# ¿Funciona el backend?
curl http://localhost:3000/health

# ¿Funciona la API?
curl http://localhost:3000/api/eventos
```

¡Listo! Ya tienes el sistema funcionando. 🚀
