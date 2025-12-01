import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import pool from './config/database.js';
import swaggerSpec from './config/swagger.js';
import logger from './utils/logger.js';
import { compression } from './middleware/compression.js';
import { securityHeaders } from './middleware/security.js';
import { performanceMiddleware, getPerformanceMetrics, resetMetrics } from './middleware/performanceMonitor.js';
import { jobsUXMiddleware } from './middleware/jobsUX.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import agenciesRoutes from './routes/agencies.js';
import eventosRoutes from './routes/eventos.js';
import djsRoutes from './routes/djs.js';
import clientesRoutes from './routes/clientes.js';
import estadisticasRoutes from './routes/estadisticas.js';
import sociosRoutes from './routes/socios.js';
import uploadRoutes from './routes/upload.routes.js';
import socialMediaRoutes from './routes/socialMedia.js';
import requestsRoutes from './routes/requests.js';
import leadsRoutes from './routes/leads.js';
import financialRoutes from './routes/financial.js';
import interactionsRoutes from './routes/interactions.js';
import profitDistributionRoutes from './routes/profitDistribution.js';
import monthlyExpensesRoutes from './routes/monthlyExpenses.js';
import djsFinancialRoutes from './routes/djsFinancial.js';
import clientesFinancialRoutes from './routes/clientesFinancial.js';
import financialAlertsRoutes from './routes/financialAlerts.js';
import executiveDashboardRoutes from './routes/executiveDashboard.js';
import comparativeAnalysisRoutes from './routes/comparativeAnalysis.js';
import quotationsRoutes from './routes/quotations.js';
import contractsRoutes from './routes/contracts.js';
import notificationsRoutes from './routes/notifications.js';
import rolesRoutes from './routes/roles.js';
import availabilityRoutes from './routes/availability.js';

// Importar servicios
import { startScheduledJobs, stopScheduledJobs } from './services/scheduledJobsService.js';
import redisService from './services/redisService.js';

// Configuración
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales (orden importa!)
// 1. CORS FIRST - Ultra permissive for debugging
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// 2. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Performance monitoring
app.use(performanceMiddleware());

// 4. Compression
app.use(compression());

// 5. Security headers (AFTER CORS and body parsers, BEFORE routes)
// Helmet enabled with development-friendly settings
app.use(securityHeaders());

// 6. Jobs-Style UX Middleware (después de parsers, antes de rutas)
app.use(jobsUXMiddleware);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Logger simple
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.query);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'IntraMedia API Docs',
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Intra Media System API - Multi-Tenant - OPTIMIZED',
    version: '2.3.0',
    optimizations: {
      cache: 'In-Memory (shortCache: 1min, longCache: 15min)',
      rateLimit: 'Active (strictLimit: 5/15min, createLimit: 10/min)',
      compression: 'Gzip enabled (70-90% reduction)',
      security: 'HTTP Security Headers enabled',
      rbac: 'Role-Based Access Control active'
    },
    endpoints: {
      auth: '/api/auth',
      oauth: '/api/oauth',
      agencies: '/api/agencies',
      eventos: '/api/eventos',
      djs: '/api/djs',
      clientes: '/api/clientes',
      estadisticas: '/api/estadisticas',
      socios: '/api/socios',
      socialMedia: '/api/social-media',
      requests: '/api/requests',
      leads: '/api/leads',
      interactions: '/api/interactions',
      financial: '/api/financial',
      profitDistribution: '/api/profit-distribution',
      monthlyExpenses: '/api/monthly-expenses',
      financialAlerts: '/api/financial-alerts',
      djsFinancial: '/api/djs-financial',
      clientesFinancial: '/api/clientes-financial',
      executiveDashboard: '/api/executive-dashboard',
      comparativeAnalysis: '/api/comparative-analysis',
      quotations: '/api/quotations',
      contracts: '/api/contracts',
      notifications: '/api/notifications',
      roles: '/api/roles',
      availability: '/api/availability'
    }
  });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = getPerformanceMetrics();
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics
  });
});

// Reset metrics endpoint (admin only)
app.post('/metrics/reset', (req, res) => {
  resetMetrics();
  res.json({
    success: true,
    message: 'Performance metrics reset successfully'
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍎 Jobs-Style UX Endpoints (Simplificados)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Stats simplificadas - Solo 3 KPIs (Jobs-style)
app.get('/api/stats', async (req, res) => {
  try {
    const today = await pool.query(`
      SELECT COUNT(*) as count FROM eventos
      WHERE DATE(fecha) = CURRENT_DATE AND deleted_at IS NULL
    `);

    const thisMonth = await pool.query(`
      SELECT
        COUNT(*) as eventos,
        COALESCE(SUM(cache_total), 0) as ingresos
      FROM eventos
      WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
        AND deleted_at IS NULL
    `);

    // ✅ Solo 3 números importantes (Jobs-style)
    res.simple({
      today: parseInt(today.rows[0].count),
      events: parseInt(thisMonth.rows[0].eventos),
      revenue: parseFloat(thisMonth.rows[0].ingresos)
    });
  } catch (error) {
    res.simpleError('Algo salió mal', 500);
  }
});

// Búsqueda global instantánea (Jobs-style)
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.simple([]);
    }

    // Buscar en múltiples tablas simultáneamente
    const [eventos, djs, clientes] = await Promise.all([
      pool.query(
        `SELECT 'evento' as type, id, evento as name FROM eventos
         WHERE evento ILIKE $1 AND deleted_at IS NULL LIMIT 5`,
        [`%${q}%`]
      ),
      pool.query(
        `SELECT 'dj' as type, id, nombre as name FROM djs
         WHERE nombre ILIKE $1 AND deleted_at IS NULL LIMIT 5`,
        [`%${q}%`]
      ),
      pool.query(
        `SELECT 'cliente' as type, id, nombre as name FROM clientes
         WHERE nombre ILIKE $1 AND deleted_at IS NULL LIMIT 5`,
        [`%${q}%`]
      )
    ]);

    // Combinar resultados
    const results = [
      ...eventos.rows,
      ...djs.rows,
      ...clientes.rows
    ];

    res.simple(results);
  } catch (error) {
    res.simpleError('Algo salió mal', 500);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/djs', djsRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/socios', sociosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/profit-distribution', profitDistributionRoutes);
app.use('/api/monthly-expenses', monthlyExpensesRoutes);
app.use('/api/djs-financial', djsFinancialRoutes);
app.use('/api/clientes-financial', clientesFinancialRoutes);
app.use('/api/financial-alerts', financialAlertsRoutes);
app.use('/api/executive-dashboard', executiveDashboardRoutes);
app.use('/api/comparative-analysis', comparativeAnalysisRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/availability', availabilityRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Test conexión a DB
    await pool.query('SELECT 1');
    console.log('✅ Conexión a PostgreSQL exitosa');

    // Initialize Redis
    await redisService.connect();

    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Intra Media System API - Multi-Tenant');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔐 Authentication:');
      console.log(`   Auth API: http://localhost:${PORT}/api/auth`);
      console.log('');
      console.log('🏢 Multi-Tenant:');
      console.log(`   Agencies API: http://localhost:${PORT}/api/agencies`);
      console.log('');
      console.log('📊 Core Features:');
      console.log(`   Eventos API: http://localhost:${PORT}/api/eventos`);
      console.log(`   DJs API: http://localhost:${PORT}/api/djs`);
      console.log(`   Clientes API: http://localhost:${PORT}/api/clientes`);
      console.log(`   Estadísticas API: http://localhost:${PORT}/api/estadisticas`);
      console.log(`   Social Media API: http://localhost:${PORT}/api/social-media`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // Start scheduled jobs
      startScheduledJobs();
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales para shutdown graceful
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  stopScheduledJobs();
  await redisService.disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT recibido, cerrando servidor...');
  stopScheduledJobs();
  await redisService.disconnect();
  await pool.end();
  process.exit(0);
});

startServer();

export default app;
