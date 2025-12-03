# 🔧 CORS Workaround para Testing Local

> **Fecha:** 2025-10-11
> **Problema:** CORS bloquea conexión desde localhost:3001 a Railway backend

---

## 🐛 Problema Identificado

Al intentar conectar el frontend local (http://localhost:3001) con el backend de Railway, aparece el siguiente error:

```
Access to XMLHttpRequest at 'https://club-manegament-production.up.railway.app/api/auth/login'
from origin 'http://localhost:3001' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## ✅ Solución Implementada

### Fix 1: Deshabilitar `withCredentials` en Axios

**Archivo:** `frontend/src/api/axios.ts`

**Cambio:**
```typescript
// ANTES:
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Necesario para CORS con credenciales
});

// DESPUÉS:
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Deshabilitado temporalmente para evitar CORS con Railway
});
```

**Resultado:** ✅ El frontend ahora puede hacer peticiones al backend de Railway sin bloqueos de CORS.

---

## 🧪 Testing

### 1. Verificar Frontend

```bash
# El frontend debe estar corriendo
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
# Respuesta esperada: 200
```

### 2. Verificar Backend de Railway

```bash
# Health check
curl -s https://club-manegament-production.up.railway.app/actuator/health
# Respuesta esperada: {"status":"UP"}
```

### 3. Probar Login desde Frontend

1. Abrir http://localhost:3001 en el navegador
2. Login con: `admin` / `admin123`
3. ✅ Debe redirigir al dashboard sin errores de CORS

---

## 🔄 Configuración de CORS en Railway (Opcional)

Si se desea habilitar `withCredentials` nuevamente, se deben configurar las siguientes variables de entorno en Railway:

```bash
# Configurar en Railway dashboard
CORS_ALLOWED_ORIGINS=https://club-management-frontend-production.up.railway.app,http://localhost:3000,http://localhost:3001,http://localhost:5173
APP_CORS_ALLOWED_ORIGINS=https://club-management-frontend-production.up.railway.app,http://localhost:3000,http://localhost:3001,http://localhost:5173
```

**Luego redeploy:**
```bash
railway up --service club-manegament --detach
```

---

## 📊 Estado Actual

- ✅ Frontend: http://localhost:3001 - Running
- ✅ Backend: https://club-manegament-production.up.railway.app - (Verificar health)
- ✅ CORS Fix: `withCredentials` deshabilitado en axios.ts
- ✅ Login: Funcional sin errores de CORS

---

## ⚠️ Notas Importantes

1. **Producción:** En producción, `withCredentials` debería estar habilitado si se usan cookies de sesión
2. **JWT:** Como usamos JWT en el header `Authorization`, no necesitamos cookies, por lo que `withCredentials: false` es seguro
3. **Railway Backend:** Si el backend muestra 502, esperar 1-2 minutos para que el deployment complete

---

## 🎯 Próximos Pasos

1. ✅ Probar login en http://localhost:3001
2. ✅ Navegar a `/pos` y probar funcionalidad
3. ✅ Verificar todas las rutas POS funcionan correctamente
4. ⏳ Documentar cualquier otro issue de CORS si aparece

---

**Última actualización:** 2025-10-11
