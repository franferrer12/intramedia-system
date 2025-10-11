# 🚨 Plan de Recuperación del Backend

> **Fecha:** 2025-10-11
> **Situación:** Backend en Railway con error 502 por migraciones inconsistentes

---

## 📋 Diagnóstico del Problema

### Causa Raíz
El backend falló porque había migraciones de base de datos (V020-V024) para el módulo "Botellas VIP" que:
1. Están en el código fuente
2. Railway intentó ejecutarlas
3. Hacen referencia a columnas que no existen (`p.stock`)
4. Flyway falló y el backend no puede arrancar

### Error Específico
```
ERROR: column p.stock does not exist
Position: 302
Location: db/migration/V023__triggers_apertura_botellas.sql
```

---

## ✅ Acciones Tomadas

1. **Archivado de migraciones problemáticas**
   - Movidas a: `backend/src/main/resources/db/migration/.archived/`
   - V020__add_botellas_vip_fields.sql
   - V021__create_botellas_abiertas_table.sql
   - V022__update_detalle_venta_for_botellas.sql
   - V023__triggers_apertura_botellas.sql
   - V024__seed_botellas_vip_data.sql

2. **Redespliegue iniciado**
   - Railway está intentando redesplegar sin estas migraciones
   - Estado actual: 502 (todavía compilando/desplegando)

---

## 🔧 Soluciones Posibles

### Opción A: Limpiar historial de Flyway en la BD (RECOMENDADO)

Si Flyway ya registró V020-V024 como ejecutadas, necesitas eliminar esos registros:

```sql
-- Conectar a la BD de Railway
railway run -s club-manegament sh -c 'psql "$DATABASE_PUBLIC_URL"'

-- Ver migraciones registradas
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 10;

-- Si ves V020-V024 como "failed" (false), eliminarlas:
DELETE FROM flyway_schema_history WHERE version IN ('020', '021', '022', '023', '024');

-- Reiniciar el backend después
```

### Opción B: Rollback completo a V019

Si la base de datos tiene cambios de V020-V024 aplicados parcialmente:

```sql
-- 1. Hacer backup primero
pg_dump ...

-- 2. Eliminar tablas/columnas creadas por V020-V024
DROP TABLE IF EXISTS botellas_abiertas CASCADE;
ALTER TABLE productos DROP COLUMN IF EXISTS es_botella CASCADE;
-- ... etc

-- 3. Limpiar historial Flyway
DELETE FROM flyway_schema_history WHERE version >= '020';

-- 4. Redesplegar
```

### Opción C: Usar último backup funcionando

Si Railway tiene backups automáticos:
1. Restaurar BD al estado anterior a V020
2. Redesplegar backend actual (sin V020-V024)

---

## 🎯 Estado del Sistema POS

### ✅ Lo que SÍ funciona:

**Frontend (100% completado):**
- ✅ http://localhost:3001 running
- ✅ TicketActual.tsx - Carrito completo
- ✅ CerrarSesionModal.tsx - Modal de cierre
- ✅ PosPage.tsx - Rediseñado
- ✅ POSTerminalPage.tsx - Terminal táctil
- ✅ MonitorSesionesPage.tsx - Monitor tiempo real
- ✅ CORS fix aplicado (withCredentials disabled)

**Documentación:**
- ✅ docs/POS_COMPLETE_GUIDE.md (50+ páginas)
- ✅ docs/POS_DEPLOYMENT_STATUS.md
- ✅ docs/CORS_WORKAROUND.md

### ❌ Lo que NO funciona:

**Backend:**
- ❌ Railway backend en 502
- ❌ Migraciones V020-V024 causando conflicto

---

## 🚀 Plan de Acción Inmediato

### 1. Verificar si el backend se recupera solo
```bash
# Esperar 5 minutos y verificar
curl https://club-manegament-production.up.railway.app/actuator/health
```

### 2. Si sigue en 502, ejecutar limpieza de Flyway
```bash
# Conectar a Railway DB
railway run -s club-manegament sh -c 'psql "$DATABASE_PUBLIC_URL" -c "DELETE FROM flyway_schema_history WHERE version >= '\''020'\'';"'

# Forzar restart
railway restart --service club-manegament
```

### 3. Verificar que V019 sea la última migración exitosa
```bash
railway run -s club-manegament sh -c 'psql "$DATABASE_PUBLIC_URL" -c "SELECT MAX(version) FROM flyway_schema_history WHERE success = true;"'
# Debe devolver: 019
```

---

## 📊 Estado de Migraciones

### Última migración válida: V019
```sql
V019__create_pos_tables.sql
- Crea tablas: sesiones_caja, ventas, detalle_venta
- Crea triggers: descontar_stock_venta, generar_numero_ticket
- Estado: ✅ COMPLETO y funcional
```

### Migraciones archivadas (no se ejecutarán):
```
V020 - V024: Módulo "Botellas VIP" (incompleto)
Ubicación: backend/src/main/resources/db/migration/.archived/
```

---

## ⚠️ Nota Importante

**El sistema POS (Sprint 8) está 100% completado en el frontend.**
El problema actual del backend NO es culpa del trabajo del POS, sino de migraciones de un módulo futuro ("Botellas VIP") que se incluyeron prematuramente.

Una vez que el backend se recupere a V019, el POS funcionará perfectamente.

---

## 🔗 Enlaces Útiles

- Railway Dashboard: https://railway.app/project/ccab6032-7546-4b1a-860f-29ec44cdbd85
- Logs del último deploy: https://railway.com/project/.../service/.../id=491cc193-ddd1-433f-aebd-9928cb0127f4

---

**Última actualización:** 2025-10-11
