import { test, expect } from '@playwright/test';

/**
 * E2E API Tests - Health & Status
 *
 * Tests critical system health endpoints
 */

test.describe('System Health & Status', () => {

  test('GET / - should return API information', async ({ request }) => {
    const response = await request.get('/');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Intra Media System API');
    expect(data.version).toBeTruthy();
    expect(data.optimizations).toBeDefined();
    expect(data.endpoints).toBeDefined();
  });

  test('GET /health - should return healthy status', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('ok');
    expect(data.database).toBe('connected');
    expect(data.timestamp).toBeTruthy();
  });

  test('GET /metrics - should return performance metrics', async ({ request }) => {
    const response = await request.get('/metrics');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.metrics).toBeDefined();
    expect(data.timestamp).toBeTruthy();
  });

  test('GET /api-docs.json - should return Swagger spec', async ({ request }) => {
    const response = await request.get('/api-docs.json');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.openapi).toBeTruthy();
    expect(data.info).toBeDefined();
    expect(data.paths).toBeDefined();
  });

  test('GET /404 - should return 404 for unknown routes', async ({ request }) => {
    const response = await request.get('/this-route-does-not-exist');

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('no encontrada');
  });
});

test.describe('CORS & Security Headers', () => {

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/');

    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get('/');

    const headers = response.headers();

    // Check for common security headers
    expect(headers['x-content-type-options']).toBeDefined();
    expect(headers['x-frame-options']).toBeDefined();
  });

  test('OPTIONS request should return 200', async ({ request }) => {
    const response = await request.fetch('/', {
      method: 'OPTIONS'
    });

    expect(response.status()).toBe(200);
  });
});

test.describe('Performance & Response Times', () => {

  test('health check should respond within 1 second', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/health');
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(1000);
  });

  test('root endpoint should respond within 500ms', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/');
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(500);
  });
});
