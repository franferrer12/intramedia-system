import { ZodError } from 'zod';

/**
 * Validation Middleware Factory
 * Crea middleware para validar request usando schemas de Zod
 *
 * @param {Object} schemas - Objeto con schemas de Zod para validar
 * @param {Object} schemas.body - Schema para validar req.body
 * @param {Object} schemas.params - Schema para validar req.params
 * @param {Object} schemas.query - Schema para validar req.query
 * @returns {Function} Express middleware
 *
 * @example
 * // Validar solo el body
 * router.post('/eventos', validate({ body: createEventoSchema }), controller.create);
 *
 * @example
 * // Validar params y body
 * router.put('/eventos/:id', validate({
 *   params: eventoIdSchema,
 *   body: updateEventoSchema
 * }), controller.update);
 *
 * @example
 * // Validar query params
 * router.get('/eventos', validate({ query: listEventosQuerySchema }), controller.list);
 */
export const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      const validated = {};

      // Validar body si existe schema
      if (schemas.body) {
        validated.body = await schemas.body.parseAsync(req.body);
        req.body = validated.body; // Reemplazar con datos validados y transformados
      }

      // Validar params si existe schema
      if (schemas.params) {
        validated.params = await schemas.params.parseAsync(req.params);
        req.params = validated.params;
      }

      // Validar query si existe schema
      if (schemas.query) {
        validated.query = await schemas.query.parseAsync(req.query);
        req.query = validated.query;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      // Error inesperado
      console.error('Error en validación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno en validación'
      });
    }
  };
};

/**
 * Middleware de validación especializado para IDs numéricos
 * Valida y transforma el ID a número
 *
 * @example
 * router.get('/eventos/:id', validateId, controller.getById);
 */
export const validateId = (req, res, next) => {
  const { id } = req.params;

  // Validar que sea un número válido
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID inválido',
      errors: [{
        field: 'id',
        message: 'El ID debe ser un número entero positivo'
      }]
    });
  }

  // Transformar a número
  req.params.id = parseInt(id, 10);

  // Validar rango
  if (req.params.id <= 0 || req.params.id > 2147483647) { // Max PostgreSQL INT
    return res.status(400).json({
      success: false,
      message: 'ID fuera de rango',
      errors: [{
        field: 'id',
        message: 'El ID debe estar entre 1 y 2147483647'
      }]
    });
  }

  next();
};

/**
 * Middleware para validar paginación
 * Valida y establece valores por defecto para page y limit
 *
 * @param {Object} options - Opciones de configuración
 * @param {number} options.defaultPage - Página por defecto (default: 1)
 * @param {number} options.defaultLimit - Límite por defecto (default: 20)
 * @param {number} options.maxLimit - Límite máximo (default: 100)
 *
 * @example
 * router.get('/eventos', validatePagination(), controller.list);
 * router.get('/clientes', validatePagination({ maxLimit: 50 }), controller.list);
 */
export const validatePagination = (options = {}) => {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100
  } = options;

  return (req, res, next) => {
    // Validar y transformar page
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) {
      page = defaultPage;
    }

    // Validar y transformar limit
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    }
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    // Añadir a query ya validado
    req.query.page = page;
    req.query.limit = limit;

    next();
  };
};

/**
 * Middleware para sanitizar strings en el body
 * Elimina espacios en blanco al inicio y final de strings
 *
 * @example
 * router.post('/eventos', sanitizeBody, validate({ body: createEventoSchema }), controller.create);
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitized = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? item.trim() : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    req.body = sanitized;
  }

  next();
};

/**
 * Middleware para validar fechas en formato ISO
 *
 * @param {string[]} fields - Array de campos de fecha a validar
 *
 * @example
 * router.post('/eventos', validateDates(['fecha', 'start_date']), controller.create);
 */
export const validateDates = (fields = []) => {
  return (req, res, next) => {
    const errors = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const field of fields) {
      const value = req.body[field];

      if (value) {
        // Validar formato
        if (!dateRegex.test(value)) {
          errors.push({
            field,
            message: `${field} debe estar en formato YYYY-MM-DD`
          });
          continue;
        }

        // Validar que sea una fecha válida
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push({
            field,
            message: `${field} no es una fecha válida`
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación de fechas',
        errors
      });
    }

    next();
  };
};

export default {
  validate,
  validateId,
  validatePagination,
  sanitizeBody,
  validateDates
};
