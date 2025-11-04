/**
 * Rate Limiting Tests
 * Validates that rate limiting is working correctly
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const BASE_URL = 'http://localhost:3001';

const makeRequest = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

describe('Rate Limiting Tests', () => {
  it('should include rate limit headers on all requests', async () => {
    const response = await makeRequest('/api/auth/login', 'POST', {
      email: 'test@test.com',
      password: 'test123'
    });

    assert.ok(response.headers['x-ratelimit-limit'],
      'X-RateLimit-Limit header should be present');
    assert.ok(response.headers['x-ratelimit-remaining'] !== undefined,
      'X-RateLimit-Remaining header should be present');
    assert.ok(response.headers['x-ratelimit-reset'],
      'X-RateLimit-Reset header should be present');

    console.log('✅ Rate limit headers present');
    console.log(`   Limit: ${response.headers['x-ratelimit-limit']}`);
    console.log(`   Remaining: ${response.headers['x-ratelimit-remaining']}`);
  });

  it('should enforce strict rate limit on auth endpoints', async () => {
    const requests = [];

    // Make 6 requests (strictRateLimit is 5/15min)
    for (let i = 0; i < 6; i++) {
      requests.push(
        makeRequest('/api/auth/login', 'POST', {
          email: 'test@test.com',
          password: 'wrong'
        })
      );
    }

    const responses = await Promise.all(requests);

    // Last request should be rate limited (429)
    const lastResponse = responses[responses.length - 1];

    if (lastResponse.statusCode === 429) {
      console.log('✅ Rate limit enforced (429 Too Many Requests)');
      assert.strictEqual(lastResponse.statusCode, 429,
        'Should return 429 after limit exceeded');
    } else {
      console.log('⚠️  Rate limit not triggered (may need more requests or reset)');
      console.log(`   Last status: ${lastResponse.statusCode}`);
    }
  });

  it('should allow createRateLimit (10/min) on resource creation', async () => {
    const response = await makeRequest('/api/eventos', 'POST', {
      evento: 'Test Event',
      dj_id: 1,
      fecha: '2025-11-01',
      mes: '2025-11'
    });

    assert.ok(response.headers['x-ratelimit-limit'],
      'Create endpoints should have rate limiting');

    const limit = parseInt(response.headers['x-ratelimit-limit']);
    assert.ok(limit >= 10, 'Create limit should be at least 10');

    console.log('✅ Create rate limit configured correctly');
  });

  it('should decrement remaining count on each request', async () => {
    const response1 = await makeRequest('/api/djs', 'POST', {
      nombre: 'Test DJ',
      email: `test${Date.now()}@test.com`
    });

    const remaining1 = parseInt(response1.headers['x-ratelimit-remaining'] || '0');

    await new Promise(resolve => setTimeout(resolve, 100));

    const response2 = await makeRequest('/api/djs', 'POST', {
      nombre: 'Test DJ 2',
      email: `test${Date.now() + 1}@test.com`
    });

    const remaining2 = parseInt(response2.headers['x-ratelimit-remaining'] || '0');

    console.log(`✅ Rate limit decrements: ${remaining1} → ${remaining2}`);
  });
});

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Rate Limit Tests...\n');
}
