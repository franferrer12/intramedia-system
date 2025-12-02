import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { announceToScreenReader } from './accessibility';

/**
 * Enhanced Toast Notifications with WCAG 2.1 compliance
 * Includes screen reader announcements and better visual feedback
 */

const TOAST_CONFIG = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '0.5rem',
    padding: '1rem',
    fontSize: '0.875rem',
    maxWidth: '500px',
  },
};

/**
 * Custom Toast Component with Icon and Dismiss Button
 */
const CustomToast = ({ type, title, message, t }) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  };

  const iconColors = {
    success: 'text-green-400 dark:text-green-300',
    error: 'text-red-400 dark:text-red-300',
    warning: 'text-yellow-400 dark:text-yellow-300',
    info: 'text-blue-400 dark:text-blue-300',
  };

  const Icon = icons[type];

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`${colors[type]} rounded-lg shadow-lg p-4 flex items-start space-x-3 max-w-md ${
        t.visible ? 'animate-enter' : 'animate-leave'
      }`}
    >
      <Icon className={`h-6 w-6 flex-shrink-0 ${iconColors[type]}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
        aria-label="Cerrar notificación"
      >
        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
};

/**
 * Success Toast
 */
export const showSuccess = (message, title = 'Éxito') => {
  announceToScreenReader(`${title}: ${message}`, 'polite');

  return toast.custom(
    (t) => <CustomToast type="success" title={title} message={message} t={t} />,
    TOAST_CONFIG
  );
};

/**
 * Error Toast
 */
export const showError = (message, title = 'Error') => {
  announceToScreenReader(`${title}: ${message}`, 'assertive');

  return toast.custom(
    (t) => <CustomToast type="error" title={title} message={message} t={t} />,
    {
      ...TOAST_CONFIG,
      duration: 6000, // Errors stay longer
    }
  );
};

/**
 * Warning Toast
 */
export const showWarning = (message, title = 'Advertencia') => {
  announceToScreenReader(`${title}: ${message}`, 'polite');

  return toast.custom(
    (t) => <CustomToast type="warning" title={title} message={message} t={t} />,
    TOAST_CONFIG
  );
};

/**
 * Info Toast
 */
export const showInfo = (message, title = 'Información') => {
  announceToScreenReader(`${title}: ${message}`, 'polite');

  return toast.custom(
    (t) => <CustomToast type="info" title={title} message={message} t={t} />,
    TOAST_CONFIG
  );
};

/**
 * Loading Toast with Promise
 */
export const showLoading = (promise, messages = {}) => {
  const defaultMessages = {
    loading: 'Procesando...',
    success: 'Operación completada',
    error: 'Error en la operación',
  };

  const finalMessages = { ...defaultMessages, ...messages };

  announceToScreenReader(finalMessages.loading, 'polite');

  return toast.promise(
    promise,
    {
      loading: finalMessages.loading,
      success: (data) => {
        announceToScreenReader(finalMessages.success, 'polite');
        return finalMessages.success;
      },
      error: (err) => {
        const errorMessage = err?.response?.data?.message || finalMessages.error;
        announceToScreenReader(errorMessage, 'assertive');
        return errorMessage;
      },
    },
    {
      ...TOAST_CONFIG,
      style: {
        ...TOAST_CONFIG.style,
        minWidth: '250px',
      },
    }
  );
};

/**
 * Confirmation Toast with Action
 */
export const showConfirmation = (message, onConfirm, onCancel) => {
  return toast.custom(
    (t) => (
      <div
        role="alertdialog"
        aria-live="assertive"
        aria-labelledby="toast-title"
        aria-describedby="toast-message"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md"
      >
        <div className="flex items-start">
          <ExclamationTriangleIcon
            className="h-6 w-6 text-yellow-400 flex-shrink-0"
            aria-hidden="true"
          />
          <div className="ml-3 flex-1">
            <p id="toast-title" className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Confirmación requerida
            </p>
            <p id="toast-message" className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {message}
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  toast.dismiss(t.id);
                  announceToScreenReader('Acción confirmada', 'polite');
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onCancel) onCancel();
                  toast.dismiss(t.id);
                  announceToScreenReader('Acción cancelada', 'polite');
                }}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: Infinity, // Manual dismiss only
      position: 'top-center',
    }
  );
};

/**
 * API Error Handler with user-friendly messages
 */
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);

  let message = customMessage || 'Ha ocurrido un error inesperado';

  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const data = error.response.data;

    if (data?.message) {
      message = data.message;
    } else {
      switch (status) {
        case 400:
          message = 'Solicitud inválida. Verifica los datos ingresados.';
          break;
        case 401:
          message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          break;
        case 403:
          message = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          message = 'El recurso solicitado no existe.';
          break;
        case 409:
          message = 'Conflicto: El recurso ya existe o está en uso.';
          break;
        case 422:
          message = 'Datos de validación incorrectos.';
          break;
        case 429:
          message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.';
          break;
        case 500:
          message = 'Error del servidor. Por favor, contacta con soporte.';
          break;
        case 503:
          message = 'Servicio temporalmente no disponible. Intenta más tarde.';
          break;
        default:
          message = `Error ${status}: ${data?.error || 'Error desconocido'}`;
      }
    }

    // Handle validation errors
    if (data?.errors && Array.isArray(data.errors)) {
      const validationMessages = data.errors.map((err) => err.message || err).join(', ');
      message = `Errores de validación: ${validationMessages}`;
    }
  } else if (error.request) {
    // Request made but no response
    message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  } else {
    // Error in request configuration
    message = error.message || 'Error al procesar la solicitud.';
  }

  showError(message);
  return message;
};

/**
 * Success handlers for common operations
 */
export const toastHelpers = {
  created: (entity = 'Registro') => showSuccess(`${entity} creado correctamente`),
  updated: (entity = 'Registro') => showSuccess(`${entity} actualizado correctamente`),
  deleted: (entity = 'Registro') => showSuccess(`${entity} eliminado correctamente`),
  saved: () => showSuccess('Cambios guardados correctamente'),
  copied: () => showSuccess('Copiado al portapapeles'),
  sent: () => showSuccess('Enviado correctamente'),
  uploaded: () => showSuccess('Archivo subido correctamente'),
  downloaded: () => showSuccess('Descarga iniciada'),
  synced: () => showSuccess('Sincronización completada'),
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  confirmation: showConfirmation,
  apiError: handleApiError,
  ...toastHelpers,
};
