/**
 * Steve Jobs UX Middleware
 * "Simplicidad es la máxima sofisticación"
 *
 * Principios:
 * 1. Menos es más - Solo lo esencial
 * 2. Respuestas mínimas - Sin ruido
 * 3. Feedback instantáneo - <100ms
 * 4. Mensajes concisos - Max 3 palabras
 * 5. Just works - Cero fricción
 */

/**
 * Respuesta simplificada estilo Jobs
 * ❌ ANTES: 10+ campos
 * ✅ AHORA: 3-4 campos esenciales
 */
export const simpleResponse = (data, meta = {}) => {
  // Solo lo esencial
  const response = { data };

  // Metadata mínima y útil
  if (meta.total !== undefined) response.total = meta.total;
  if (meta.page !== undefined) response.page = meta.page;
  if (meta.hasMore !== undefined) response.hasMore = meta.hasMore;

  return response;
};

/**
 * Error simplificado estilo Jobs
 * ❌ ANTES: Mensaje largo con detalles técnicos
 * ✅ AHORA: 1-3 palabras + icono
 */
export const simpleError = (message, code = 500) => {
  // Mensaje ultra-conciso
  const errors = {
    400: 'Revisa los datos',
    401: 'Acceso denegado',
    403: 'Sin permisos',
    404: 'No encontrado',
    409: 'Ya existe',
    422: 'Datos inválidos',
    429: 'Espera un momento',
    500: 'Algo salió mal'
  };

  return {
    error: message || errors[code] || 'Error',
    code
  };
};

/**
 * Paginación minimalista
 * ❌ ANTES: 12 campos
 * ✅ AHORA: 4 campos
 */
export const simplePagination = (data, total, page, limit) => {
  return {
    data,
    total,
    page,
    hasMore: (page * limit) < total
  };
};

/**
 * Middleware para respuestas Jobs-style
 */
export const jobsUXMiddleware = (req, res, next) => {
  // Helper: Respuesta simple
  res.simple = (data, meta = {}) => {
    return res.json(simpleResponse(data, meta));
  };

  // Helper: Error simple
  res.simpleError = (message, code = 500) => {
    return res.status(code).json(simpleError(message, code));
  };

  // Helper: Lista paginada simple
  res.simplePaginated = (data, total, page = 1, limit = 20) => {
    return res.json(simplePagination(data, total, page, limit));
  };

  // Helper: Success mínimo (solo código 200)
  res.ok = () => {
    return res.status(200).end();
  };

  // Helper: Created mínimo
  res.created = (data) => {
    return res.status(201).json({ data });
  };

  next();
};

/**
 * Mensajes concisos en español
 * Máximo 3 palabras
 */
export const MESSAGES = {
  // Success (1 palabra)
  CREATED: 'Creado',
  UPDATED: 'Actualizado',
  DELETED: 'Eliminado',
  SENT: 'Enviado',
  SAVED: 'Guardado',

  // Errors (2-3 palabras)
  REQUIRED: 'Campo requerido',
  INVALID: 'No válido',
  NOT_FOUND: 'No encontrado',
  UNAUTHORIZED: 'Acceso denegado',
  FORBIDDEN: 'Sin permisos',
  CONFLICT: 'Ya existe',
  SERVER_ERROR: 'Algo salió mal',
  RATE_LIMIT: 'Espera un momento',

  // Actions (1 palabra)
  SAVE: 'Guardar',
  CANCEL: 'Cancelar',
  DELETE: 'Eliminar',
  EDIT: 'Editar',
  CREATE: 'Crear',
  SEARCH: 'Buscar',
  FILTER: 'Filtrar',
  EXPORT: 'Exportar',

  // Status (1-2 palabras)
  LOADING: 'Cargando',
  PROCESSING: 'Procesando',
  COMPLETE: 'Listo',
  PENDING: 'Pendiente',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo'
};

/**
 * Feedback States para UI
 * Metadata para animaciones y estados visuales
 */
export const FEEDBACK_STATES = {
  SUCCESS: {
    icon: '✓',
    color: '#34C759',
    animation: 'checkmark',
    duration: 2000,
    sound: 'success.mp3'
  },
  ERROR: {
    icon: '✗',
    color: '#FF3B30',
    animation: 'shake',
    duration: 3000,
    sound: 'error.mp3'
  },
  WARNING: {
    icon: '⚠',
    color: '#FF9500',
    animation: 'pulse',
    duration: 4000
  },
  INFO: {
    icon: 'ℹ',
    color: '#007AFF',
    animation: 'fade',
    duration: 3000
  },
  LOADING: {
    icon: '⟳',
    color: '#6E6E73',
    animation: 'spin',
    duration: null  // Hasta que termine
  }
};

/**
 * Smart Defaults
 * Pre-llenar lo obvio para reducir fricción
 */
export const smartDefaults = (type, context = {}) => {
  const now = new Date();

  const defaults = {
    evento: {
      fecha: now.toISOString().split('T')[0],
      hora: '20:00',
      duracion: 6,
      precio: context.avgPrice || 500,
      estado: 'pendiente'
    },
    cliente: {
      tipo_cliente: 'empresa',
      pais: 'España',
      moneda: 'EUR'
    },
    cotizacion: {
      validez_dias: 30,
      descuento: 0,
      iva: 21,
      moneda: 'EUR'
    }
  };

  return defaults[type] || {};
};

/**
 * Quick Actions
 * Acciones rápidas de 1 clic
 */
export const QUICK_ACTIONS = {
  evento: [
    { label: 'Marcar pagado', action: 'mark_paid', icon: '✓', color: 'success' },
    { label: 'Duplicar', action: 'duplicate', icon: '⎘', color: 'primary' },
    { label: 'Eliminar', action: 'delete', icon: '🗑', color: 'danger' }
  ],
  dj: [
    { label: 'Ver eventos', action: 'view_events', icon: '📅', color: 'primary' },
    { label: 'Enviar mensaje', action: 'send_message', icon: '✉', color: 'info' },
    { label: 'Ver stats', action: 'view_stats', icon: '📊', color: 'info' }
  ],
  cliente: [
    { label: 'Nuevo evento', action: 'new_event', icon: '+', color: 'success' },
    { label: 'Ver historial', action: 'view_history', icon: '📋', color: 'primary' },
    { label: 'Enviar factura', action: 'send_invoice', icon: '📄', color: 'info' }
  ]
};

/**
 * Keyboard Shortcuts metadata
 * Para UI implementar atajos de teclado
 */
export const SHORTCUTS = {
  'cmd+k': { action: 'search', description: 'Buscar' },
  'cmd+n': { action: 'new', description: 'Nuevo' },
  'cmd+s': { action: 'save', description: 'Guardar' },
  'cmd+z': { action: 'undo', description: 'Deshacer' },
  'esc': { action: 'close', description: 'Cerrar' },
  '/': { action: 'focus_search', description: 'Buscar' },
  '?': { action: 'help', description: 'Ayuda' }
};

/**
 * Micro-interactions metadata
 * Para que el frontend pueda implementar animaciones
 */
export const MICRO_INTERACTIONS = {
  button_click: {
    animation: 'scale',
    from: 1,
    to: 0.95,
    duration: 100,
    easing: 'ease-out'
  },
  button_hover: {
    animation: 'scale',
    from: 1,
    to: 1.02,
    duration: 200,
    easing: 'ease'
  },
  list_item_appear: {
    animation: 'slideInUp',
    duration: 300,
    easing: 'ease-out',
    stagger: 50  // Delay entre items
  },
  success_checkmark: {
    animation: 'checkmark',
    duration: 400,
    easing: 'spring(1, 80, 10, 0)'
  },
  error_shake: {
    animation: 'shake',
    duration: 400,
    keyframes: [0, -10, 10, -10, 10, -5, 5, 0]
  }
};

/**
 * Empty States
 * Mensajes cuando no hay datos
 */
export const EMPTY_STATES = {
  eventos: {
    icon: '📅',
    title: 'Sin eventos',
    subtitle: 'Crea tu primer evento',
    action: { label: 'Crear evento', icon: '+' }
  },
  djs: {
    icon: '🎧',
    title: 'Sin DJs',
    subtitle: 'Agrega tu primer DJ',
    action: { label: 'Agregar DJ', icon: '+' }
  },
  clientes: {
    icon: '🏢',
    title: 'Sin clientes',
    subtitle: 'Agrega tu primer cliente',
    action: { label: 'Agregar cliente', icon: '+' }
  },
  search: {
    icon: '🔍',
    title: 'Sin resultados',
    subtitle: 'Intenta otra búsqueda',
    action: { label: 'Limpiar filtros', icon: '✕' }
  }
};

/**
 * Optimistic UI Helper
 * Para actualizar UI antes de confirmar con servidor
 */
export const optimisticUpdate = (item, changes) => {
  return {
    ...item,
    ...changes,
    _optimistic: true,  // Flag para UI
    _timestamp: Date.now()
  };
};

/**
 * Validation messages simplificados
 */
export const validationMessages = (field, rule) => {
  const messages = {
    required: 'Requerido',
    email: 'Email inválido',
    phone: 'Teléfono inválido',
    min: 'Muy corto',
    max: 'Muy largo',
    number: 'Debe ser número',
    positive: 'Debe ser positivo',
    date: 'Fecha inválida'
  };

  return messages[rule] || 'Inválido';
};

/**
 * Toast/Snackbar configuration
 * Para mostrar feedback temporal
 */
export const TOAST_CONFIG = {
  success: {
    duration: 2000,
    position: 'top-center',
    style: {
      background: '#34C759',
      color: 'white',
      borderRadius: '12px',
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '500'
    }
  },
  error: {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#FF3B30',
      color: 'white',
      borderRadius: '12px',
      padding: '12px 24px'
    }
  },
  info: {
    duration: 3000,
    position: 'bottom-center',
    style: {
      background: '#007AFF',
      color: 'white',
      borderRadius: '12px',
      padding: '12px 24px'
    }
  }
};

export default {
  simpleResponse,
  simpleError,
  simplePagination,
  jobsUXMiddleware,
  MESSAGES,
  FEEDBACK_STATES,
  smartDefaults,
  QUICK_ACTIONS,
  SHORTCUTS,
  MICRO_INTERACTIONS,
  EMPTY_STATES,
  optimisticUpdate,
  validationMessages,
  TOAST_CONFIG
};
