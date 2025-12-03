import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Sistema unificado de notificaciones
 */
export const notify = {
  /**
   * Notificación de éxito
   */
  success: (message: string, options?: NotificationOptions) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      dismissible: options?.dismissible !== false,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Notificación de error
   */
  error: (message: string, options?: NotificationOptions) => {
    return toast.error(message, {
      duration: options?.duration || 6000,
      dismissible: options?.dismissible !== false,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Notificación de advertencia
   */
  warning: (message: string, options?: NotificationOptions) => {
    return toast.warning(message, {
      duration: options?.duration || 5000,
      dismissible: options?.dismissible !== false,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Notificación informativa
   */
  info: (message: string, options?: NotificationOptions) => {
    return toast.info(message, {
      duration: options?.duration || 4000,
      dismissible: options?.dismissible !== false,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Notificación de carga (loading)
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Promesa con notificación automática
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Cerrar una notificación específica
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Cerrar todas las notificaciones
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Mensajes de error comunes de la API
 */
export const handleApiError = (error: any, defaultMessage: string = 'Ha ocurrido un error') => {
  if (!error.response) {
    notify.error('Error de conexión. Verifica tu conexión a internet.');
    return;
  }

  const status = error.response.status;
  const message = error.response.data?.message || error.response.data?.error;

  switch (status) {
    case 400:
      notify.error(message || 'Datos inválidos. Verifica la información ingresada.');
      break;
    case 401:
      notify.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      break;
    case 403:
      notify.error('No tienes permisos para realizar esta acción.');
      break;
    case 404:
      notify.error(message || 'Recurso no encontrado.');
      break;
    case 409:
      notify.error(message || 'Ya existe un registro con estos datos.');
      break;
    case 422:
      notify.error(message || 'Datos inválidos. Verifica la información.');
      break;
    case 500:
      notify.error('Error del servidor. Intenta nuevamente más tarde.');
      break;
    case 503:
      notify.error('Servicio no disponible. Intenta nuevamente más tarde.');
      break;
    default:
      notify.error(message || defaultMessage);
  }
};

/**
 * Validaciones comunes con notificaciones
 */
export const validate = {
  required: (value: any, fieldName: string): boolean => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      notify.warning(`El campo "${fieldName}" es obligatorio`);
      return false;
    }
    return true;
  },

  email: (value: string, fieldName: string = 'Email'): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      notify.warning(`El ${fieldName} no es válido`);
      return false;
    }
    return true;
  },

  minLength: (value: string, min: number, fieldName: string): boolean => {
    if (value.length < min) {
      notify.warning(`${fieldName} debe tener al menos ${min} caracteres`);
      return false;
    }
    return true;
  },

  maxLength: (value: string, max: number, fieldName: string): boolean => {
    if (value.length > max) {
      notify.warning(`${fieldName} no debe exceder ${max} caracteres`);
      return false;
    }
    return true;
  },

  numeric: (value: any, fieldName: string): boolean => {
    if (isNaN(value) || value === '') {
      notify.warning(`${fieldName} debe ser un número válido`);
      return false;
    }
    return true;
  },

  positive: (value: number, fieldName: string): boolean => {
    if (value <= 0) {
      notify.warning(`${fieldName} debe ser mayor a 0`);
      return false;
    }
    return true;
  },

  range: (value: number, min: number, max: number, fieldName: string): boolean => {
    if (value < min || value > max) {
      notify.warning(`${fieldName} debe estar entre ${min} y ${max}`);
      return false;
    }
    return true;
  },

  date: (value: any, fieldName: string = 'Fecha'): boolean => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      notify.warning(`${fieldName} no es válida`);
      return false;
    }
    return true;
  },

  futureDate: (value: string, fieldName: string = 'Fecha'): boolean => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      notify.warning(`${fieldName} debe ser una fecha futura`);
      return false;
    }
    return true;
  },

  pastDate: (value: string, fieldName: string = 'Fecha'): boolean => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      notify.warning(`${fieldName} debe ser una fecha pasada o actual`);
      return false;
    }
    return true;
  },
};
