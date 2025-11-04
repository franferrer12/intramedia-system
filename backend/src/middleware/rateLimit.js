/**
 * Rate Limiting Middleware
 * Protección contra abuso de API
 */

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto por defecto

/**
 * Limpia los contadores antiguos
 */
function cleanup() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}

// Cleanup cada 5 minutos
setInterval(cleanup, 5 * 60 * 1000);

/**
 * Rate limit middleware
 * @param {Object} options - Opciones de configuración
 * @param {Number} options.windowMs - Ventana de tiempo en ms (default: 60000)
 * @param {Number} options.max - Máximo de requests permitidos (default: 100)
 * @param {Function} options.keyGenerator - Función para generar la key (default: IP)
 * @param {String} options.message - Mensaje de error personalizado
 */
export const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || WINDOW_MS;
  const max = options.max || MAX_REQUESTS;
  const keyGenerator = options.keyGenerator || ((req) => req.ip || req.connection.remoteAddress);
  const message = options.message || 'Demasiadas peticiones, por favor intenta de nuevo más tarde';

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      requestCounts.set(key, record);
    } else {
      if (now > record.resetTime) {
        // Reset si pasó la ventana de tiempo
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }
    }

    // Headers informativos
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfter
      });
    }

    next();
  };
};

/**
 * Rate limit estricto para endpoints de autenticación
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos'
});

/**
 * Rate limit para APIs públicas
 */
export const publicApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 requests por minuto
  message: 'Límite de peticiones alcanzado para la API pública'
});

/**
 * Rate limit para creación de recursos
 */
export const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: 'Demasiadas creaciones, por favor espera un momento'
});

export default {
  rateLimit,
  strictRateLimit,
  publicApiRateLimit,
  createRateLimit
};
