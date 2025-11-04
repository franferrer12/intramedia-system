/**
 * Graceful Shutdown Manager
 * Maneja el cierre elegante de conexiones y servicios
 */

import pool from '../config/database.js';
import redisService from '../services/redisService.js';
import { stopScheduledJobs } from '../services/scheduledJobsService.js';

class GracefulShutdownManager {
  constructor() {
    this.isShuttingDown = false;
    this.server = null;
    this.shutdownTimeout = 30000; // 30 seconds timeout
    this.connections = new Set();
  }

  /**
   * Initialize graceful shutdown handlers
   */
  init(server) {
    this.server = server;

    // Track all connections
    server.on('connection', (conn) => {
      this.connections.add(conn);
      conn.on('close', () => {
        this.connections.delete(conn);
      });
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.shutdown('UNCAUGHT_EXCEPTION', 1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:', reason);
      this.shutdown('UNHANDLED_REJECTION', 1);
    });
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(signal, exitCode = 0) {
    if (this.isShuttingDown) {
      console.log('⏳ Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log(`\n🛑 ${signal} received - Starting graceful shutdown...`);

    // Set shutdown timeout
    const timeout = setTimeout(() => {
      console.error('❌ Shutdown timeout reached - Force exit');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Step 1: Stop accepting new connections
      console.log('1️⃣  Stopping server from accepting new connections...');
      await this.stopServer();

      // Step 2: Close existing connections
      console.log('2️⃣  Closing existing connections...');
      await this.closeConnections();

      // Step 3: Stop scheduled jobs
      console.log('3️⃣  Stopping scheduled jobs...');
      stopScheduledJobs();

      // Step 4: Close Redis connection
      console.log('4️⃣  Closing Redis connection...');
      await this.closeRedis();

      // Step 5: Close database pool
      console.log('5️⃣  Closing database connections...');
      await this.closeDatabase();

      // Clear timeout
      clearTimeout(timeout);

      console.log('✅ Graceful shutdown completed successfully');
      process.exit(exitCode);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      clearTimeout(timeout);
      process.exit(1);
    }
  }

  /**
   * Stop server from accepting new connections
   */
  stopServer() {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(() => {
        console.log('   ✓ Server closed');
        resolve();
      });
    });
  }

  /**
   * Close all existing connections
   */
  async closeConnections() {
    const promises = [];
    
    for (const conn of this.connections) {
      promises.push(
        new Promise((resolve) => {
          conn.end(() => resolve());
          
          // Force close after 5 seconds
          setTimeout(() => {
            conn.destroy();
            resolve();
          }, 5000);
        })
      );
    }

    await Promise.all(promises);
    console.log(`   ✓ Closed ${this.connections.size} connections`);
  }

  /**
   * Close Redis connection
   */
  async closeRedis() {
    try {
      await redisService.disconnect();
      console.log('   ✓ Redis disconnected');
    } catch (error) {
      console.warn('   ⚠️  Redis disconnect warning:', error.message);
    }
  }

  /**
   * Close database pool
   */
  async closeDatabase() {
    try {
      await pool.end();
      console.log('   ✓ Database pool closed');
    } catch (error) {
      console.error('   ❌ Database close error:', error.message);
      throw error;
    }
  }

  /**
   * Check if system is shutting down
   */
  isShuttingDownNow() {
    return this.isShuttingDown;
  }
}

// Singleton instance
const gracefulShutdown = new GracefulShutdownManager();

export default gracefulShutdown;
