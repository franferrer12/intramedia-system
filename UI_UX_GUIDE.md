# 🎨 UI/UX Polish Guide
## Sprint 6.2 - Accessibility & Error Handling

**Fecha:** Diciembre 2025
**Estado:** Implementado
**Estándar:** WCAG 2.1 Level AA

---

## 📋 Tabla de Contenidos

1. [Accessibility Features](#accessibility-features)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Loading States](#loading-states)
5. [Error Handling](#error-handling)
6. [Toast Notifications](#toast-notifications)
7. [Implementation Guide](#implementation-guide)
8. [Testing Checklist](#testing-checklist)

---

## 🦽 Accessibility Features

### WCAG 2.1 Level AA Compliance

#### ✅ Keyboard Navigation
- **Tab Navigation:** Todos los elementos interactivos son accesibles con Tab
- **Skip Links:** "Saltar al contenido principal" para navegación rápida
- **Focus Indicators:** Indicadores visuales claros en elementos enfocados
- **Roving Tabindex:** Navegación eficiente en listas y grids

#### ✅ Screen Reader Support
- **ARIA Labels:** Etiquetas descriptivas en todos los componentes
- **ARIA Live Regions:** Anuncios automáticos de cambios dinámicos
- **Semantic HTML:** Uso correcto de elementos HTML5
- **Alt Text:** Texto alternativo en todas las imágenes

#### ✅ Visual Accessibility
- **High Contrast Mode:** Soporte para modo de alto contraste
- **Reduced Motion:** Respeta preferencias de movimiento reducido
- **Focus Visible:** Indicadores de foco claros (2px outline blue)
- **Color Contrast:** Ratios de contraste WCAG AA (4.5:1 text, 3:1 UI)

---

## ⌨️ Keyboard Navigation

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + K` | Abrir paleta de comandos | Global |
| `Ctrl/Cmd + /` | Mostrar atajos de teclado | Global |
| `Ctrl/Cmd + S` | Guardar formulario | En formularios |
| `Escape` | Cerrar modal/cancelar | Modales y formularios |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + H` | Ir a Dashboard |
| `Alt + E` | Ir a Eventos |
| `Alt + D` | Ir a DJs |
| `Alt + C` | Ir a Clientes |
| `Alt + L` | Ir a Leads |
| `Alt + F` | Ir a Dashboard Financiero |
| `Alt + K` | Ir a Calendario |
| `Alt + S` | Ir a Configuración |

### Table Navigation

| Key | Action |
|-----|--------|
| `↑ ↓` | Navegar entre filas |
| `Enter` | Seleccionar/Abrir elemento |
| `Space` | Marcar/Desmarcar checkbox |
| `Home` | Ir a primera fila |
| `End` | Ir a última fila |

### Implementation

```javascript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  // Global shortcuts are automatically active
  useKeyboardShortcuts();

  // Or add custom shortcuts
  useKeyboardShortcuts({
    'ctrl+n': () => handleNew(),
    'ctrl+e': () => handleEdit(),
    'del': () => handleDelete(),
  });
}
```

---

## 🔊 Screen Reader Support

### Accessibility Utils

```javascript
import {
  announceToScreenReader,
  getStatusAriaLabel,
  formatDateForScreenReader,
  formatCurrencyForScreenReader,
} from '@/utils/accessibility';

// Announce dynamic changes
announceToScreenReader('Evento creado correctamente', 'polite');
announceToScreenReader('Error crítico', 'assertive');

// Format data for screen readers
const dateLabel = formatDateForScreenReader(new Date());
// "lunes, 2 de diciembre de 2024"

const priceLabel = formatCurrencyForScreenReader(1500.50);
// "1500.50 euros"
```

### ARIA Labels

```jsx
// Status badges
<span
  className="badge"
  role="status"
  aria-label={getStatusAriaLabel('confirmed')}
>
  Confirmado
</span>

// Interactive elements
<button
  aria-label="Editar evento"
  aria-describedby="evento-name"
>
  <PencilIcon aria-hidden="true" />
</button>

// Dynamic content
<div role="region" aria-live="polite" aria-atomic="true">
  {notification.message}
</div>
```

### Semantic HTML

```jsx
// ✅ Good - Semantic HTML
<header>
  <nav aria-label="Navegación principal">
    <ul>
      <li><a href="/">Inicio</a></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <article>
    <h1>Título</h1>
    <section>Contenido</section>
  </article>
</main>

<footer>
  <p>&copy; 2024</p>
</footer>

// ❌ Bad - Divs everywhere
<div class="header">
  <div class="nav">
    <div class="link">Inicio</div>
  </div>
</div>
```

---

## ⏳ Loading States

### Skeleton Loaders

Consistent loading placeholders with accessibility support.

#### Available Components

```javascript
import {
  TableSkeleton,
  CardSkeleton,
  ListItemSkeleton,
  DashboardCardSkeleton,
  FormSkeleton,
  CalendarSkeleton,
  ChartSkeleton,
  StatsGridSkeleton,
} from '@/components/SkeletonLoader';
```

#### Usage

```jsx
function EventsList() {
  const { data, isLoading } = useQuery('eventos');

  if (isLoading) {
    return <TableSkeleton rows={10} columns={6} />;
  }

  return <EventsTable data={data} />;
}

function Dashboard() {
  if (isLoading) {
    return (
      <>
        <StatsGridSkeleton cards={4} />
        <ChartSkeleton height="20rem" />
      </>
    );
  }

  return <DashboardContent />;
}
```

#### Custom Skeletons

```jsx
import Skeleton from '@/components/SkeletonLoader';

<div className="space-y-4">
  <Skeleton height="2rem" width="60%" />
  <Skeleton height="1rem" width="100%" />
  <Skeleton height="1rem" width="80%" />
  <Skeleton circle width="4rem" height="4rem" />
</div>
```

### Features

- **Accessible:** `role="status"` and screen reader announcements
- **Reduced Motion:** Respects `prefers-reduced-motion`
- **Dark Mode:** Automatic dark mode support
- **Customizable:** Flexible sizing and styling

---

## 🚨 Error Handling

### Error Boundaries

Catch React errors and display fallback UI.

#### Implementation

```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Full page error boundary (already in App.jsx)
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// Component-level error boundary
<ErrorBoundary level="minimal" showDetails={false}>
  <ComplexComponent />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary
  fallback={({ error, resetError }) => (
    <div>
      <h1>Oops! {error.message}</h1>
      <button onClick={resetError}>Try again</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

#### Async Error Boundary

For lazy-loaded components:

```jsx
import { lazy, Suspense } from 'react';
import { AsyncErrorBoundary } from '@/components/ErrorBoundary';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<AsyncErrorBoundary>
  <Suspense fallback={<Skeleton />}>
    <HeavyComponent />
  </Suspense>
</AsyncErrorBoundary>
```

#### Error Logging

```jsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to monitoring service
    console.error('Error caught:', error, errorInfo);
    // Sentry.captureException(error);
  }}
>
  <YourApp />
</ErrorBoundary>
```

---

## 🔔 Toast Notifications

Enhanced toast notifications with accessibility and better UX.

### Usage

```javascript
import toast from '@/utils/toast';

// Success
toast.success('Evento creado correctamente');
toast.created('Evento');
toast.updated('Cliente');
toast.deleted('DJ');
toast.saved();

// Error
toast.error('Error al guardar');
toast.apiError(error); // Auto-format API errors

// Warning
toast.warning('Los cambios no se guardaron');

// Info
toast.info('Nueva funcionalidad disponible');

// Loading with Promise
toast.loading(
  apiCall(),
  {
    loading: 'Guardando...',
    success: 'Guardado correctamente',
    error: 'Error al guardar',
  }
);

// Confirmation
toast.confirmation(
  '¿Eliminar este evento?',
  () => handleDelete(),
  () => handleCancel()
);
```

### API Error Handling

```javascript
import { handleApiError } from '@/utils/toast';

try {
  await createEvento(data);
  toast.created('Evento');
} catch (error) {
  handleApiError(error); // Auto-formats error messages
}
```

### Features

- **Accessible:** ARIA live regions and screen reader announcements
- **Auto-dismiss:** Configurable duration (success: 4s, error: 6s)
- **Dismissible:** Click X to close
- **Icons:** Visual indicators for each type
- **Dark Mode:** Automatic dark mode support
- **Responsive:** Mobile-friendly positioning

---

## 🛠️ Implementation Guide

### 1. Adding Accessibility to Forms

```jsx
import { focusFirstError, generateId } from '@/utils/accessibility';
import { useFormShortcuts } from '@/hooks/useKeyboardShortcuts';

function MyForm() {
  const formRef = useRef();
  const [errors, setErrors] = useState({});
  const emailId = generateId('email');

  // Keyboard shortcuts
  useFormShortcuts({
    onSave: handleSubmit,
    onCancel: handleCancel,
  });

  const handleSubmit = async () => {
    try {
      await saveData();
      toast.success('Guardado correctamente');
    } catch (error) {
      focusFirstError(formRef);
      toast.apiError(error);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <label htmlFor={emailId} className="label">
        Email
        <span aria-label="requerido"> *</span>
      </label>
      <input
        id={emailId}
        type="email"
        aria-required="true"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? `${emailId}-error` : undefined}
      />
      {errors.email && (
        <p
          id={`${emailId}-error`}
          role="alert"
          className="text-red-600 text-sm"
        >
          {errors.email}
        </p>
      )}
    </form>
  );
}
```

### 2. Adding Loading States

```jsx
function DataTable() {
  const { data, isLoading, error } = useQuery('data');

  if (error) {
    return (
      <div role="alert" className="error-message">
        Error: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return <TableSkeleton rows={10} columns={5} />;
  }

  return <Table data={data} />;
}
```

### 3. Adding Keyboard Navigation

```jsx
import { useModalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { trapFocus } from '@/utils/accessibility';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef();

  useModalShortcuts(isOpen, onClose);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      return cleanup;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Título del Modal</h2>
      {children}
    </div>
  );
}
```

---

## ✅ Testing Checklist

### Keyboard Navigation Testing

- [ ] Tab key cycles through all interactive elements
- [ ] Shift+Tab goes backward
- [ ] Enter activates buttons and links
- [ ] Space toggles checkboxes
- [ ] Escape closes modals
- [ ] Arrow keys navigate lists/menus
- [ ] Focus indicators are visible
- [ ] No keyboard traps

### Screen Reader Testing

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Dynamic content announces changes
- [ ] Status messages are announced
- [ ] Error messages are associated with inputs
- [ ] Headings create logical structure

### Visual Testing

- [ ] Focus indicators visible (not just browser default)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] UI works without color alone
- [ ] Text resizes to 200% without breaking
- [ ] UI works at different zoom levels

### Error Handling Testing

- [ ] All async operations have loading states
- [ ] All errors display user-friendly messages
- [ ] Failed requests can be retried
- [ ] Error boundaries catch component errors
- [ ] Network errors display appropriate messages

### Tools

- **Lighthouse:** Accessibility audit in Chrome DevTools
- **axe DevTools:** Browser extension for accessibility testing
- **NVDA/JAWS:** Screen reader testing (Windows)
- **VoiceOver:** Screen reader testing (macOS/iOS)
- **Keyboard only:** Complete flow without mouse

---

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## 🎯 Benefits

### User Experience
- ✅ Faster navigation with keyboard shortcuts
- ✅ Better feedback with loading states
- ✅ Clear error messages
- ✅ Accessible to all users

### Developer Experience
- ✅ Reusable components
- ✅ Consistent patterns
- ✅ Better error debugging
- ✅ Easy to test

### Business Impact
- ✅ Legal compliance (ADA, Section 508)
- ✅ Larger addressable market (15% of population)
- ✅ Better SEO
- ✅ Improved user retention

---

**Última actualización:** Diciembre 2025
**Mantenido por:** Frontend Team
**Contacto:** dev@intramedia.com
