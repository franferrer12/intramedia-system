/**
 * Response Formatter Middleware
 * Estandariza todas las respuestas de la API para mejor UX
 */

/**
 * Formato estándar de respuesta exitosa
 * @param {Object} data - Datos a retornar
 * @param {String} message - Mensaje opcional
 * @param {Object} meta - Metadata adicional
 */
export const successResponse = (data, message = null, meta = {}) => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    ...meta
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Formato estándar de respuesta de error
 * @param {String} message - Mensaje de error user-friendly
 * @param {Number} statusCode - Código HTTP
 * @param {Object} details - Detalles técnicos (solo en desarrollo)
 * @param {Array} errors - Array de errores de validación
 */
export const errorResponse = (message, statusCode = 500, details = null, errors = null) => {
  const response = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      message: message,
      statusCode: statusCode,
      type: getErrorType(statusCode)
    }
  };

  // Incluir detalles técnicos solo en desarrollo
  if (details && process.env.NODE_ENV === 'development') {
    response.error.details = details;
  }

  // Incluir errores de validación si existen
  if (errors && Array.isArray(errors)) {
    response.error.validation = errors;
  }

  return response;
};

/**
 * Determina el tipo de error basado en el código HTTP
 */
function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    const types = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED'
    };
    return types[statusCode] || 'CLIENT_ERROR';
  }

  if (statusCode >= 500) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Respuesta paginada mejorada
 */
export const paginatedResponse = (data, total, pagination, message = null) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return successResponse(data, message, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
      // Información adicional útil para UX
      showing: {
        from: total === 0 ? 0 : (page - 1) * limit + 1,
        to: Math.min(page * limit, total),
        of: total
      }
    }
  });
};

/**
 * Mensajes de error user-friendly en español
 */
export const USER_FRIENDLY_ERRORS = {
  // Database errors
  ECONNREFUSED: 'No se pudo conectar a la base de datos. Por favor, inténtalo más tarde.',
  ETIMEDOUT: 'La operación tardó demasiado tiempo. Por favor, inténtalo de nuevo.',

  // Validation errors
  VALIDATION_FAILED: 'Los datos proporcionados no son válidos. Por favor, revisa los campos marcados.',
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'El formato del email no es válido',
  INVALID_PHONE: 'El formato del teléfono no es válido',
  INVALID_DATE: 'La fecha no es válida',
  MIN_LENGTH: 'El valor es demasiado corto',
  MAX_LENGTH: 'El valor es demasiado largo',

  // Authentication errors
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción. Por favor, inicia sesión.',
  FORBIDDEN: 'No tienes permisos suficientes para acceder a este recurso.',
  TOKEN_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos',

  // Resource errors
  NOT_FOUND: 'El recurso solicitado no existe o fue eliminado.',
  ALREADY_EXISTS: 'Este recurso ya existe en el sistema.',
  CONFLICT: 'No se puede completar la operación debido a un conflicto con el estado actual.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Has superado el límite de solicitudes. Por favor, espera un momento antes de intentar de nuevo.',

  // Generic errors
  INTERNAL_SERVER_ERROR: 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible temporalmente. Por favor, inténtalo más tarde.',
};

/**
 * Middleware para añadir funciones helper al response object
 */
export const responseFormatterMiddleware = (req, res, next) => {
  // Helper para respuestas exitosas
  res.success = (data, message = null, meta = {}) => {
    return res.json(successResponse(data, message, meta));
  };

  // Helper para respuestas de error
  res.error = (message, statusCode = 500, details = null, errors = null) => {
    return res.status(statusCode).json(errorResponse(message, statusCode, details, errors));
  };

  // Helper para respuestas paginadas
  res.paginated = (data, total, pagination, message = null) => {
    return res.json(paginatedResponse(data, total, pagination, message));
  };

  // Helper para not found
  res.notFound = (message = USER_FRIENDLY_ERRORS.NOT_FOUND) => {
    return res.error(message, 404);
  };

  // Helper para unauthorized
  res.unauthorized = (message = USER_FRIENDLY_ERRORS.UNAUTHORIZED) => {
    return res.error(message, 401);
  };

  // Helper para forbidden
  res.forbidden = (message = USER_FRIENDLY_ERRORS.FORBIDDEN) => {
    return res.error(message, 403);
  };

  // Helper para validation errors
  res.validationError = (errors, message = USER_FRIENDLY_ERRORS.VALIDATION_FAILED) => {
    return res.error(message, 422, null, errors);
  };

  // Helper para conflictos
  res.conflict = (message = USER_FRIENDLY_ERRORS.CONFLICT) => {
    return res.error(message, 409);
  };

  next();
};

/**
 * Formatea errores de base de datos a mensajes user-friendly
 */
export const formatDatabaseError = (error) => {
  // PostgreSQL error codes
  const pgErrorCodes = {
    '23505': 'Ya existe un registro con estos datos',
    '23503': 'No se puede eliminar porque está siendo usado en otro lugar',
    '23502': 'Falta información requerida',
    '22P02': 'El formato de los datos no es válido',
    '42P01': 'Recurso no encontrado',
  };

  if (error.code && pgErrorCodes[error.code]) {
    return pgErrorCodes[error.code];
  }

  // Generic database error
  return USER_FRIENDLY_ERRORS.INTERNAL_SERVER_ERROR;
};

/**
 * Logger de respuestas para debugging
 */
export const responseLogger = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
      if (data.success === false) {
        console.error('Error:', data.error);
      }
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  USER_FRIENDLY_ERRORS,
  responseFormatterMiddleware,
  formatDatabaseError,
  responseLogger
};
