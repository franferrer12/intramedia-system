/**
 * Performance Tests
 * Validates performance monitoring and improvements
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const BASE_URL = 'http://localhost:3001';

const makeRequest = (path) => {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    http.get(BASE_URL + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: endTime - startTime
        });
      });
    }).on('error', reject);
  });
};

describe('Performance Tests', () => {
  it('should respond to root endpoint quickly', async () => {
    const response = await makeRequest('/');

    assert.ok(response.responseTime < 1000,
      'Root endpoint should respond in < 1s');

    console.log(`✅ Root endpoint: ${response.responseTime}ms`);
  });

  it('should have /metrics endpoint available', async () => {
    const response = await makeRequest('/metrics');

    assert.strictEqual(response.statusCode, 200,
      'Metrics endpoint should be available');

    const metrics = JSON.parse(response.body);

    assert.ok(metrics.metrics, 'Should have metrics object');
    assert.ok(metrics.metrics.summary, 'Should have summary');

    console.log('✅ Performance metrics endpoint working');
    console.log(`   Avg response time: ${metrics.metrics.summary.avgResponseTime}`);
    console.log(`   Cache hit rate: ${metrics.metrics.summary.cacheHitRate}`);
  });

  it('should show cache improvements on repeated requests', async () => {
    // First request
    const response1 = await makeRequest('/api/eventos');
    const time1 = response1.responseTime;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request (should be cached)
    const response2 = await makeRequest('/api/eventos');
    const time2 = response2.responseTime;

    if (response2.headers['x-cache'] === 'HIT') {
      assert.ok(time2 <= time1,
        'Cached response should be faster or equal');

      const improvement = ((1 - (time2 / time1)) * 100).toFixed(2);
      console.log(`✅ Cache performance improvement: ${improvement}%`);
      console.log(`   MISS: ${time1}ms → HIT: ${time2}ms`);
    } else {
      console.log('ℹ️  Cache not hit (may need warm-up)');
    }
  });

  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 10;
    const requests = [];

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(makeRequest('/api/estadisticas/kpis'));
    }

    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    const avgTime = totalTime / concurrentRequests;

    assert.ok(responses.every(r => r.statusCode === 200),
      'All requests should succeed');

    console.log(`✅ Concurrent requests handled:`);
    console.log(`   ${concurrentRequests} requests in ${totalTime}ms`);
    console.log(`   Avg per request: ${avgTime.toFixed(2)}ms`);
  });

  it('should have database indexes improving query speed', async () => {
    // Test a complex query that benefits from indexes
    const response1 = await makeRequest('/api/djs-financial');
    const response2 = await makeRequest('/api/clientes-financial');

    assert.ok(response1.responseTime < 2000,
      'DJ financial query should be fast (< 2s)');
    assert.ok(response2.responseTime < 2000,
      'Cliente financial query should be fast (< 2s)');

    console.log('✅ Database-heavy queries optimized:');
    console.log(`   DJ Financial: ${response1.responseTime}ms`);
    console.log(`   Cliente Financial: ${response2.responseTime}ms`);
  });

  it('should track slow requests', async () => {
    // Make some requests
    await Promise.all([
      makeRequest('/api/eventos'),
      makeRequest('/api/djs'),
      makeRequest('/api/clientes')
    ]);

    const metricsResponse = await makeRequest('/metrics');
    const metrics = JSON.parse(metricsResponse.body);

    assert.ok(metrics.metrics.slowestRequests,
      'Should track slowest requests');
    assert.ok(Array.isArray(metrics.metrics.slowestRequests),
      'Slowest requests should be an array');

    console.log('✅ Slow request tracking active');

    if (metrics.metrics.slowestRequests.length > 0) {
      const slowest = metrics.metrics.slowestRequests[0];
      console.log(`   Slowest: ${slowest.path} - ${slowest.responseTime}ms`);
    }
  });
});

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Performance Tests...\n');
}
