# 📚 Sistema de Ayuda y Onboarding

## Descripción General

Sistema completo de ayuda integrado en la aplicación que se actualiza automáticamente con cada nueva funcionalidad. Incluye tutoriales interactivos, presentación visual, tours paso a paso y registro de novedades.

## 🎯 Componentes del Sistema

### 1. Centro de Ayuda (`/ayuda`)

**Ubicación:** `frontend/src/pages/ayuda/AyudaPage.tsx`

Página principal de ayuda con:
- **8 tutoriales paso a paso** (uno por cada módulo)
- **Búsqueda de tutoriales** por palabra clave
- **Enlaces rápidos** a presentación y documentación
- **Vista detallada** de cada tutorial con pasos numerados

**Tutoriales incluidos:**
1. 🔐 Iniciar Sesión y Roles (2 min)
2. 🎊 Crear y Gestionar Eventos (5 min)
3. 💰 Control de Ingresos y Gastos (4 min)
4. 👥 Gestionar Tu Equipo (6 min)
5. 📦 Control de Productos y Stock (5 min)
6. 🖥️ Sistema POS - Punto de Venta (7 min)
7. 🍾 Botellas VIP - Gestión Avanzada (6 min)
8. 📊 Análisis del Negocio (4 min)

**Cómo usar:**
```typescript
// Los usuarios acceden desde el menú "Ayuda" o directamente en /ayuda
// Cada tutorial muestra:
// - Icono representativo
// - Descripción breve
// - Duración estimada
// - Número de pasos
// - Al hacer clic: pasos detallados con instrucciones claras
```

### 2. Página de Novedades (`/ayuda/novedades`)

**Ubicación:** `frontend/src/pages/ayuda/NovedadesPage.tsx`

Changelog visual con timeline de actualizaciones:
- **Versión actual** y progreso del proyecto
- **Timeline visual** con todas las actualizaciones
- **Badges de tipo:** Nueva Funcionalidad, Mejora, Corrección, Cambio Importante
- **Detalles de cada versión:** fecha, módulo afectado, lista de cambios

**Versiones registradas:**
- v0.3.0: Sistema de Botellas VIP (Sprint 9)
- v0.2.0: Sistema POS Completo (Sprint 8)
- v0.1.5: Optimización UX (Sprint 6)
- v0.1.0: Sistema Base Completo (Sprints 1-5)

**Actualización automática:**
```typescript
// Para agregar una nueva versión, edita el array `novedades` en NovedadesPage.tsx:
const novedades: Novedad[] = [
  {
    version: '0.4.0',
    fecha: '15 Enero 2025',
    tipo: 'feature', // feature | improvement | bugfix | breaking
    titulo: 'Sprint 10: Nueva Funcionalidad',
    descripcion: 'Descripción breve de la nueva funcionalidad',
    modulo: 'Nombre del Módulo',
    items: [
      '✅ Cambio 1',
      '✅ Cambio 2',
      '✅ Cambio 3'
    ]
  },
  // ... versiones anteriores
];
```

### 3. Tours Interactivos

**Ubicación:** `frontend/src/components/tours/`

Sistema de tours guiados que resalta elementos de la UI y muestra explicaciones paso a paso.

**Archivos:**
- `InteractiveTour.tsx`: Componente base del tour
- `tour-configs.ts`: Configuración de todos los tours por página

**Características:**
- ✅ Overlay oscuro sobre la página
- ✅ Resaltado del elemento objetivo con animación pulsante
- ✅ Tooltip flotante con título, contenido y navegación
- ✅ Barra de progreso visual
- ✅ Scroll automático al elemento
- ✅ Persistencia (no se repite si ya se completó)
- ✅ Botones: Anterior, Siguiente, Saltar, Finalizar

**Tours disponibles:**
```typescript
import { toursByRoute } from './components/tours/tour-configs';

// Tours por ruta:
'/dashboard'         → dashboardTour (5 pasos)
'/eventos'           → eventosTour (5 pasos)
'/transacciones'     → finanzasTour (6 pasos)
'/empleados'         → personalTour (4 pasos)
'/jornadas'          → jornadasTour (4 pasos)
'/nominas'           → nominasTour (5 pasos)
'/productos'         → inventarioTour (6 pasos)
'/pos'               → posTour (8 pasos)
'/botellas-abiertas' → botellasVipTour (9 pasos)
'/analytics'         → analyticsTour (5 pasos)
```

**Cómo usar en un componente:**
```typescript
import { InteractiveTour } from '@/components/tours/InteractiveTour';
import { dashboardTour } from '@/components/tours/tour-configs';

function DashboardPage() {
  const [showTour, setShowTour] = useState(true);

  return (
    <div>
      {/* Agregar data-tour a los elementos que quieres resaltar */}
      <h1 data-tour="dashboard-title">Dashboard</h1>
      <div data-tour="kpi-ingresos">Ingresos: €10,000</div>

      {/* Tour interactivo */}
      {showTour && (
        <InteractiveTour
          tourId="dashboard"
          steps={dashboardTour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
```

**Crear un tour personalizado:**
```typescript
const miTour: TourStep[] = [
  {
    target: '[data-tour="elemento-1"]', // Selector CSS
    title: 'Título del paso',
    content: 'Explicación detallada de este elemento',
    placement: 'bottom', // top | bottom | left | right
    action: 'Ver ejemplo', // Texto del botón de acción (opcional)
    onAction: () => console.log('Acción ejecutada') // Callback (opcional)
  },
  // ... más pasos
];
```

### 4. Presentación Visual HTML

**Ubicación:** `PRESENTACION_SISTEMA.html`

Presentación completa del sistema con mockups visuales y casos de uso.

**Contenido:**
- 📊 Estadísticas del proyecto (6 KPI cards)
- 🔐 8 módulos documentados con mockups
- 💡 Casos de uso reales por módulo
- 📡 Endpoints REST por módulo
- 🎨 Diseño profesional con gradientes y animaciones
- 📱 Responsive (desktop, tablet, mobile)

**Actualización automática:**
```bash
# Ejecutar el script de generación:
node scripts/generate-docs.js

# Esto actualiza automáticamente:
# - Versión del sistema
# - Estadísticas (sprints, módulos, migraciones)
# - Fecha de última actualización
```

### 5. Script de Generación Automática

**Ubicación:** `scripts/generate-docs.js`

Script Node.js que escanea el proyecto y actualiza la documentación automáticamente.

**Funcionalidades:**
- ✅ Lee PROGRESS.md y extrae estadísticas
- ✅ Escanea controladores Java para listar endpoints
- ✅ Escanea páginas React para listar componentes
- ✅ Actualiza PRESENTACION_SISTEMA.html con datos actuales
- ✅ Genera ENDPOINTS_REPORT.md con todos los endpoints

**Ejecutar:**
```bash
cd /Users/franferrer/workspace/club-management
chmod +x scripts/generate-docs.js
node scripts/generate-docs.js
```

**Salida:**
```
🚀 Iniciando generación de documentación...

📊 Extrayendo estadísticas del proyecto...
   ✓ Versión: 0.3.0
   ✓ Sprints: 9/11
   ✓ Migraciones: 15

📡 Escaneando endpoints del backend...
   ✓ Encontrados 87 endpoints

📄 Escaneando páginas del frontend...
   ✓ Encontradas 23 páginas

🎨 Actualizando presentación HTML...
   ✓ Presentación actualizada

📝 Generando reporte de endpoints...
   ✓ Reporte guardado en ENDPOINTS_REPORT.md

✅ Documentación generada correctamente
```

## 🚀 Cómo Integrar en Cada Página

### Paso 1: Agregar atributos data-tour

```tsx
// En tu componente, agrega data-tour a los elementos importantes
<div className="page">
  <h1 data-tour="page-title">Mi Página</h1>

  <button data-tour="btn-nueva-accion">
    Nueva Acción
  </button>

  <div data-tour="tabla-datos">
    {/* Contenido */}
  </div>
</div>
```

### Paso 2: Configurar el tour

```typescript
// En tour-configs.ts, agrega tu tour:
export const miPaginaTour: TourStep[] = [
  {
    target: '[data-tour="page-title"]',
    title: 'Título de la página',
    content: 'Explicación de qué hace esta página',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-nueva-accion"]',
    title: 'Crear nueva acción',
    content: 'Haz clic aquí para crear una nueva acción',
    placement: 'bottom'
  }
];

// Registrarlo en el mapa de tours:
export const toursByRoute: Record<string, TourStep[]> = {
  // ... otros tours
  '/mi-pagina': miPaginaTour
};
```

### Paso 3: Activar el tour en la página

```typescript
import { useState, useEffect } from 'react';
import { InteractiveTour } from '@/components/tours/InteractiveTour';
import { miPaginaTour } from '@/components/tours/tour-configs';

function MiPagina() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Mostrar tour solo la primera vez
    const tourCompleted = localStorage.getItem('tour_mi-pagina_completed');
    if (!tourCompleted) {
      setShowTour(true);
    }
  }, []);

  return (
    <div>
      {/* Tu contenido con data-tour */}
      <h1 data-tour="page-title">Mi Página</h1>

      {/* Tour */}
      {showTour && (
        <InteractiveTour
          tourId="mi-pagina"
          steps={miPaginaTour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
```

## 📝 Actualizar Documentación

### Al agregar una nueva funcionalidad:

1. **Actualizar NovedadesPage.tsx:**
```typescript
const novedades: Novedad[] = [
  {
    version: '0.X.0',
    fecha: 'DD Mes YYYY',
    tipo: 'feature',
    titulo: 'Sprint X: Nombre de la Funcionalidad',
    descripcion: 'Breve descripción',
    modulo: 'Nombre del Módulo',
    items: [
      '✅ Cambio 1',
      '✅ Cambio 2'
    ]
  },
  // ... versiones anteriores
];
```

2. **Agregar tutorial en AyudaPage.tsx:**
```typescript
const tutorials: Tutorial[] = [
  // ... tutoriales existentes
  {
    id: 'nueva-feature',
    title: 'Nueva Funcionalidad',
    description: 'Cómo usar la nueva funcionalidad',
    module: 'Nombre del Módulo',
    duration: '5 min',
    icon: '🎯',
    steps: [
      'Paso 1: ...',
      'Paso 2: ...'
    ]
  }
];
```

3. **Crear tour interactivo en tour-configs.ts:**
```typescript
export const nuevaFeatureTour: TourStep[] = [
  {
    target: '[data-tour="elemento-1"]',
    title: 'Primer elemento',
    content: 'Explicación',
    placement: 'bottom'
  }
];
```

4. **Ejecutar script de generación:**
```bash
node scripts/generate-docs.js
```

5. **Actualizar PROGRESS.md:**
- Agregar el sprint completado
- Actualizar estadísticas
- Documentar nuevos endpoints

6. **Commit y Deploy:**
```bash
git add .
git commit -m "docs: Add Sprint X documentation and interactive tours"
git push
```

## 🎨 Personalización

### Cambiar colores del tour:

```css
/* En InteractiveTour.tsx, modifica los colores: */
.tour-highlight {
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); /* Azul */
}

/* Para usar otro color (ej: verde): */
.tour-highlight {
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.5); /* Verde */
}
```

### Cambiar duración de animaciones:

```css
@keyframes pulse-border {
  /* Cambiar 2s por la duración deseada */
  animation: pulse-border 2s infinite;
}
```

### Desactivar tours automáticos:

```typescript
// En cada página, cambiar:
const [showTour, setShowTour] = useState(false); // No mostrar por defecto

// Y agregar un botón manual:
<button onClick={() => setShowTour(true)}>
  Ver tutorial
</button>
```

## 📊 Métricas y Análisis

El sistema registra automáticamente:
- ✅ Tours completados (localStorage)
- ✅ Tours saltados
- ✅ Tutoriales vistos en el Centro de Ayuda

**Ver estadísticas:**
```javascript
// En la consola del navegador:
Object.keys(localStorage)
  .filter(key => key.startsWith('tour_'))
  .forEach(key => console.log(key, localStorage.getItem(key)));
```

## 🔄 Flujo de Actualización Automática

```
1. Desarrollador agrega nueva funcionalidad
   ↓
2. Actualiza PROGRESS.md con el sprint
   ↓
3. Agrega endpoints REST en el controlador Java
   ↓
4. Crea la página React con data-tour
   ↓
5. Configura el tour en tour-configs.ts
   ↓
6. Agrega tutorial en AyudaPage.tsx
   ↓
7. Agrega versión en NovedadesPage.tsx
   ↓
8. Ejecuta: node scripts/generate-docs.js
   ↓
9. Revisa: PRESENTACION_SISTEMA.html y ENDPOINTS_REPORT.md
   ↓
10. Commit y push
    ↓
11. ✅ Documentación actualizada para todos los usuarios
```

## 🎯 Mejores Prácticas

1. **Tours concisos:** 5-10 pasos máximo por tour
2. **Lenguaje simple:** Evitar jerga técnica
3. **Casos de uso reales:** Ejemplos prácticos en tutoriales
4. **Actualización frecuente:** Actualizar con cada sprint
5. **Feedback de usuarios:** Iterar basado en preguntas frecuentes
6. **Testear tours:** Verificar que los selectores CSS funcionen
7. **Documentar todo:** Cada funcionalidad debe tener tutorial

## 🚧 Próximas Mejoras

- [ ] Video tutoriales integrados
- [ ] Sistema de búsqueda global en la ayuda
- [ ] Chatbot de ayuda con IA
- [ ] Análisis de uso de tours (qué pasos se saltan más)
- [ ] Tours contextuales (aparecen al detectar confusión)
- [ ] Exportar tutoriales a PDF
- [ ] Modo oscuro para la presentación
- [ ] Notificaciones de nuevas funcionalidades

## 📞 Soporte

Si tienes dudas sobre el sistema de ayuda:
1. Revisa esta documentación
2. Consulta los ejemplos en el código
3. Ejecuta `node scripts/generate-docs.js` para ver si hay errores
4. Revisa la consola del navegador para errores de tours

---

**Última actualización:** 11 Enero 2025
**Versión del sistema:** 0.3.0
**Desarrollado por:** Claude Code
