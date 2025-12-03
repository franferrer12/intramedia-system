# Reporte de Auditoría de Base de Datos
**Fecha:** 2025-12-03
**Database:** intra_media_system
**Total Tablas:** 44
**Total Foreign Keys:** 69 (todas válidas)

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. DUPLICACIÓN: Tablas `users` vs `usuarios`

**Severidad:** ⚠️ ALTA

**Descripción:**
Existen dos tablas de usuarios simultáneamente:
- `users` - 5 registros
- `usuarios` - 1 registro

**Impacto:**
- Inconsistencia de datos
- Confusión en el código (¿cuál usar?)
- Foreign keys pueden apuntar a tabla incorrecta
- Riesgo de pérdida de datos

**Causa Probable:**
Merge de dos proyectos diferentes (Club Management System en español + Intra Media System en inglés)

**Solución Recomendada:**
1. **Verificar qué tabla usa el código activo** (revisar modelos y controladores)
2. **Migrar datos** de la tabla menos usada a la principal
3. **Actualizar foreign keys** que apunten a la tabla antigua
4. **Eliminar tabla duplicada**
5. **Establecer estándar**: **Inglés** para nombres de tablas (mejor práctica internacional)

---

### 2. INCONSISTENCIA: Sistema de Cotizaciones (Español vs Inglés)

**Severidad:** ⚠️ ALTA

**Descripción:**
- **Tablas en BD (español):**
  - `cotizaciones` (0 registros)
  - `cotizacion_items` (0 registros)

- **Código backend (inglés):**
  - Modelo: `Quotation.js`
  - Controlador: `quotationsController.js`
  - Rutas: `/api/quotations`
  - Migrations: `011_create_quotations_system.sql` (usa inglés)

**Impacto:**
- **Sistema de cotizaciones NO FUNCIONA**
- Cualquier insert/update fallará con "tabla no existe"
- Frontend no podrá crear cotizaciones

**Solución Recomendada:**

**Opción A (RECOMENDADA):** Renombrar tablas a inglés
```sql
ALTER TABLE cotizaciones RENAME TO quotations;
ALTER TABLE cotizacion_items RENAME TO quotation_items;
-- Actualizar foreign keys y constraints
```

**Opción B:** Adaptar código a español
- Renombrar `Quotation.js` → `Cotizacion.js`
- Actualizar todos los modelos
- Cambiar endpoints a `/api/cotizaciones`
- ❌ No recomendado: va contra estándares internacionales

---

### 3. NOMENCLATURA INCONSISTENTE (Inglés/Español Mezclados)

**Severidad:** 🟡 MEDIA

**Tablas en INGLÉS:**
- `agencies` (2 registros)
- `contracts` (1 registro)
- `users` (5 registros)
- `djs` (81 registros)

**Tablas en ESPAÑOL:**
- `clientes` (72 registros)
- `eventos` (50 registros)
- `usuarios` (1 registro)
- `cotizaciones` (0 registros)

**Impacto:**
- Código difícil de mantener
- Confusión para desarrolladores
- Documentación inconsistente

**Decisión Necesaria:**
Elegir UN estándar y aplicarlo consistentemente.

**Recomendación:** **Inglés** por:
- Estándar internacional
- Mejor para colaboración
- Frameworks y herramientas en inglés
- Código más profesional

---

## ✅ ASPECTOS POSITIVOS

1. **Foreign Keys Válidas:** Todas las 69 foreign keys son válidas y consistentes
2. **Índices:** 50+ índices personalizados bien configurados
3. **Datos Existentes:** Sistema ya tiene datos de producción:
   - 72 clientes
   - 81 DJs
   - 50 eventos
   - 2 agencias
4. **Tamaño Razonable:** 44 tablas, BD compacta (< 10 MB total)

---

## 📋 PLAN DE CORRECCIÓN RECOMENDADO

### Fase 1: Resolver Duplicación `users`/`usuarios` (CRÍTICO)

1. **Identificar tabla activa:**
   ```bash
   grep -r "FROM users" src/
   grep -r "FROM usuarios" src/
   ```

2. **Consolidar datos:**
   ```sql
   -- Si users es la tabla activa
   INSERT INTO users (...)
   SELECT ...
   FROM usuarios
   WHERE id NOT IN (SELECT id FROM users);
   ```

3. **Eliminar duplicado:**
   ```sql
   DROP TABLE usuarios CASCADE;
   ```

### Fase 2: Resolver Sistema de Cotizaciones (CRÍTICO)

**Opción Recomendada: Renombrar a inglés**

```sql
-- Renombrar tablas
ALTER TABLE cotizaciones RENAME TO quotations;
ALTER TABLE cotizacion_items RENAME TO quotation_items;

-- Renombrar constraints y sequences
ALTER SEQUENCE cotizaciones_id_seq RENAME TO quotations_id_seq;
ALTER SEQUENCE cotizacion_items_id_seq RENAME TO quotation_items_id_seq;

-- Renombrar foreign keys (ejemplo)
ALTER TABLE quotation_items
  RENAME CONSTRAINT fk_cotizacion_id TO fk_quotation_id;
```

### Fase 3: Estandarizar Nomenclatura (OPCIONAL - Post-MVP)

**Solo si es necesario y el equipo lo aprueba:**

```sql
ALTER TABLE clientes RENAME TO clients;
ALTER TABLE eventos RENAME TO events;
-- etc...
```

**⚠️ IMPORTANTE:** Requiere actualizar:
- Todos los modelos
- Todos los controladores
- Todas las queries
- Tests
- Documentación

---

## 🎯 PRIORIDAD DE EJECUCIÓN

### AHORA (Bloqueante para FASE 3):
1. ✅ Resolver `cotizaciones` → `quotations` (sin esto, sistema de cotizaciones no funciona)

### PRONTO (Semana 1):
2. ⚠️ Resolver duplicación `users`/`usuarios`

### FUTURO (Post-MVP):
3. 🔄 Estandarizar nomenclatura completa a inglés (si el equipo lo aprueba)

---

## 📊 ESTADÍSTICAS DE LA BASE DE DATOS

| Métrica | Valor |
|---------|-------|
| Total Tablas | 44 |
| Total Foreign Keys | 69 |
| Total Índices Personalizados | 50+ |
| Tamaño Total | ~10 MB |
| Tablas con Datos | 42 |
| Tablas Vacías | 2 (cotizaciones, cotizacion_items) |

**Tablas Más Grandes:**
1. `audit_logs` - 712 kB
2. `eventos` - 648 kB
3. `contracts` - 224 kB
4. `social_media_snapshots` - 224 kB
5. `financial_alerts` - 216 kB

---

## 🔧 COMANDOS ÚTILES

### Verificar usuarios activos:
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name LIKE '%user%' OR column_name LIKE '%usuario%';
```

### Ver foreign keys que apuntan a users/usuarios:
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name IN ('users', 'usuarios');
```

---

**Auditoría completada por:** Claude Code
**Próxima revisión:** Después de aplicar correcciones
