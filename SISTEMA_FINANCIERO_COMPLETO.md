# 💰 Sistema Financiero Completo - Distribución de Beneficios

## 📋 Resumen Ejecutivo

Este documento describe el sistema financiero completo implementado para gestionar la distribución de beneficios, costos y excedentes en Intra Media System.

---

## 🎯 Funcionalidades Principales

### 1. **Distribución Automática de Beneficios**
Cada evento registrado calcula automáticamente:
- ✅ Parte para el DJ
- ✅ Costos adicionales (alquiler, otros)
- ✅ Beneficio bruto de la agencia
- ✅ Distribución del beneficio:
  - 30% → Gastos Fijos
  - 20% → Inversión
  - 50% → Socios (Fran, Roberto, Pablo)

### 2. **Gestión de Gastos Reales Mensuales**
Al final de cada mes:
- ✅ Calcula presupuesto automáticamente de todos los eventos
- ✅ Registra gastos fijos reales
- ✅ Registra inversión real
- ✅ Calcula excedentes (presupuesto - real)
- ✅ Redistribuye excedentes entre los socios
- ✅ Cierra el periodo para evitar modificaciones

### 3. **Análisis y Reportes**
- ✅ Dashboard financiero global
- ✅ Dashboard comparativo presupuesto vs real
- ✅ Gráficos de evolución
- ✅ KPIs en tiempo real
- ✅ Exportación a CSV

---

## 🗂️ Estructura del Sistema

### **Base de Datos (PostgreSQL)**

#### Tablas:

1. **`profit_distribution_config`**
   - Configuración de porcentajes de distribución
   - Validación automática (deben sumar 100%)

2. **`monthly_expenses`**
   - Registro mensual de gastos reales
   - Cálculo de excedentes
   - Estado de cierre

#### Campos Nuevos en `eventos`:

```sql
costo_alquiler          DECIMAL(10,2)  -- Costo de alquiler
otros_costos            DECIMAL(10,2)  -- Otros gastos
descripcion_costos      TEXT           -- Detalle
beneficio_bruto         DECIMAL(10,2)  -- Calculado (parte_agencia - costos)
monto_gastos_fijos      DECIMAL(10,2)  -- 30% del beneficio
monto_inversion         DECIMAL(10,2)  -- 20% del beneficio
monto_socios            DECIMAL(10,2)  -- 50% del beneficio
monto_fran              DECIMAL(10,2)  -- 33.33% de monto_socios
monto_roberto           DECIMAL(10,2)  -- 33.33% de monto_socios
monto_pablo             DECIMAL(10,2)  -- 33.34% de monto_socios
```

#### Vistas SQL:

1. **`vw_eventos_desglose_financiero`**
   - Desglose completo de cada evento

2. **`vw_resumen_financiero_mensual`**
   - Totales por mes

3. **`vw_resumen_por_socio`**
   - Acumulado por socio

4. **`vw_budget_vs_real`**
   - Comparativa presupuesto vs gastos reales
   - Excedentes calculados

#### Funciones y Triggers:

1. **`calcular_distribucion_beneficio()`** - Trigger
   - Se ejecuta automáticamente al crear/editar evento
   - Calcula toda la distribución

2. **`calcular_presupuesto_mes(año, mes)`**
   - Suma eventos del mes
   - Crea registro en monthly_expenses

3. **`redistribuir_excedente(año, mes)`**
   - Asigna excedentes a socios
   - Calcula totales finales

4. **`cerrar_mes(año, mes)`**
   - Redistribuye excedentes
   - Bloquea el periodo

---

### **Backend (Node.js/Express)**

#### Modelos Creados:

1. **`ProfitDistribution.js`**
   ```javascript
   getConfig()           // Obtener configuración actual
   update(config)        // Actualizar porcentajes
   recalculateAll()      // Recalcular todos los eventos
   ```

2. **`MonthlyExpense.js`**
   ```javascript
   findAll(filters)           // Listar periodos
   findByPeriod(año, mes)     // Periodo específico
   create(data)               // Crear registro
   update(año, mes, data)     // Actualizar
   calculateBudget(año, mes)  // Calcular presupuesto
   redistribute(año, mes)     // Redistribuir excedentes
   closePeriod(año, mes)      // Cerrar periodo
   getBudgetVsReal(filters)   // Comparativa
   ```

3. **`Evento.js`** (ampliado)
   ```javascript
   getFinancialBreakdown(id)     // Desglose de evento
   getMonthlyFinancialSummary()  // Resumen mensual
   getPartnerSummary()           // Resumen por socio
   ```

#### Endpoints API:

```bash
# Configuración de Distribución
GET    /api/profit-distribution/config
PUT    /api/profit-distribution/config
POST   /api/profit-distribution/recalculate

# Gastos Mensuales
GET    /api/monthly-expenses
GET    /api/monthly-expenses/:year/:month
POST   /api/monthly-expenses
PUT    /api/monthly-expenses/:year/:month
POST   /api/monthly-expenses/:year/:month/calculate-budget
POST   /api/monthly-expenses/:year/:month/redistribute
POST   /api/monthly-expenses/:year/:month/close
GET    /api/monthly-expenses/budget-vs-real

# Análisis Financiero
GET    /api/eventos/:id/financial-breakdown
GET    /api/eventos/financial-summary/monthly
GET    /api/eventos/financial-summary/partners
```

---

### **Frontend (React + Tailwind)**

#### Páginas Creadas:

1. **`/profit-distribution`** - Configuración
   - Sliders para ajustar porcentajes
   - Distribución principal (gastos/inversión/socios)
   - Distribución entre socios (Fran/Roberto/Pablo)
   - Validación en tiempo real (suma = 100%)
   - Botón "Recalcular Eventos"

2. **`/monthly-expenses`** - Gestor Mensual
   - Selector de periodo (año/mes)
   - Botón "Calcular Presupuesto"
   - Tarjetas de resumen:
     - Presupuesto (verde)
     - Gastos Reales (azul) - **editable**
     - Excedentes (morado) - **calculado**
   - Desglose de gastos (JSON editor)
   - Distribución de excedentes
   - Botón "Redistribuir Excedentes"
   - Botón "Cerrar Periodo"

3. **`/budget-comparison`** - Dashboard Comparativo
   - Tabla completa con todos los periodos
   - Filtros (año, estado)
   - 4 KPIs principales:
     - Total Excedentes Acumulados
     - % Ahorro Promedio
     - Mejor Mes
     - Peor Mes
   - 3 Gráficos (Recharts):
     - Evolución de excedentes (línea)
     - Presupuesto vs Real (barras)
     - Distribución por socio (barras apiladas)
   - Exportar CSV

4. **`/financial`** - Dashboard General (ya existía, mejorado)
   - Resumen por socios
   - Análisis mensual
   - Métricas globales

#### Componentes Creados:

1. **`FinancialBreakdown.jsx`**
   - Muestra desglose completo de un evento
   - Tarjetas visuales con colores
   - Iconos descriptivos

2. **`ProfitDistributionConfig.jsx`**
   - Sliders interactivos
   - Validaciones en tiempo real
   - Estados de carga

3. **`EventoViewModal`** (actualizado)
   - Integra FinancialBreakdown
   - Muestra scoring y distribución

#### Formulario de Eventos (actualizado):

Campos nuevos agregados:
- **Costo de Alquiler** (€)
- **Otros Costos** (€)
- **Descripción de Costos** (textarea)
- **Beneficio Bruto** (calculado en tiempo real)
  - Verde si positivo ✅
  - Rojo si negativo ❌

---

## 📊 Flujo de Trabajo

### **1. Configuración Inicial**

```
/profit-distribution
├─ Ajustar porcentajes si es necesario
│  ├─ Gastos Fijos: 30%
│  ├─ Inversión: 20%
│  └─ Socios: 50%
│     ├─ Fran: 33.33%
│     ├─ Roberto: 33.33%
│     └─ Pablo: 33.34%
└─ Guardar configuración
```

### **2. Registro de Eventos (Durante el Mes)**

```
/eventos
├─ Crear nuevo evento
├─ Ingresar datos básicos
│  ├─ Cliente, DJ, fecha
│  ├─ Caché total
│  ├─ Parte DJ
│  └─ Parte Agencia
├─ Ingresar costos adicionales
│  ├─ Costo de alquiler
│  ├─ Otros costos
│  └─ Descripción
└─ Sistema calcula automáticamente:
   ├─ Beneficio Bruto
   ├─ Distribución (30/20/50)
   └─ Parte de cada socio
```

### **3. Fin de Mes (Cierre Mensual)**

```
/monthly-expenses
├─ 1. Seleccionar periodo (ej: Enero 2025)
├─ 2. Click "Calcular Presupuesto"
│     └─ Sistema suma todos los eventos del mes
├─ 3. Ingresar gastos reales
│     ├─ Gastos Fijos Reales: 1,200€
│     ├─ Inversión Real: 800€
│     └─ Desglose detallado (opcional)
├─ 4. Ver excedentes (automático)
│     ├─ Excedente Gastos: 450€ ✅
│     ├─ Excedente Inversión: 300€ ✅
│     └─ Excedente Total: 750€
├─ 5. Click "Redistribuir Excedentes"
│     └─ Asigna 750€ entre los 3 socios
└─ 6. Click "Cerrar Periodo"
      └─ Periodo bloqueado (no editable)
```

### **4. Análisis y Reportes**

```
/budget-comparison
├─ Ver evolución histórica
├─ Comparar presupuesto vs real
├─ Identificar tendencias
└─ Exportar CSV para contabilidad
```

---

## 💡 Ejemplo Práctico

### **Evento del Mes**

```
Boda en Madrid - 15 Enero 2025
├─ Caché Total: 2,000€
├─ Parte DJ: 800€
├─ Costo Alquiler: 200€
├─ Otros Costos: 50€
└─ Parte Agencia: 950€
```

### **Cálculo Automático**

```
Beneficio Bruto = 950€ - 200€ - 50€ = 700€

Distribución (30/20/50):
├─ Gastos Fijos (30%): 210€ ← PRESUPUESTADO
├─ Inversión (20%): 140€ ← PRESUPUESTADO
└─ Socios (50%): 350€
    ├─ Fran (33.33%): 116.67€
    ├─ Roberto (33.33%): 116.67€
    └─ Pablo (33.34%): 116.66€
```

### **Fin de Mes (Gastos Reales)**

```
Gastos Reales del Mes:
├─ Gastos Fijos Reales: 180€ (¡30€ menos!)
├─ Inversión Real: 100€ (¡40€ menos!)
└─ Excedente Total: 70€

Redistribución del Excedente:
├─ Excedente Fran: 23.33€
├─ Excedente Roberto: 23.33€
└─ Excedente Pablo: 23.34€

Totales Finales:
├─ Fran: 116.67€ + 23.33€ = 140.00€
├─ Roberto: 116.67€ + 23.33€ = 140.00€
└─ Pablo: 116.66€ + 23.34€ = 140.00€
```

---

## 🚀 Instrucciones de Instalación

### 1. **Ejecutar Migraciones de Base de Datos**

```bash
cd /Users/franferrer/intra-media-system/database
./run-migrations.sh
```

O manualmente:
```bash
psql -U postgres -d intra_media_system -f migrations/005_profit_distribution_system.sql
psql -U postgres -d intra_media_system -f migrations/006_real_expenses_and_surplus.sql
```

### 2. **Reiniciar Backend**

```bash
cd /Users/franferrer/intra-media-system/backend
npm run dev
```

### 3. **Acceder a la Aplicación**

```
http://localhost:5174
```

### 4. **Verificar en el Menú**

```
Gestión
├─ Eventos
├─ Finanzas → Dashboard General
├─ Distribución de Beneficios → Configuración ✨ NUEVO
├─ Gastos Mensuales → Gestión Mensual ✨ NUEVO
└─ Comparativa Presupuesto → Dashboard Comparativo ✨ NUEVO
```

---

## 📁 Archivos Implementados

### **Base de Datos:**
- `/database/migrations/005_profit_distribution_system.sql`
- `/database/migrations/006_real_expenses_and_surplus.sql`
- `/database/run-migrations.sh`
- `/database/README_MIGRACIONES.md`

### **Backend:**
- `/backend/src/models/ProfitDistribution.js`
- `/backend/src/models/MonthlyExpense.js`
- `/backend/src/models/Evento.js` (actualizado)
- `/backend/src/controllers/profitDistributionController.js`
- `/backend/src/controllers/monthlyExpensesController.js`
- `/backend/src/controllers/eventosController.js` (actualizado)
- `/backend/src/routes/profitDistribution.js`
- `/backend/src/routes/monthlyExpenses.js`
- `/backend/src/routes/eventos.js` (actualizado)
- `/backend/src/server.js` (actualizado)

### **Frontend:**
- `/frontend/src/pages/ProfitDistributionSettings.jsx`
- `/frontend/src/pages/MonthlyExpenseManager.jsx`
- `/frontend/src/pages/BudgetComparison.jsx`
- `/frontend/src/pages/FinancialDashboard.jsx` (actualizado)
- `/frontend/src/pages/Eventos.jsx` (actualizado)
- `/frontend/src/components/ProfitDistributionConfig.jsx`
- `/frontend/src/components/FinancialBreakdown.jsx`
- `/frontend/src/components/Layout.jsx` (actualizado)
- `/frontend/src/services/api.js` (actualizado)
- `/frontend/src/App.jsx` (actualizado)

---

## ✨ Características Destacadas

### **Automatización:**
- ✅ Cálculo automático de distribución en cada evento
- ✅ Triggers de base de datos
- ✅ Actualización en tiempo real

### **Validaciones:**
- ✅ Porcentajes deben sumar 100%
- ✅ Números positivos únicamente
- ✅ Periodos cerrados no editables
- ✅ No duplicar periodos

### **UI/UX:**
- ✅ Colores coherentes (morado #9333ea)
- ✅ Iconos descriptivos
- ✅ Loading states
- ✅ Toasts informativos
- ✅ Responsive design
- ✅ Dark mode
- ✅ Animaciones suaves

### **Análisis:**
- ✅ Gráficos interactivos (Recharts)
- ✅ KPIs en tiempo real
- ✅ Exportación CSV
- ✅ Filtros avanzados

---

## 📞 Soporte

Para cualquier duda o problema:
1. Revisa `/database/README_MIGRACIONES.md`
2. Verifica que las migraciones se ejecutaron correctamente
3. Consulta los logs del backend para errores específicos

---

## 🎉 Conclusión

El sistema está 100% funcional y listo para uso en producción. Proporciona control total sobre la distribución de beneficios, gestión de gastos reales y análisis de excedentes.

**Beneficios principales:**
- ✅ Transparencia financiera total
- ✅ Distribución justa y configurable
- ✅ Ahorro visible y cuantificable
- ✅ Control de gastos por periodo
- ✅ Trazabilidad completa
- ✅ Reportes profesionales

---

**Fecha de implementación:** 26 de Octubre 2025
**Versión:** 1.0.0
**Estado:** ✅ Completado y listo para producción
