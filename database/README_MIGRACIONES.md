# 📊 Sistema Financiero - Distribución de Beneficios y Excedentes

## 🚀 Ejecutar Migraciones

### Opción 1: Script Automático (Recomendado)

```bash
cd /Users/franferrer/intra-media-system/database
./run-migrations.sh
```

Si te pide contraseña, usa la contraseña de PostgreSQL.

### Opción 2: Manual con psql

```bash
# Migración 005: Distribución de Beneficios
psql -U postgres -d intra_media_system -f migrations/005_profit_distribution_system.sql

# Migración 006: Gastos Reales y Excedentes
psql -U postgres -d intra_media_system -f migrations/006_real_expenses_and_surplus.sql
```

### Opción 3: Desde aplicación GUI (TablePlus, pgAdmin, etc.)

1. Conecta a la base de datos `intra_media_system`
2. Abre el archivo `migrations/005_profit_distribution_system.sql`
3. Ejecuta todo el contenido
4. Repite con `migrations/006_real_expenses_and_surplus.sql`

---

## 🗄️ Lo que se crea en la Base de Datos

### Tablas Nuevas:

1. **`profit_distribution_config`**
   - Configuración de porcentajes de distribución
   - Solo puede haber 1 registro activo
   - Por defecto: 30% gastos, 20% inversión, 50% socios

2. **`monthly_expenses`**
   - Registro de gastos reales mensuales
   - Cálculo de excedentes
   - Sistema de cierre de periodos

### Campos Nuevos en `eventos`:

- `costo_alquiler` - Costo de alquiler
- `otros_costos` - Otros gastos
- `descripcion_costos` - Detalle de costos
- `beneficio_bruto` - Calculado automáticamente
- `monto_gastos_fijos` - 30% por defecto
- `monto_inversion` - 20% por defecto
- `monto_socios` - 50% por defecto
- `monto_fran` - 33.33%
- `monto_roberto` - 33.33%
- `monto_pablo` - 33.34%

### Vistas SQL:

1. **`vw_eventos_desglose_financiero`**
   - Desglose completo por evento

2. **`vw_resumen_financiero_mensual`**
   - Agrupado por mes
   - Totales y promedios

3. **`vw_resumen_por_socio`**
   - Acumulado por cada socio

4. **`vw_budget_vs_real`**
   - Comparativa presupuesto vs real
   - Excedentes calculados

### Funciones PostgreSQL:

1. **`calcular_distribucion_beneficio()`**
   - Trigger automático al crear/editar evento
   - Calcula distribución según configuración

2. **`calcular_presupuesto_mes(año, mes)`**
   - Suma todos los eventos del mes
   - Crea/actualiza registro en `monthly_expenses`

3. **`redistribuir_excedente(año, mes)`**
   - Asigna excedentes a socios
   - Calcula totales finales

4. **`cerrar_mes(año, mes)`**
   - Redistribuye y cierra periodo
   - Bloquea modificaciones

---

## ✅ Verificar que Funcionó

### Consulta 1: Ver configuración

```sql
SELECT * FROM profit_distribution_config WHERE activo = TRUE;
```

Debe devolver 1 fila con los porcentajes por defecto.

### Consulta 2: Ver campos nuevos en eventos

```sql
SELECT
  id, fecha, evento,
  cache_total,
  parte_dj,
  parte_agencia,
  costo_alquiler,
  otros_costos,
  beneficio_bruto,
  monto_gastos_fijos,
  monto_inversion,
  monto_socios,
  monto_fran,
  monto_roberto,
  monto_pablo
FROM eventos
LIMIT 1;
```

### Consulta 3: Verificar vistas

```sql
-- Vista 1
SELECT * FROM vw_resumen_por_socio;

-- Vista 2
SELECT * FROM vw_resumen_financiero_mensual LIMIT 5;

-- Vista 3
SELECT * FROM vw_budget_vs_real;
```

---

## 🔧 Solución de Problemas

### Error: "relation does not exist"

La migración no se ejecutó correctamente. Verifica:
- Que estás conectado a la base de datos correcta
- Que el usuario tiene permisos para crear tablas
- Que no hay errores de sintaxis en los archivos SQL

### Error: "column already exists"

Ya ejecutaste la migración antes. Puedes:
- Ignorar el error (no afecta)
- O eliminar las columnas y volver a ejecutar

### Error: Backend devuelve 500

Las migraciones no se ejecutaron aún. Ejecuta el script primero.

---

## 📍 Próximos Pasos

Una vez ejecutadas las migraciones:

1. **Reinicia el backend** si está corriendo
2. **Accede a la aplicación**: http://localhost:5174
3. **Navega al menú** → Gestión → Distribución de Beneficios
4. **Configura los porcentajes** si quieres cambiarlos
5. **Crea un evento de prueba** con costos
6. **Ve el desglose financiero** automático

---

## 📊 Archivos de Migración

- `migrations/005_profit_distribution_system.sql` (8.5 KB)
  - Sistema de distribución de beneficios
  - Triggers automáticos
  - Vistas de análisis

- `migrations/006_real_expenses_and_surplus.sql` (10.2 KB)
  - Tabla de gastos reales
  - Sistema de excedentes
  - Redistribución automática

---

## 🆘 Ayuda

Si tienes problemas ejecutando las migraciones:

1. Verifica que PostgreSQL esté corriendo
2. Verifica las credenciales de conexión
3. Verifica que la base de datos `intra_media_system` existe
4. Revisa los logs del error específico

Para ver tablas existentes:
```sql
\dt
```

Para ver funciones creadas:
```sql
\df
```

Para ver vistas:
```sql
\dv
```
