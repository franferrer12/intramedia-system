/**
 * Advanced Health Check Middleware
 * Proporciona health checks detallados del sistema
 */

import pool from '../config/database.js';
import redisService from '../services/redisService.js';
import os from 'os';
import { performance } from 'perf_hooks';

/**
 * Check database health
 */
async function checkDatabase() {
  const start = performance.now();
  
  try {
    const result = await pool.query('SELECT NOW(), version()');
    const duration = performance.now() - start;
    
    // Get connection pool stats
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    
    return {
      status: 'healthy',
      responseTime: `${duration.toFixed(2)}ms`,
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
      pool: poolStats
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis() {
  const start = performance.now();
  
  try {
    const isConnected = await redisService.isConnected();
    const duration = performance.now() - start;
    
    if (isConnected) {
      return {
        status: 'healthy',
        responseTime: `${duration.toFixed(2)}ms`,
        mode: 'connected'
      };
    } else {
      return {
        status: 'degraded',
        message: 'Redis not connected - using in-memory cache'
      };
    }
  } catch (error) {
    return {
      status: 'degraded',
      error: error.message,
      message: 'Fallback to in-memory cache'
    };
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);
  
  const cpuLoad = os.loadavg();
  const cpuCount = os.cpus().length;
  
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  
  return {
    status: memUsagePercent < 90 ? 'healthy' : 'warning',
    memory: {
      total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usagePercent: `${memUsagePercent}%`
    },
    cpu: {
      cores: cpuCount,
      loadAverage: {
        '1min': cpuLoad[0].toFixed(2),
        '5min': cpuLoad[1].toFixed(2),
        '15min': cpuLoad[2].toFixed(2)
      }
    },
    uptime: {
      seconds: uptime.toFixed(0),
      formatted: `${uptimeHours}h ${uptimeMinutes}m`
    },
    platform: os.platform(),
    nodeVersion: process.version
  };
}

/**
 * Comprehensive health check endpoint
 */
export async function healthCheckHandler(req, res) {
  const startTime = performance.now();
  
  try {
    // Run all health checks in parallel
    const [database, redis, system] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkSystemResources())
    ]);
    
    const totalTime = performance.now() - startTime;
    
    // Determine overall status
    const isHealthy = database.status === 'healthy' && 
                     (redis.status === 'healthy' || redis.status === 'degraded') &&
                     system.status === 'healthy';
    
    const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalResponseTime: `${totalTime.toFixed(2)}ms`,
      checks: {
        database,
        redis,
        system
      },
      version: process.env.npm_package_version || '2.3.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Simple liveness probe (Kubernetes/Docker)
 */
export function livenessProbe(req, res) {
  res.status(200).send('OK');
}

/**
 * Readiness probe (Kubernetes/Docker)
 */
export async function readinessProbe(req, res) {
  try {
    // Check if we can handle requests
    await pool.query('SELECT 1');
    res.status(200).send('READY');
  } catch (error) {
    res.status(503).send('NOT READY');
  }
}

/**
 * Metrics endpoint (Prometheus format)
 */
export async function metricsPrometheus(req, res) {
  try {
    const database = await checkDatabase();
    const system = checkSystemResources();
    
    const metrics = [
      '# HELP app_up Application is running',
      '# TYPE app_up gauge',
      'app_up 1',
      '',
      '# HELP app_uptime_seconds Application uptime in seconds',
      '# TYPE app_uptime_seconds counter',
      `app_uptime_seconds ${process.uptime().toFixed(0)}`,
      '',
      '# HELP db_response_time_ms Database response time in milliseconds',
      '# TYPE db_response_time_ms gauge',
      `db_response_time_ms ${parseFloat(database.responseTime) || 0}`,
      '',
      '# HELP system_memory_usage_percent System memory usage percentage',
      '# TYPE system_memory_usage_percent gauge',
      `system_memory_usage_percent ${parseFloat(system.memory.usagePercent)}`,
      '',
      '# HELP system_cpu_cores Number of CPU cores',
      '# TYPE system_cpu_cores gauge',
      `system_cpu_cores ${system.cpu.cores}`,
      ''
    ].join('\n');
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('# Error generating metrics');
  }
}
