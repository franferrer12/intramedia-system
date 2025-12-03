# E2E Tests - End-to-End Testing with Playwright

Tests E2E (End-to-End) que validan flujos completos de usuario a través de la API.

## 📁 Estructura

```
tests/e2e/
├── auth-flow.spec.js           # Flujo de autenticación completo
├── evento-workflow.spec.js     # Ciclo de vida completo de eventos
├── dashboard-flow.spec.js      # Dashboard y reportes
└── README.md                   # Esta documentación
```

## 🚀 Ejecutar Tests

### Todos los tests E2E
```bash
npm run test:e2e
```

### Con UI interactiva
```bash
npm run test:e2e:ui
```

### Con navegador visible
```bash
npm run test:e2e:headed
```

### Modo debug
```bash
npm run test:e2e:debug
```

### Test específico
```bash
npx playwright test auth-flow.spec.js
```

## ⚙️ Configuración

Los tests están configurados en `playwright.config.js` con:

- **Base URL**: `http://localhost:8080` (backend API)
- **Timeout**: 30 segundos por test
- **Retry**: 2 intentos en CI
- **Screenshots**: Solo en fallos
- **Videos**: Solo en fallos
- **Traces**: En primer reintento

## 📊 Navegadores

Los tests se ejecutan en:
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop Firefox)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 🧪 Tests Disponibles

### 1. Auth Flow (`auth-flow.spec.js`)

Valida el flujo completo de autenticación:

- ✅ Login con credenciales válidas
- ✅ Login con credenciales inválidas
- ✅ Acceso a recurso protegido con token
- ✅ Acceso sin token (debe fallar)
- ✅ Acceso con token inválido (debe fallar)
- ✅ Logout

**Ejemplo:**
```bash
npx playwright test auth-flow
```

### 2. Evento Workflow (`evento-workflow.spec.js`)

Valida el ciclo de vida completo de un evento:

1. ✅ Crear DJ
2. ✅ Crear Cliente
3. ✅ Crear Evento
4. ✅ Obtener Evento
5. ✅ Actualizar Evento
6. ✅ Listar eventos del DJ
7. ✅ Eliminar Evento (soft delete)
8. ✅ Verificar eliminación
9. ✅ Cleanup (borrar DJ y Cliente)

**Ejemplo:**
```bash
npx playwright test evento-workflow
```

### 3. Dashboard Flow (`dashboard-flow.spec.js`)

Valida flujos de dashboard y reportes:

- ✅ Obtener lista de eventos
- ✅ Obtener lista de DJs
- ✅ Obtener lista de clientes
- ✅ Obtener eventos próximos
- ✅ Resumen financiero mensual
- ✅ Resumen por partners
- ✅ Stats financieras de DJs
- ✅ Stats financieras de clientes
- ✅ Paginación
- ✅ Filtrado por mes
- ✅ Búsqueda

**Ejemplo:**
```bash
npx playwright test dashboard-flow
```

## 🔧 Pre-requisitos

### Backend debe estar corriendo:
```bash
npm run dev
```

El backend debe estar disponible en `http://localhost:8080`

### Usuario de prueba:
Los tests utilizan:
- **Username**: `admin`
- **Password**: `admin123`

Asegúrate de que este usuario existe en la base de datos.

## 📸 Reports y Artefactos

Después de ejecutar los tests:

### Ver reporte HTML:
```bash
npx playwright show-report
```

### Ubicación de artefactos:
```
coverage/
└── playwright-report/
    ├── index.html           # Reporte HTML
    ├── screenshots/         # Screenshots de fallos
    ├── videos/              # Videos de fallos
    └── traces/              # Traces para debugging
```

## 🐛 Debugging

### Ver trace de un test fallido:
```bash
npx playwright show-trace coverage/playwright-report/trace.zip
```

### Debugging interactivo:
```bash
npm run test:e2e:debug
```

Esto abre el inspector de Playwright que permite:
- Ejecutar tests paso a paso
- Ver el estado del DOM
- Ver network requests
- Ver console logs

## 💡 Best Practices

### 1. Usar timestamps para datos únicos
```javascript
const timestamp = Date.now();
const email = `test${timestamp}@example.com`;
```

### 2. Cleanup en afterAll/afterEach
```javascript
test.afterAll(async () => {
  // Limpiar datos de prueba
  await cleanup();
});
```

### 3. Verificar status codes
```javascript
expect(response.status()).toBe(200);
expect(response.ok()).toBeTruthy();
```

### 4. Assertions claras
```javascript
expect(data.id).toBeTruthy();
expect(data.nombre).toBe('Test Name');
expect(Array.isArray(list)).toBeTruthy();
```

## 🔄 CI/CD Integration

En CI/CD, los tests se ejecutan con:
- Retry automático (2 intentos)
- Screenshots y videos en fallos
- Reporte HTML generado

### GitHub Actions ejemplo:
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    BACKEND_URL: http://localhost:8080
```

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Playwright API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
