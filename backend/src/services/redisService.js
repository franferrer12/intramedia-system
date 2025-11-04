import { createClient } from 'redis';

/**
 * Redis Service for Caching
 * Provides caching layer with TTL support and graceful fallback
 */
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
    this.fallbackCache = new Map(); // In-memory fallback when Redis unavailable
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (!this.isEnabled) {
      console.log('📦 Redis caching is disabled. Using in-memory fallback.');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log('❌ Redis: Too many reconnection attempts. Disabling Redis.');
              this.isConnected = false;
              return false;
            }
            // Exponential backoff: 100ms, 200ms, 400ms, etc.
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connected and ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      console.log('📦 Falling back to in-memory cache');
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const value = await this.client.get(key);
        if (value) {
          return JSON.parse(value);
        }
        return null;
      } else {
        // Fallback to in-memory cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  async set(key, value, ttl = 300) {
    try {
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        // Fallback to in-memory cache
        this.fallbackCache.set(key, {
          value,
          expiresAt: Date.now() + (ttl * 1000)
        });
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error.message);
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key to delete
   */
  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error.message);
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Pattern to match keys (e.g., "user:*")
   */
  async delPattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // Fallback: delete keys matching pattern
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            this.fallbackCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error(`Redis DEL PATTERN error for pattern ${pattern}:`, error.message);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isConnected && this.client) {
        await this.client.flushDb();
      } else {
        this.fallbackCache.clear();
      }
    } catch (error) {
      console.error('Redis CLEAR error:', error.message);
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      if (this.isConnected && this.client) {
        return await this.client.exists(key) === 1;
      } else {
        const cached = this.fallbackCache.get(key);
        return cached && cached.expiresAt > Date.now();
      }
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key) {
    try {
      if (this.isConnected && this.client) {
        return await this.client.ttl(key);
      } else {
        const cached = this.fallbackCache.get(key);
        if (!cached) return -2;
        if (!cached.expiresAt) return -1;
        return Math.max(0, Math.floor((cached.expiresAt - Date.now()) / 1000));
      }
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error.message);
      return -2;
    }
  }

  /**
   * Cache middleware for Express routes
   * Usage: app.get('/api/data', redisService.cacheMiddleware(300), handlerFunction)
   *
   * @param {number} ttl - Time to live in seconds
   * @returns {Function} Express middleware function
   */
  cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
      // Generate cache key from route and query params
      const cacheKey = `cache:${req.originalUrl || req.url}`;

      try {
        const cachedData = await this.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache HIT: ${cacheKey}`);
          return res.json(cachedData);
        }

        console.log(`⚠️  Cache MISS: ${cacheKey}`);

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
          // Only cache successful responses
          if (res.statusCode === 200) {
            this.set(cacheKey, data, ttl).catch(err => {
              console.error('Failed to cache response:', err.message);
            });
          }
          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error.message);
        next();
      }
    };
  }

  /**
   * Get cache stats
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      if (this.isConnected && this.client) {
        const info = await this.client.info('stats');
        const memory = await this.client.info('memory');
        return {
          enabled: true,
          connected: this.isConnected,
          type: 'redis',
          info: { stats: info, memory: memory }
        };
      } else {
        return {
          enabled: this.isEnabled,
          connected: false,
          type: 'in-memory',
          size: this.fallbackCache.size
        };
      }
    } catch (error) {
      console.error('Redis STATS error:', error.message);
      return {
        enabled: this.isEnabled,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.error('Error disconnecting from Redis:', error.message);
      }
    }
  }

  /**
   * Helper: Generate cache key
   * @param {string} namespace - Cache namespace (e.g., 'dashboard', 'stats')
   * @param {Object} params - Parameters to include in key
   * @returns {string} Generated cache key
   */
  generateKey(namespace, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join(':');

    return sortedParams
      ? `${namespace}:${sortedParams}`
      : namespace;
  }
}

// Export singleton instance
const redisService = new RedisService();
export default redisService;
