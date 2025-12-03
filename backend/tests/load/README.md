# Load Testing con K6

Tests de carga para validar el rendimiento del sistema bajo diferentes niveles de tráfico.

## 📁 Estructura

```
tests/load/
├── smoke.test.js           # Smoke test (5 usuarios, 1 min)
├── auth-load.test.js       # Test de carga auth (hasta 100 usuarios)
├── api-load.test.js        # Test de carga completo API (100 usuarios)
└── README.md               # Esta documentación
```

## 🚀 Instalación de K6

### macOS (Homebrew)
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows (Chocolatey)
```powershell
choco install k6
```

### Docker
```bash
docker pull grafana/k6
```

## 📊 Ejecutar Tests

### Smoke Test (Validación rápida)
```bash
k6 run tests/load/smoke.test.js
```

**Propósito**: Validación rápida que el sistema funciona bajo carga mínima
- **Usuarios**: 5 virtuales
- **Duración**: 1 minuto
- **Threshold**: 95% requests < 1s, <1% errors

### Auth Load Test
```bash
k6 run tests/load/auth-load.test.js
```

**Propósito**: Validar rendimiento de endpoints de autenticación
- **Usuarios**: Ramp-up hasta 100
- **Duración**: 6 minutos
- **Stages**:
  - 30s: 0 → 20 usuarios
  - 1m: 20 → 50 usuarios
  - 2m: 50 → 100 usuarios
  - 2m: 100 usuarios sostenidos
  - 30s: 100 → 0 usuarios

**Thresholds**:
- 95% requests < 500ms
- Error rate < 5%

### Full API Load Test
```bash
k6 run tests/load/api-load.test.js
```

**Propósito**: Test completo de todos los endpoints principales
- **Usuarios**: Ramp-up hasta 100
- **Duración**: 9 minutos
- **Operaciones**:
  - 80% operaciones de lectura (GET)
  - 20% operaciones de escritura (POST/PUT/DELETE)

**Thresholds**:
- 95% requests < 1s
- 99% requests < 2s
- Read operations < 500ms
- Write operations < 1s
- Error rate < 5%

### Con URL Custom
```bash
k6 run --env API_URL=https://api.production.com tests/load/api-load.test.js
```

### Con más usuarios
```bash
k6 run --vus 200 --duration 5m tests/load/api-load.test.js
```

## 📈 Métricas Clave

K6 reporta automáticamente:

### Métricas HTTP
- **http_req_duration**: Tiempo total de request
  - avg, min, max, med, p(90), p(95), p(99)
- **http_req_waiting**: Tiempo esperando respuesta del servidor
- **http_req_connecting**: Tiempo estableciendo conexión TCP
- **http_req_sending**: Tiempo enviando datos
- **http_req_receiving**: Tiempo recibiendo datos
- **http_req_failed**: Porcentaje de requests fallidas
- **http_reqs**: Total de HTTP requests realizadas

### Métricas Personalizadas
- **errors**: Rate de errores custom
- **read_latency**: Latencia de operaciones de lectura
- **write_latency**: Latencia de operaciones de escritura

### Métricas de Sistema
- **vus**: Virtual Users activos
- **vus_max**: Máximo de VUs alcanzados
- **iteration_duration**: Duración de cada iteración
- **iterations**: Total de iteraciones completadas

## 🎯 Thresholds (Umbrales)

Los thresholds definen criterios de éxito/falla:

```javascript
thresholds: {
  http_req_duration: ['p(95)<1000'],  // 95% requests bajo 1s
  http_req_failed: ['rate<0.05'],      // Menos de 5% errores
  errors: ['rate<0.01'],                // Menos de 1% errores custom
}
```

**Si algún threshold falla**, el test retorna exit code 1.

## 📊 Visualización de Resultados

### Output en consola
K6 muestra un resumen al final:

```
✓ login status is 200
✓ get eventos status 200
✓ create cliente status 201

checks.........................: 98.50% ✓ 985  ✗ 15
data_received..................: 1.5 MB 25 kB/s
data_sent......................: 250 kB 4.2 kB/s
http_req_duration..............: avg=245ms min=50ms med=200ms max=1.2s p(90)=450ms p(95)=600ms
http_req_failed................: 1.50%  ✓ 15   ✗ 985
http_reqs......................: 1000   16.67/s
iterations.....................: 200    3.33/s
vus............................: 100    min=5   max=100
```

### Cloud (K6 Cloud)
```bash
k6 cloud tests/load/api-load.test.js
```

### Grafana Dashboard
```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load/api-load.test.js
```

Requiere InfluxDB + Grafana configurados.

### JSON Output
```bash
k6 run --out json=results.json tests/load/api-load.test.js
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
export API_URL=http://localhost:8080
export VUS=100
export DURATION=5m
k6 run tests/load/api-load.test.js
```

### Stages Personalizados
```javascript
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm-up
    { duration: '5m', target: 50 },   // Ramp-up
    { duration: '10m', target: 100 }, // Peak
    { duration: '5m', target: 50 },   // Ramp-down
    { duration: '2m', target: 0 },    // Cool-down
  ],
};
```

### Escenarios Múltiples
```javascript
export const options = {
  scenarios: {
    read_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 80 },
        { duration: '5m', target: 80 },
      ],
      exec: 'readOperations',
    },
    write_operations: {
      executor: 'constant-vus',
      vus: 20,
      duration: '7m',
      exec: 'writeOperations',
    },
  },
};
```

## 🐛 Debugging

### Ver requests detalladas
```bash
k6 run --http-debug tests/load/api-load.test.js
```

### Ver headers completos
```bash
k6 run --http-debug="full" tests/load/api-load.test.js
```

### Modo quiet
```bash
k6 run --quiet tests/load/api-load.test.js
```

## 📋 Checklist Pre-Test

Antes de ejecutar load tests:

- [ ] Backend está corriendo (`npm run dev`)
- [ ] Base de datos tiene datos de prueba
- [ ] Usuario admin existe (admin/admin123)
- [ ] No hay otros procesos consumiendo recursos
- [ ] Sistema de monitoreo activo (opcional)
- [ ] Backups de base de datos actualizados (para producción)

## ⚠️ Advertencias

### No ejecutar en producción sin precaución
Los load tests generan tráfico real que puede:
- Generar datos de prueba en la base de datos
- Consumir recursos del servidor
- Afectar usuarios reales

### Recomendaciones:
1. **Development**: Ejecutar libremente
2. **Staging**: Ejecutar antes de deploys
3. **Production**: Solo con autorización y en horarios de bajo tráfico

## 🎯 Interpretación de Resultados

### ✅ Test Exitoso
```
✓ All checks passed
✓ All thresholds met
✓ Error rate < 1%
✓ P95 latency < threshold
```

### ⚠️ Alerta
```
⚠ Some checks failed
⚠ Error rate 1-5%
⚠ P95 latency near threshold
```
**Acción**: Investigar causas, optimizar código

### ❌ Test Fallido
```
✗ Thresholds exceeded
✗ Error rate > 5%
✗ P95 latency > threshold
```
**Acción**: Identificar y fix bottlenecks críticos

## 🔍 Troubleshooting

### Error: "connection refused"
```bash
# Verificar que el backend está corriendo
curl http://localhost:8080
```

### Error: "too many open files"
```bash
# Aumentar límite de archivos abiertos (macOS/Linux)
ulimit -n 10000
```

### Latencia alta
1. Verificar queries de base de datos
2. Revisar logs de servidor
3. Monitorear uso de CPU/memoria
4. Verificar índices de base de datos

### Errores 429 (Rate Limiting)
Es normal si el rate limit está configurado correctamente. Ajusta VUs si necesario.

## 📚 Recursos

- [K6 Documentation](https://k6.io/docs/)
- [K6 Examples](https://k6.io/docs/examples/)
- [Best Practices](https://k6.io/docs/testing-guides/automated-performance-testing/)
- [K6 Cloud](https://k6.io/cloud/)

## 🎓 Casos de Uso

### Before Release
```bash
# Smoke test rápido
k6 run tests/load/smoke.test.js

# Load test completo
k6 run tests/load/api-load.test.js
```

### CI/CD Pipeline
```bash
# En GitHub Actions
- name: Load Test
  run: k6 run --quiet --no-color tests/load/smoke.test.js
```

### Performance Regression
```bash
# Ejecutar antes y después de cambios
k6 run --out json=before.json tests/load/api-load.test.js
# ... hacer cambios ...
k6 run --out json=after.json tests/load/api-load.test.js
# Comparar resultados
```
