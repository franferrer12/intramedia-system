#!/usr/bin/env node

/**
 * Full System Diagnostic Script
 * Tests all endpoints, database connections, and identifies issues
 */

import axios from 'axios';
import pool from '../src/config/database.js';

const BASE_URL = 'http://localhost:3001';
const errors = [];
const warnings = [];
const successes = [];

// Test categories
const tests = {
  core: [
    { method: 'GET', path: '/health', desc: 'Health Check' },
    { method: 'GET', path: '/', desc: 'Root Endpoint' },
  ],
  djs: [
    { method: 'GET', path: '/api/djs', desc: 'List DJs' },
    { method: 'GET', path: '/api/djs?page=1&limit=5', desc: 'DJs with pagination' },
    { method: 'GET', path: '/api/djs?search=test', desc: 'Search DJs' },
  ],
  clientes: [
    { method: 'GET', path: '/api/clientes', desc: 'List Clientes' },
    { method: 'GET', path: '/api/clientes?page=1&limit=5', desc: 'Clientes with pagination' },
  ],
  eventos: [
    { method: 'GET', path: '/api/eventos', desc: 'List Eventos' },
    { method: 'GET', path: '/api/eventos?page=1&limit=5', desc: 'Eventos with pagination' },
  ],
  leads: [
    { method: 'GET', path: '/api/leads', desc: 'List Leads' },
    { method: 'GET', path: '/api/leads/stats', desc: 'Leads Stats' },
  ],
  requests: [
    { method: 'GET', path: '/api/requests', desc: 'List Requests' },
    { method: 'GET', path: '/api/requests/stats', desc: 'Requests Stats' },
  ],
  socios: [
    { method: 'GET', path: '/api/socios', desc: 'List Socios' },
    { method: 'GET', path: '/api/socios/dashboard', desc: 'Socios Dashboard' },
  ],
  financial: [
    { method: 'GET', path: '/api/djs-financial', desc: 'DJs Financial Stats' },
    { method: 'GET', path: '/api/djs-financial/pagos-pendientes', desc: 'DJs Pagos Pendientes' },
    { method: 'GET', path: '/api/clientes-financial', desc: 'Clientes Financial Stats' },
    { method: 'GET', path: '/api/clientes-financial/cobros-pendientes', desc: 'Clientes Cobros Pendientes' },
  ],
  analytics: [
    { method: 'GET', path: '/api/estadisticas/kpis', desc: 'KPIs' },
    { method: 'GET', path: '/api/executive-dashboard/metrics', desc: 'Executive Metrics' },
    { method: 'GET', path: '/api/comparative-analysis/period-comparison', desc: 'Period Comparison' },
    { method: 'GET', path: '/api/comparative-analysis/seasonal', desc: 'Seasonal Analysis' },
    { method: 'GET', path: '/api/comparative-analysis/top-performers', desc: 'Top Performers' },
  ],
  alerts: [
    { method: 'GET', path: '/api/financial-alerts', desc: 'Financial Alerts' },
    { method: 'GET', path: '/api/financial-alerts/unread', desc: 'Unread Alerts' },
  ],
};

async function testEndpoint(method, path, desc) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status
    });

    const status = response.status;
    const result = {
      method,
      path,
      desc,
      status,
      time: response.headers['x-response-time'] || 'N/A',
    };

    if (status >= 200 && status < 300) {
      successes.push(result);
      console.log(`✅ ${desc}: ${status}`);

      // Check for pagination
      if (response.data.pagination) {
        console.log(`   📊 Pagination: ${response.data.pagination.total} total`);
      }

      // Check for data
      if (response.data.data) {
        const dataLength = Array.isArray(response.data.data)
          ? response.data.data.length
          : Object.keys(response.data.data).length;
        console.log(`   📦 Data: ${dataLength} items`);
      }
    } else if (status === 404) {
      warnings.push({ ...result, reason: 'Endpoint not found' });
      console.log(`⚠️  ${desc}: 404 Not Found`);
    } else if (status >= 500) {
      errors.push({
        ...result,
        reason: response.data?.error || response.data?.message || 'Server error',
        details: response.data?.details
      });
      console.log(`❌ ${desc}: ${status} - ${response.data?.error || 'Error'}`);
      if (response.data?.details) {
        console.log(`   Details: ${response.data.details}`);
      }
    } else {
      warnings.push({
        ...result,
        reason: response.data?.error || response.data?.message || `Status ${status}`
      });
      console.log(`⚠️  ${desc}: ${status}`);
    }

    return result;
  } catch (error) {
    const result = {
      method,
      path,
      desc,
      status: 'ERROR',
      error: error.message,
    };

    if (error.code === 'ECONNREFUSED') {
      errors.push({ ...result, reason: 'Backend not running' });
      console.log(`❌ ${desc}: Backend not running`);
    } else if (error.code === 'ETIMEDOUT') {
      errors.push({ ...result, reason: 'Request timeout' });
      console.log(`❌ ${desc}: Timeout`);
    } else {
      errors.push({ ...result, reason: error.message });
      console.log(`❌ ${desc}: ${error.message}`);
    }

    return result;
  }
}

async function testDatabase() {
  console.log('\n🗄️  Database Tests\n');

  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection: OK');

    // Check tables exist
    const tables = ['djs', 'clientes', 'eventos', 'leads', 'requests', 'socios',
                   'cotizaciones', 'roles', 'permissions'];

    for (const table of tables) {
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )
      `, [table]);

      if (check.rows[0].exists) {
        console.log(`✅ Table '${table}': exists`);
      } else {
        errors.push({ type: 'database', table, reason: 'Table missing' });
        console.log(`❌ Table '${table}': missing`);
      }
    }

    // Check for deleted_at columns (soft deletes)
    for (const table of ['djs', 'clientes', 'eventos', 'leads', 'requests', 'socios']) {
      const check = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'deleted_at'
      `, [table]);

      if (check.rows.length > 0) {
        console.log(`✅ Soft delete on '${table}': configured`);
      } else {
        warnings.push({ type: 'database', table, reason: 'No soft delete column' });
        console.log(`⚠️  Soft delete on '${table}': missing`);
      }
    }

  } catch (error) {
    errors.push({ type: 'database', reason: error.message });
    console.log(`❌ Database error: ${error.message}`);
  }
}

async function runDiagnostic() {
  console.log('\n🔍 Starting Full System Diagnostic\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test database first
  await testDatabase();

  // Test all endpoint categories
  for (const [category, categoryTests] of Object.entries(tests)) {
    console.log(`\n📂 ${category.toUpperCase()} Endpoints\n`);

    for (const test of categoryTests) {
      await testEndpoint(test.method, test.path, test.desc);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
  }

  // Generate report
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 DIAGNOSTIC REPORT\n');
  console.log(`✅ Successes: ${successes.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`\n📈 Success Rate: ${Math.round((successes.length / (successes.length + warnings.length + errors.length)) * 100)}%`);

  if (errors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS:\n');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.desc || err.table || err.type}`);
      console.log(`   Path: ${err.path || 'N/A'}`);
      console.log(`   Reason: ${err.reason}`);
      if (err.details) console.log(`   Details: ${err.details}`);
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn.desc || warn.table}`);
      console.log(`   Reason: ${warn.reason}`);
      console.log('');
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit with appropriate code
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run diagnostic
runDiagnostic().catch(error => {
  console.error('Fatal error running diagnostic:', error);
  process.exit(1);
});
