/**
 * Cache System Tests
 * Validates that caching middleware is working correctly
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const BASE_URL = 'http://localhost:3001';

const makeRequest = (path, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      }
    };

    const req = http.request(BASE_URL + path, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

describe('Cache System Tests', () => {
  it('should return X-Cache header on GET requests', async () => {
    const response = await makeRequest('/api/eventos');

    assert.ok(response.headers['x-cache'], 'X-Cache header should be present');
    assert.ok(['HIT', 'MISS'].includes(response.headers['x-cache']),
      'X-Cache should be either HIT or MISS');

    console.log('✅ X-Cache header present:', response.headers['x-cache']);
  });

  it('should cache subsequent requests (HIT after MISS)', async () => {
    // Use unique query param to ensure fresh cache miss
    const timestamp = Date.now();
    const testPath = `/api/eventos?_test=${timestamp}`;

    // First request - should be MISS
    const response1 = await makeRequest(testPath);
    assert.strictEqual(response1.headers['x-cache'], 'MISS',
      'First request should be cache MISS');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request - should be HIT
    const response2 = await makeRequest(testPath);
    assert.strictEqual(response2.headers['x-cache'], 'HIT',
      'Second request should be cache HIT');

    console.log('✅ Cache working: MISS → HIT');
  });

  it('should not cache POST requests', async () => {
    const response = await makeRequest('/api/eventos', 'POST');

    assert.strictEqual(response.headers['x-cache'], undefined,
      'POST requests should not have X-Cache header');

    console.log('✅ POST requests not cached');
  });

  it('should cache stats endpoints with longCache', async () => {
    const response = await makeRequest('/api/estadisticas/kpis');

    assert.ok(response.headers['x-cache'],
      'Stats endpoint should have cache');
    assert.strictEqual(response.statusCode, 200,
      'Should return 200 OK');

    console.log('✅ Stats endpoint cached');
  });
});

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Cache Tests...\n');
}
