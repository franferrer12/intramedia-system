import { test, expect } from '@playwright/test';

/**
 * E2E API Tests - Eventos
 *
 * Tests eventos CRUD operations with Zod validation
 */

test.describe('Eventos API - E2E', () => {

  let testDjId;
  let testClienteId;
  let testEventoId;

  // Setup: Get or create test data
  test.beforeAll(async ({ request }) => {
    // Get first DJ (or use known test DJ ID)
    const djsResponse = await request.get('/api/djs');
    const djsData = await djsResponse.json();
    if (djsData.success && djsData.data.length > 0) {
      testDjId = djsData.data[0].id;
    }

    // Get first Cliente
    const clientesResponse = await request.get('/api/clientes');
    const clientesData = await clientesResponse.json();
    if (clientesData.success && clientesData.data.length > 0) {
      testClienteId = clientesData.data[0].id;
    }
  });

  // Cleanup
  test.afterAll(async ({ request }) => {
    if (testEventoId) {
      await request.delete(`/api/eventos/${testEventoId}`);
    }
  });

  test('should create evento with valid data', async ({ request }) => {
    const newEvento = {
      fecha: '2025-12-31',
      mes: 'diciembre',
      evento: 'E2E Test Event',
      ciudad_lugar: 'Madrid, España',
      dj_id: testDjId || 1,
      cliente_id: testClienteId || 1,
      horas: 6,
      cache_total: 1200,
      parte_dj: 840,
      parte_agencia: 360,
      reserva: 200,
      cobrado_cliente: false,
      pagado_dj: false
    };

    const response = await request.post('/api/eventos', {
      data: newEvento
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.id).toBeTruthy();
    expect(data.data.evento).toBe('E2E Test Event');

    testEventoId = data.data.id;
  });

  test('should reject evento with invalid fecha format', async ({ request }) => {
    const invalidEvento = {
      fecha: '31-12-2025', // Wrong format
      mes: 'diciembre',
      evento: 'Invalid Event',
      ciudad_lugar: 'Barcelona',
      dj_id: testDjId || 1,
      cliente_id: testClienteId || 1,
      horas: 4,
      cache_total: 800,
      parte_dj: 560,
      parte_agencia: 240
    };

    const response = await request.post('/api/eventos', {
      data: invalidEvento
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('validación');
    expect(data.errors).toBeDefined();
    expect(Array.isArray(data.errors)).toBe(true);
  });

  test('should reject evento with invalid mes', async ({ request }) => {
    const invalidEvento = {
      fecha: '2025-12-31',
      mes: 'invalid_month',
      evento: 'Test Event',
      ciudad_lugar: 'Valencia',
      dj_id: testDjId || 1,
      cliente_id: testClienteId || 1,
      horas: 5,
      cache_total: 1000,
      parte_dj: 700,
      parte_agencia: 300
    };

    const response = await request.post('/api/eventos', {
      data: invalidEvento
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.errors.some(e => e.field.includes('mes'))).toBe(true);
  });

  test('should reject when cache_total does not match sum', async ({ request }) => {
    const invalidEvento = {
      fecha: '2025-12-31',
      mes: 'diciembre',
      evento: 'Invalid Sum Event',
      ciudad_lugar: 'Sevilla',
      dj_id: testDjId || 1,
      cliente_id: testClienteId || 1,
      horas: 4,
      cache_total: 1000,
      parte_dj: 500, // Sum = 800, but cache_total = 1000
      parte_agencia: 300
    };

    const response = await request.post('/api/eventos', {
      data: invalidEvento
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.errors.some(e => e.field === 'cache_total')).toBe(true);
  });

  test('should get evento by ID', async ({ request }) => {
    // First create an evento if we don't have one
    if (!testEventoId) {
      const createResponse = await request.post('/api/eventos', {
        data: {
          fecha: '2025-12-31',
          mes: 'diciembre',
          evento: 'Test Get Event',
          ciudad_lugar: 'Bilbao',
          dj_id: testDjId || 1,
          cliente_id: testClienteId || 1,
          horas: 3,
          cache_total: 600,
          parte_dj: 420,
          parte_agencia: 180
        }
      });
      const createData = await createResponse.json();
      testEventoId = createData.data.id;
    }

    const response = await request.get(`/api/eventos/${testEventoId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(testEventoId);
  });

  test('should reject invalid ID format', async ({ request }) => {
    const response = await request.get('/api/eventos/invalid-id');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('ID inválido');
  });

  test('should list eventos', async ({ request }) => {
    const response = await request.get('/api/eventos');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should filter eventos by mes', async ({ request }) => {
    const response = await request.get('/api/eventos?mes=diciembre');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should update evento', async ({ request }) => {
    if (!testEventoId) {
      test.skip();
    }

    const updateData = {
      evento: 'Updated E2E Event',
      horas: 8
    };

    const response = await request.put(`/api/eventos/${testEventoId}`, {
      data: updateData
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.evento).toBe('Updated E2E Event');
    expect(data.data.horas).toBe(8);
  });
});

test.describe('Eventos - Quick Actions', () => {

  let quickActionEventoId;

  test.beforeAll(async ({ request }) => {
    // Create test evento for quick actions
    const response = await request.post('/api/eventos', {
      data: {
        fecha: '2025-12-31',
        mes: 'diciembre',
        evento: 'Quick Actions Test',
        ciudad_lugar: 'Granada',
        dj_id: 1,
        cliente_id: 1,
        horas: 4,
        cache_total: 800,
        parte_dj: 560,
        parte_agencia: 240,
        cobrado_cliente: false,
        pagado_dj: false
      }
    });

    const data = await response.json();
    quickActionEventoId = data.data.id;
  });

  test.afterAll(async ({ request }) => {
    if (quickActionEventoId) {
      await request.delete(`/api/eventos/${quickActionEventoId}`);
    }
  });

  test('POST /:id/paid - should mark DJ as paid', async ({ request }) => {
    const response = await request.post(`/api/eventos/${quickActionEventoId}/paid`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('POST /:id/cobrado - should mark client as charged', async ({ request }) => {
    const response = await request.post(`/api/eventos/${quickActionEventoId}/cobrado`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('POST /:id/duplicate - should duplicate evento', async ({ request }) => {
    const response = await request.post(`/api/eventos/${quickActionEventoId}/duplicate`);

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.id).toBeTruthy();
    expect(data.id).not.toBe(quickActionEventoId);

    // Cleanup duplicated evento
    await request.delete(`/api/eventos/${data.id}`);
  });
});
