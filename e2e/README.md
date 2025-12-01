# 🎭 End-to-End Testing (E2E)

Playwright E2E tests para IntraMedia System.

## 🚀 Ejecutar Tests

### Todos los tests E2E
```bash
npm run test:e2e
# o
make test-e2e
# o
npx playwright test
```

### Con UI Mode (interactivo)
```bash
npm run test:e2e:ui
```

### Tests específicos
```bash
# Solo tests de API
npx playwright test --project="API Tests"

# Solo tests de Chrome
npx playwright test --project=chromium

# Solo un archivo
npx playwright test api.eventos.api.spec.js
```

## 📁 Estructura

```
e2e/
├── README.md                    # Este archivo
├── api.health.api.spec.js      # Tests de health & status (12 tests)
└── api.eventos.api.spec.js     # Tests de eventos CRUD (14 tests)
```

## 🎯 Tests Implementados

### Health & Status (12 tests)

**System Health:**
- ✅ GET / - API information
- ✅ GET /health - System health status
- ✅ GET /metrics - Performance metrics
- ✅ GET /api-docs.json - Swagger spec
- ✅ GET /404 - Not found handler

**CORS & Security:**
- ✅ CORS headers validation
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options)
- ✅ OPTIONS request handling

**Performance:**
- ✅ Health endpoint < 1s response time
- ✅ Root endpoint < 500ms response time

### Eventos API (14 tests)

**CRUD Operations:**
- ✅ POST - Create evento with valid data
- ✅ POST - Reject invalid fecha format
- ✅ POST - Reject invalid mes
- ✅ POST - Reject when montos don't match
- ✅ GET/:id - Get evento by ID
- ✅ GET/:id - Reject invalid ID format
- ✅ GET - List eventos
- ✅ GET - Filter eventos by mes
- ✅ PUT/:id - Update evento

**Quick Actions:**
- ✅ POST /:id/paid - Mark DJ as paid
- ✅ POST /:id/cobrado - Mark client as charged
- ✅ POST /:id/duplicate - Duplicate evento

## ⚙️ Configuración

Ver `playwright.config.js` en la raíz del proyecto.

### Proyectos Configurados

1. **API Tests** - Tests de API sin navegador
2. **chromium** - Tests UI en Chrome
3. **firefox** - Tests UI en Firefox
4. **mobile-chrome** - Tests en dispositivos móviles

### Web Servers

Los servidores se inician automáticamente:
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## 📊 Reportes

### HTML Report
```bash
npx playwright show-report e2e-report
```

### JSON Results
```bash
cat e2e-results.json | jq
```

## 🔧 Opciones Útiles

```bash
# Modo debug
npx playwright test --debug

# Ver traces
npx playwright show-trace trace.zip

# Solo failed tests
npx playwright test --last-failed

# Con navegador visible
npx playwright test --headed

# Tests en un navegador específico
npx playwright test --project=chromium

# Generar code
npx playwright codegen http://localhost:5173
```

## 📝 Escribir Nuevos Tests

```javascript
import { test, expect } from '@playwright/test';

test.describe('Mi Feature', () => {
  test('should do something', async ({ request }) => {
    const response = await request.get('/api/endpoint');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## 🎨 Best Practices

1. **Cleanup**: Siempre limpiar datos de prueba en `afterAll`
2. **Isolation**: Cada test debe ser independiente
3. **Assertions**: Verificar status code, content-type y datos
4. **Performance**: Usar `beforeAll` para setup costoso
5. **Naming**: Nombres descriptivos que expliquen el comportamiento esperado

## 🚨 Troubleshooting

### Tests failing with "address already in use"
```bash
# Mata procesos en puerto 3001 y 5173
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### "Timeout waiting for webServer"
```bash
# Verifica que los servidores arrancan correctamente
cd backend && npm run dev
cd frontend && npm run dev
```

### Tests intermittentes
```bash
# Aumenta timeouts en playwright.config.js
timeout: 60000
```

## 📈 Métricas

- **Total Tests**: 26 E2E tests
- **Coverage**: Health, Eventos API, Security
- **Execution Time**: ~30s (all tests)
- **Pass Rate Target**: 100%

## 🔗 Links Útiles

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Testing](https://playwright.dev/docs/api-testing)
