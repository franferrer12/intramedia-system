/**
 * Performance Monitoring Middleware
 * Tracks request/response metrics for optimization insights
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      slowestRequests: [],
      fastestRequests: [],
      requestsByMethod: {},
      requestsByPath: {},
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track original res.json
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        recordMetrics();
        return originalJson(data);
      };

      // Track original res.send
      const originalSend = res.send.bind(res);
      res.send = function(data) {
        recordMetrics();
        return originalSend(data);
      };

      const recordMetrics = () => {
        const responseTime = Date.now() - startTime;
        const path = req.path;
        const method = req.method;

        // Update global metrics
        this.metrics.totalRequests++;
        this.metrics.totalResponseTime += responseTime;

        // Track by method
        if (!this.metrics.requestsByMethod[method]) {
          this.metrics.requestsByMethod[method] = 0;
        }
        this.metrics.requestsByMethod[method]++;

        // Track by path
        if (!this.metrics.requestsByPath[path]) {
          this.metrics.requestsByPath[path] = { count: 0, totalTime: 0 };
        }
        this.metrics.requestsByPath[path].count++;
        this.metrics.requestsByPath[path].totalTime += responseTime;

        // Track cache hits/misses
        const cacheStatus = res.getHeader('X-Cache');
        if (cacheStatus === 'HIT') {
          this.metrics.cacheHits++;
        } else if (cacheStatus === 'MISS') {
          this.metrics.cacheMisses++;
        }

        // Track errors
        if (res.statusCode >= 400) {
          this.metrics.errorCount++;
        }

        // Track slowest requests (keep top 10)
        const requestInfo = { path, method, responseTime, timestamp: new Date() };
        this.metrics.slowestRequests.push(requestInfo);
        this.metrics.slowestRequests.sort((a, b) => b.responseTime - a.responseTime);
        this.metrics.slowestRequests = this.metrics.slowestRequests.slice(0, 10);

        // Track fastest requests (keep top 10)
        this.metrics.fastestRequests.push(requestInfo);
        this.metrics.fastestRequests.sort((a, b) => a.responseTime - b.responseTime);
        this.metrics.fastestRequests = this.metrics.fastestRequests.slice(0, 10);

        // Log slow requests (> 1000ms)
        if (responseTime > 1000) {
          console.warn(`⚠️  Slow request: ${method} ${path} - ${responseTime}ms`);
        }
      };

      next();
    };
  }

  getMetrics() {
    const avgResponseTime = this.metrics.totalRequests > 0
      ? (this.metrics.totalResponseTime / this.metrics.totalRequests).toFixed(2)
      : 0;

    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2)
      : 0;

    // Calculate average time by path
    const pathMetrics = {};
    for (const [path, data] of Object.entries(this.metrics.requestsByPath)) {
      pathMetrics[path] = {
        count: data.count,
        avgTime: (data.totalTime / data.count).toFixed(2) + 'ms'
      };
    }

    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        avgResponseTime: avgResponseTime + 'ms',
        errorCount: this.metrics.errorCount,
        errorRate: ((this.metrics.errorCount / this.metrics.totalRequests) * 100).toFixed(2) + '%',
        cacheHitRate: cacheHitRate + '%',
        cacheHits: this.metrics.cacheHits,
        cacheMisses: this.metrics.cacheMisses
      },
      byMethod: this.metrics.requestsByMethod,
      byPath: pathMetrics,
      slowestRequests: this.metrics.slowestRequests.slice(0, 10),
      fastestRequests: this.metrics.fastestRequests.slice(0, 10)
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      slowestRequests: [],
      fastestRequests: [],
      requestsByMethod: {},
      requestsByPath: {},
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export const performanceMiddleware = () => performanceMonitor.middleware();
export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const resetMetrics = () => performanceMonitor.reset();

export default performanceMonitor;
