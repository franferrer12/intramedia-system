# Scripts de Seed para Datos de Prueba

Este directorio contiene scripts para generar datos de prueba realistas en la base de datos.

## Script Principal: `comprehensive-test-data.js`

Genera un entorno completo de prueba con:

### Datos Generados:
- **15 Clientes** con diferentes niveles de actividad (VIP, Premium, Regular)
- **8 DJs** con diferentes niveles y tarifas (Senior, Mid-level, Junior)
- **~140 Eventos** distribuidos a lo largo de 12 meses (pasados y futuros)
- **Transacciones realistas** con estados de cobro/pago variables
- **Alertas financieras** automáticas basadas en los datos

### Características del Seed:

#### Clientes:
- Frecuencia alta: 15-25 eventos
- Frecuencia media: 6-12 eventos
- Frecuencia baja: 2-5 eventos
- Incluye: Disco Pacha, Sala Apolo, Café del Mar, etc.

#### DJs:
- Tarifas desde €100-€300 por evento
- Distribución realista de eventos
- Niveles: Senior, Mid-level, Junior

#### Eventos:
- Tipos variados: Bodas, Fiestas Privadas, Eventos Corporativos, Discotecas, Festivales
- Precios desde €100 hasta €1200
- Duraciones de 3-10 horas
- Distribución temporal: últimos 12 meses + próximos 2 meses

#### Estados de Pago:
- **Eventos pasados**: 85% cobrados al cliente, 90% pagados a DJs
- **Eventos futuros**: Sin cobrar ni pagar (pendientes)
- Genera situaciones realistas de pendientes y vencimientos

## Uso

### Ejecutar el Seed:

```bash
cd backend
node seeds/comprehensive-test-data.js
```

### Resultado Esperado:

```
🚀 INICIANDO SEED DE DATOS DE PRUEBA

🗑️  Limpiando datos existentes...
✅ Datos limpiados
👥 Creando clientes...
✅ 15 clientes creados
🎧 Creando DJs...
✅ 8 DJs creados
🎉 Creando eventos...
✅ 137 eventos creados
🚨 Generando alertas financieras...
⚠️  Continuando sin alertas...

📊 ESTADÍSTICAS GENERADAS:

👥 Clientes: 220
🎧 DJs: 34
🎉 Eventos: 607
💰 Facturación total: €72,404.50
✅ Total cobrado: €2,265.00
⏳ Pendiente cobro: €70,139.50
💸 Costes DJs: €5,104.50
✅ Pagado a DJs: €1,375.00
⏳ Pendiente pago DJs: €3,729.50

✅ SEED COMPLETADO EXITOSAMENTE
```

## ⚠️ Importante

- **LIMPIA TODOS LOS DATOS EXISTENTES** antes de insertar nuevos datos
- Los IDs de los registros serán secuenciales desde el último ID existente
- Las alertas financieras se generan automáticamente basadas en los eventos

## Casos de Prueba Incluidos

### 1. Dashboard Ejecutivo
- Métricas financieras consolidadas
- KPIs de rendimiento
- Alertas activas

### 2. Análisis Comparativo
- Comparación entre períodos
- Benchmarks de clientes y DJs
- Análisis estacional

### 3. Gestión Financiera
- Cobros pendientes (críticos y urgentes)
- Pagos a DJs pendientes
- Cash flow y rentabilidad

### 4. Reportes
- Top 10 clientes por facturación
- Top 10 DJs por eventos
- Evolución mensual de ingresos

## Personalización

Para modificar la cantidad o tipo de datos generados, edita las constantes en el archivo:

```javascript
const CLIENTS = [ ... ];  // Añadir/quitar clientes
const DJS = [ ... ];      // Añadir/quitar DJs
const TIPO_EVENTOS = [ ... ];  // Configurar tipos de eventos
```

Para cambiar la distribución temporal:

```javascript
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 12); // Últimos X meses
const endDate = new Date();
endDate.setMonth(endDate.getMonth() + 2); // Próximos Y meses
```

## Scripts Disponibles

### 1. `comprehensive-test-data.js` ⭐ RECOMENDADO
Dataset completo y realista para desarrollo general.

```bash
node seeds/comprehensive-test-data.js
```

**Genera:**
- 15 clientes con diferentes perfiles (VIP, Premium, Regular)
- 8 DJs con niveles variados (Senior, Mid, Junior)
- ~140 eventos distribuidos en 12 meses
- Alertas financieras automáticas

**Ideal para:** Desarrollo general, demos, pruebas de funcionalidad

---

### 2. `quick-demo.js` 🚀 DEMO RÁPIDA
Dataset mínimo para demostraciones rápidas.

```bash
node seeds/quick-demo.js
```

**Genera:**
- 5 clientes
- 3 DJs
- 20 eventos (10 pasados, 10 futuros)

**Ideal para:** Demos rápidas, presentaciones, primeras pruebas

---

### 3. `stress-test.js` 💪 PRUEBAS DE RENDIMIENTO
Dataset masivo para pruebas de performance.

```bash
node seeds/stress-test.js
```

**Genera:**
- 50 clientes
- 20 DJs
- 1000 eventos
- ⏱️ Tarda ~2-3 minutos

**Ideal para:** Pruebas de rendimiento, optimización de queries, carga del sistema

---

### 4. `edge-cases.js` 🔥 CASOS LÍMITE
Situaciones especiales y casos extremos.

```bash
node seeds/edge-cases.js
```

**Genera:**
- Cliente con deuda de 2 años (10 eventos impagados)
- Cliente VIP perfecto (historial impecable)
- Evento premium de €50,000
- Evento económico de €50
- DJ sin cobrar hace meses (€600 pendientes)
- 10 eventos futuros programados
- Evento maratón de 24 horas
- Cliente inactivo con deuda

**Ideal para:** Testing de validaciones, manejo de errores, casos extremos

## Verificación

Después de ejecutar el seed, verifica los datos:

```bash
# Ver dashboard ejecutivo
curl http://localhost:3001/api/executive-dashboard/metrics | python3 -m json.tool

# Ver alertas
curl http://localhost:3001/api/financial-alerts | python3 -m json.tool

# Ver eventos
curl http://localhost:3001/api/eventos | python3 -m json.tool
```

## Troubleshooting

### Error: "column X does not exist"
- Verifica que las migraciones estén actualizadas
- Revisa la estructura de la tabla en el archivo de migración

### Error: "null value in column X violates not-null constraint"
- Asegúrate de que todos los campos obligatorios estén incluidos en el INSERT

### Los datos no aparecen
- Verifica que no haya errores de ROLLBACK en el script
- Comprueba que el pool de base de datos esté conectado

## Contribuir

Para añadir nuevos scripts de seed:

1. Crea un nuevo archivo en `backend/seeds/`
2. Sigue la estructura del script principal
3. Documenta los datos generados en este README
4. Añade casos de prueba relevantes
