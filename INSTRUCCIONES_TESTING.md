# 🚀 Instrucciones para Testing Local del Sistema POS

## ✅ Todo Listo para Testear

He preparado todo el entorno para que puedas testear el sistema POS completo en tu máquina local.

---

## 📋 Opción 1: Inicio Automático (MÁS FÁCIL)

### Paso Único

```bash
cd /Users/franferrer/workspace/club-management
./start-local.sh
```

**Qué hace el script**:
1. ✅ Levanta PostgreSQL en Docker
2. ✅ Compila el backend (con código POS)
3. ✅ Aplica migración V019 automáticamente
4. ✅ Inicia Spring Boot en http://localhost:8080
5. ✅ Inicia React en http://localhost:5173
6. ✅ Ejecuta tests automáticos de API
7. ✅ Te muestra todas las URLs

**Tiempo**: 2-3 minutos

**Al finalizar verás**:
```
✅ Sistema LOCAL iniciado correctamente

📍 URLs:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:8080
   Dashboard: http://localhost:5173/pos-dashboard

🔑 Credenciales:
   Usuario: admin
   Password: admin123
```

**Para detener**: Presiona `Ctrl+C`

---

## 📋 Opción 2: Paso a Paso Manual

### 1. Levantar PostgreSQL

```bash
cd /Users/franferrer/workspace/club-management
docker-compose up -d postgres
```

### 2. Levantar Backend

```bash
cd backend

# Exportar variables de entorno
export SPRING_PROFILES_ACTIVE=dev
export DB_URL=jdbc:postgresql://localhost:5432/club_management
export DB_USER=club_admin
export DB_PASSWORD=club_admin_password
export JWT_SECRET=mi-secreto-super-seguro-para-desarrollo-local-con-256-bits-minimo

# Iniciar Spring Boot
mvn spring-boot:run
# O si tienes ./mvnw
./mvnw spring-boot:run
```

**Espera a ver**: `Started ClubManagementApplication`

### 3. Levantar Frontend (nueva terminal)

```bash
cd frontend
npm run dev
```

**Abre**: http://localhost:5173

---

## 🧪 Cómo Testear

### Test Rápido (5 minutos)

1. **Login**
   - Ir a: http://localhost:5173/login
   - Usuario: `admin`
   - Password: `admin123`

2. **Dashboard POS**
   - Ir a: http://localhost:5173/pos-dashboard
   - Debe cargar sin errores
   - Debe mostrar KPIs en 0 (si no hay datos)

3. **API Manual** (en terminal)
   ```bash
   # Login
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'

   # Copiar el token que devuelve
   TOKEN="eyJhbGci..."

   # Abrir caja
   curl -X POST http://localhost:8080/api/pos/sesiones-caja/abrir \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "nombreCaja": "Barra Test",
       "empleadoAperturaId": 1,
       "montoInicial": 100.00
     }'
   ```

4. **Verificar en Dashboard**
   - Refrescar http://localhost:5173/pos-dashboard
   - Debe aparecer "Barra Test" en cajas abiertas

### Test Completo (30 minutos)

Sigue el archivo `TESTING_LOCAL.md` que incluye:
- ✅ 7 tests de API
- ✅ 4 tests de triggers
- ✅ Checklist completo de frontend

---

## 🔍 Verificar que Todo Funciona

### 1. Backend Corriendo ✅

```bash
curl http://localhost:8080/actuator/health
```

**Respuesta esperada**: `{"status":"UP"}`

### 2. Migración V019 Aplicada ✅

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
SELECT version, description
FROM flyway_schema_history
WHERE version = '019';
"
```

**Respuesta esperada**:
```
version |    description
--------|------------------
019     | create pos tables
```

### 3. Tablas POS Creadas ✅

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
\dt sesiones_caja ventas detalle_venta
"
```

**Respuesta esperada**: Lista de 3 tablas

### 4. Endpoints POS Disponibles ✅

```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Probar endpoint
curl -s http://localhost:8080/api/pos/estadisticas/hoy \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada**: JSON con estadísticas

### 5. Frontend Accesible ✅

```bash
curl -s http://localhost:5173 | grep "<title>"
```

**Respuesta esperada**: `<title>Club Management</title>`

---

## 📊 Qué Testear en el Dashboard

### Funcionalidades Principales

1. **KPIs en Tiempo Real**
   - [ ] Total Ingresos se actualiza
   - [ ] Total Ventas incrementa
   - [ ] Ticket Promedio calcula correctamente
   - [ ] Unidades Vendidas suma bien

2. **Auto-refresh (30 segundos)**
   - [ ] Aparece "(actualizando...)" cada 30s
   - [ ] Datos se refrescan automáticamente
   - [ ] No hay flickering molesto

3. **Filtros de Periodo**
   - [ ] Botón "Hoy" muestra datos de hoy
   - [ ] Botón "7 Días" cambia a semana
   - [ ] Botón "30 Días" cambia a mes
   - [ ] Datos cambian al cambiar filtro

4. **Sesiones Abiertas**
   - [ ] Muestra cajas abiertas en tiempo real
   - [ ] Muestra cajero responsable
   - [ ] Muestra hora de apertura
   - [ ] Muestra ventas e ingresos acumulados

5. **Gráficos**
   - [ ] Pie chart de métodos de pago renderiza
   - [ ] Bar chart de ventas por hora (solo "Hoy")
   - [ ] Top 5 productos con medallas

6. **Responsive**
   - [ ] Se ve bien en pantalla completa
   - [ ] Se ve bien en ventana pequeña (simular móvil)

---

## 🐛 Si Algo Falla

### Logs para Revisar

```bash
# Backend
tail -f /tmp/backend-run.log

# Frontend
tail -f /tmp/frontend-run.log

# PostgreSQL
docker-compose logs postgres
```

### Comandos Útiles

```bash
# Ver procesos corriendo
ps aux | grep java
ps aux | grep vite

# Ver puertos en uso
lsof -i :8080  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL

# Detener todo
pkill -f spring-boot
pkill -f vite
docker-compose down
```

### Problemas Comunes

1. **Puerto 8080 ocupado**
   ```bash
   lsof -i :8080
   kill -9 [PID]
   ```

2. **PostgreSQL no conecta**
   ```bash
   docker-compose down
   docker-compose up -d postgres
   ```

3. **Backend no compila**
   ```bash
   cd backend
   mvn clean install
   ```

4. **Frontend da error**
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

## ✅ Checklist de Testing Mínimo

Antes de dar por válido el sistema, verifica:

### Backend
- [ ] Backend inicia sin errores
- [ ] Migración V019 aplicada
- [ ] Login funciona
- [ ] Puede abrir sesión de caja
- [ ] Puede crear venta
- [ ] Stock se descuenta automáticamente
- [ ] Transacción financiera se crea

### Frontend
- [ ] Dashboard carga sin errores de consola (F12)
- [ ] KPIs se muestran correctamente
- [ ] Sesiones abiertas aparecen
- [ ] Auto-refresh funciona
- [ ] Gráficos renderizan

### Integración
- [ ] Abrir caja → aparece en dashboard
- [ ] Crear venta → actualiza estadísticas
- [ ] Cerrar caja → diferencia se calcula

---

## 🎯 Escenario de Prueba Completo

### Simula una Noche en el Club

```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Abrir Barra Principal
SESION1=$(curl -s -X POST http://localhost:8080/api/pos/sesiones-caja/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombreCaja":"Barra Principal","empleadoAperturaId":1,"montoInicial":200.00}' | grep -o '"id":[0-9]*' | cut -d: -f2)

# 3. Abrir Barra VIP
SESION2=$(curl -s -X POST http://localhost:8080/api/pos/sesiones-caja/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombreCaja":"Barra VIP","empleadoAperturaId":1,"montoInicial":300.00}' | grep -o '"id":[0-9]*' | cut -d: -f2)

# 4. Crear varias ventas
for i in {1..5}; do
  curl -s -X POST http://localhost:8080/api/pos/ventas \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"sesionCajaId\":$SESION1,\"empleadoId\":1,\"metodoPago\":\"EFECTIVO\",\"montoEfectivo\":20.00,\"detalles\":[{\"productoId\":1,\"cantidad\":2}]}"
  sleep 1
done

# 5. Verificar en dashboard
echo "Abre: http://localhost:5173/pos-dashboard"
echo "Deberías ver:"
echo "  - 2 cajas abiertas"
echo "  - 5 ventas"
echo "  - €100 en ingresos"

# 6. Cerrar Barra Principal
curl -s -X POST http://localhost:8080/api/pos/sesiones-caja/$SESION1/cerrar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"empleadoCierreId":1,"montoReal":300.00}'

echo "✅ Escenario completado"
```

---

## 📞 Próximos Pasos Después del Testing

### Si Todo Funciona ✅

1. **Detener local**
   ```bash
   # Presiona Ctrl+C en terminal del script
   # O manualmente:
   pkill -f spring-boot
   pkill -f vite
   docker-compose down
   ```

2. **Desplegar a producción**
   ```bash
   cd backend
   railway up

   cd ../frontend
   npm run build
   # Desplegar dist/ a tu hosting
   ```

### Si Hay Errores ❌

1. Anota qué falló
2. Revisa logs: `/tmp/backend-run.log` y `/tmp/frontend-run.log`
3. Verifica migración V019 en PostgreSQL
4. Consulta `TESTING_LOCAL.md` para troubleshooting

---

## 📝 Archivos de Referencia

- **start-local.sh** - Script de inicio automático
- **TESTING_LOCAL.md** - Guía completa de testing (30 páginas)
- **TESTING_READY.md** - Resumen pre-deployment
- **RESULTADO_TESTING.md** - Resultados del testing automatizado
- **PLAN_TESTING_POS.md** - Plan exhaustivo de testing

---

## 🎉 ¡Estás Listo!

Ejecuta uno de estos comandos y empieza a testear:

```bash
# Opción 1: Automático (Recomendado)
./start-local.sh

# Opción 2: Solo ver el plan
cat TESTING_LOCAL.md

# Opción 3: Manual paso a paso
docker-compose up -d postgres
cd backend && mvn spring-boot:run
# (nueva terminal)
cd frontend && npm run dev
```

**Dashboard POS**: http://localhost:5173/pos-dashboard

¡Buena suerte con el testing! 🚀
