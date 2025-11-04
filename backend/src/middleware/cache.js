/**
 * In-Memory Cache Middleware
 * Sistema de cache simple y eficiente sin dependencias externas
 */

class CacheStore {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  set(key, value, ttl = 300000) { // TTL default: 5 minutos
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + ttl);
  }

  get(key) {
    const ttl = this.ttls.get(key);

    if (!ttl || Date.now() > ttl) {
      // Expirado
      this.cache.delete(key);
      this.ttls.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttls.clear();
  }

  size() {
    return this.cache.size;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, ttl] of this.ttls.entries()) {
      if (now > ttl) {
        this.cache.delete(key);
        this.ttls.delete(key);
      }
    }
  }
}

// Singleton cache store
const cacheStore = new CacheStore();

// Cleanup cada 10 minutos
setInterval(() => {
  cacheStore.cleanup();
}, 10 * 60 * 1000);

/**
 * Cache middleware
 * @param {Object} options - Opciones de configuración
 * @param {Number} options.ttl - Time to live en ms (default: 300000 = 5 min)
 * @param {Function} options.keyGenerator - Función para generar la cache key
 * @param {Boolean} options.cacheIfError - Cache también si hay error (default: false)
 */
export const cache = (options = {}) => {
  const ttl = options.ttl || 300000; // 5 minutos por defecto
  const keyGenerator = options.keyGenerator || ((req) => {
    // Key por defecto: método + URL + query params
    const queryString = Object.keys(req.query).length > 0
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    return `${req.method}:${req.baseUrl}${req.path}${queryString}`;
  });
  const cacheIfError = options.cacheIfError || false;

  return (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedResponse = cacheStore.get(cacheKey);

    if (cachedResponse) {
      // Cache hit
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Cache miss - interceptar la respuesta
    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Solo cachear respuestas exitosas (o todas si cacheIfError=true)
      if (res.statusCode === 200 || (cacheIfError && res.statusCode < 500)) {
        cacheStore.set(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache de corta duración (1 minuto) para endpoints muy consultados
 */
export const shortCache = cache({ ttl: 60 * 1000 });

/**
 * Cache de larga duración (15 minutos) para datos que cambian poco
 */
export const longCache = cache({ ttl: 15 * 60 * 1000 });

/**
 * Cache personalizado por usuario
 */
export const userCache = cache({
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    const queryString = Object.keys(req.query).length > 0
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    return `${userId}:${req.method}:${req.baseUrl}${req.path}${queryString}`;
  }
});

/**
 * Invalidar cache manualmente
 */
export const invalidateCache = (pattern) => {
  if (!pattern) {
    cacheStore.clear();
    return;
  }

  // Invalidar por patrón
  const regex = new RegExp(pattern);
  for (const [key] of cacheStore.cache.entries()) {
    if (regex.test(key)) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Obtener estadísticas del cache
 */
export const getCacheStats = () => {
  return {
    size: cacheStore.size(),
    entries: Array.from(cacheStore.cache.keys())
  };
};

export default {
  cache,
  shortCache,
  longCache,
  userCache,
  invalidateCache,
  getCacheStats
};
