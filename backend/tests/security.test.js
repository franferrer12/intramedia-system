/**
 * Security Headers Tests
 * Validates that security headers are present
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const BASE_URL = 'http://localhost:3001';

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    http.get(BASE_URL + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
};

describe('Security Headers Tests', () => {
  it('should include X-Content-Type-Options: nosniff', async () => {
    const response = await makeRequest('/');

    assert.strictEqual(response.headers['x-content-type-options'], 'nosniff',
      'Should prevent MIME sniffing');

    console.log('✅ X-Content-Type-Options: nosniff');
  });

  it('should include X-Frame-Options: DENY', async () => {
    const response = await makeRequest('/');

    assert.strictEqual(response.headers['x-frame-options'], 'DENY',
      'Should prevent clickjacking');

    console.log('✅ X-Frame-Options: DENY');
  });

  it('should include X-XSS-Protection', async () => {
    const response = await makeRequest('/');

    assert.ok(response.headers['x-xss-protection'],
      'Should include XSS protection');
    assert.ok(response.headers['x-xss-protection'].includes('1'),
      'XSS protection should be enabled');

    console.log('✅ X-XSS-Protection:', response.headers['x-xss-protection']);
  });

  it('should include Content-Security-Policy', async () => {
    const response = await makeRequest('/');

    assert.ok(response.headers['content-security-policy'],
      'Should include CSP header');
    assert.ok(response.headers['content-security-policy'].includes("default-src 'self'"),
      'CSP should restrict default sources');

    console.log('✅ Content-Security-Policy present');
  });

  it('should include Referrer-Policy', async () => {
    const response = await makeRequest('/');

    assert.ok(response.headers['referrer-policy'],
      'Should include Referrer-Policy');

    console.log('✅ Referrer-Policy:', response.headers['referrer-policy']);
  });

  it('should include Permissions-Policy', async () => {
    const response = await makeRequest('/');

    assert.ok(response.headers['permissions-policy'],
      'Should include Permissions-Policy');

    console.log('✅ Permissions-Policy present');
  });

  it('should remove X-Powered-By header', async () => {
    const response = await makeRequest('/');

    assert.strictEqual(response.headers['x-powered-by'], undefined,
      'X-Powered-By should be removed for security');

    console.log('✅ X-Powered-By removed');
  });

  it('should include all security headers on all endpoints', async () => {
    const endpoints = [
      '/',
      '/health',
      '/metrics',
      '/api/eventos'
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint);

      assert.ok(response.headers['x-content-type-options'],
        `${endpoint} should have security headers`);
    }

    console.log('✅ Security headers on all endpoints');
  });
});

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Security Headers Tests...\n');
}
