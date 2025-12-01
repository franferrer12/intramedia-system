import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';
import pool from '../src/config/database.js';

/**
 * Integration Tests for Eventos API
 *
 * These tests verify that the Zod validation schemas
 * are correctly integrated with the Express routes.
 *
 * NOTE: These are integration tests that test the full
 * request-response cycle, not unit tests.
 */
describe('Eventos API Integration Tests', () => {

  let testDjId;
  let testClienteId;
  let testEventoId;

  // Setup: Create test data
  before(async () => {
    try {
      // Create test DJ
      const djResult = await pool.query(`
        INSERT INTO djs (nombre, email, telefono, tipo, activo, created_at)
        VALUES ('Test DJ Integration', 'testdj@test.com', '+34600000000', 'externo', true, NOW())
        RETURNING id
      `);
      testDjId = djResult.rows[0].id;

      // Create test Cliente
      const clienteResult = await pool.query(`
        INSERT INTO clientes (nombre, email, telefono, tipo, activo, created_at)
        VALUES ('Test Cliente Integration', 'testcliente@test.com', '+34600000001', 'particular', true, NOW())
        RETURNING id
      `);
      testClienteId = clienteResult.rows[0].id;
    } catch (error) {
      console.error('Error in before hook:', error);
      throw error;
    }
  });

  // Cleanup: Remove test data
  after(async () => {
    try {
      if (testEventoId) {
        await pool.query('DELETE FROM eventos WHERE id = $1', [testEventoId]);
      }
      if (testDjId) {
        await pool.query('DELETE FROM djs WHERE id = $1', [testDjId]);
      }
      if (testClienteId) {
        await pool.query('DELETE FROM clientes WHERE id = $1', [testClienteId]);
      }
    } catch (error) {
      console.error('Error in after hook:', error);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST /api/eventos - CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('POST /api/eventos - should create evento with valid data', async () => {
    const validEvento = {
      fecha: '2025-12-31',
      mes: 'diciembre',
      evento: 'Test Integration Event',
      ciudad_lugar: 'Madrid, España',
      dj_id: testDjId,
      cliente_id: testClienteId,
      horas: 5,
      cache_total: 1000,
      parte_dj: 700,
      parte_agencia: 300,
      reserva: 100,
      cobrado_cliente: false,
      pagado_dj: false
    };

    const response = await request(app)
      .post('/api/eventos')
      .send(validEvento)
      .expect('Content-Type', /json/)
      .expect(201);

    assert.strictEqual(response.body.success, true);
    assert(response.body.data);
    assert(response.body.data.id);

    // Save for cleanup
    testEventoId = response.body.data.id;
  });

  it('POST /api/eventos - should reject invalid fecha format', async () => {
    const invalidEvento = {
      fecha: '31-12-2025', // Wrong format (DD-MM-YYYY instead of YYYY-MM-DD)
      mes: 'diciembre',
      evento: 'Test Event',
      ciudad_lugar: 'Madrid',
      dj_id: testDjId,
      cliente_id: testClienteId,
      horas: 5,
      cache_total: 1000,
      parte_dj: 700,
      parte_agencia: 300
    };

    const response = await request(app)
      .post('/api/eventos')
      .send(invalidEvento)
      .expect('Content-Type', /json/)
      .expect(400);

    assert.strictEqual(response.body.success, false);
    assert(response.body.message);
    assert(Array.isArray(response.body.errors));
  });

  it('POST /api/eventos - should reject invalid mes', async () => {
    const invalidEvento = {
      fecha: '2025-12-31',
      mes: 'invalid_month',
      evento: 'Test Event',
      ciudad_lugar: 'Madrid',
      dj_id: testDjId,
      cliente_id: testClienteId,
      horas: 5,
      cache_total: 1000,
      parte_dj: 700,
      parte_agencia: 300
    };

    const response = await request(app)
      .post('/api/eventos')
      .send(invalidEvento)
      .expect(400);

    assert.strictEqual(response.body.success, false);
  });

  it('POST /api/eventos - should reject when montos do not match', async () => {
    const invalidEvento = {
      fecha: '2025-12-31',
      mes: 'diciembre',
      evento: 'Test Event',
      ciudad_lugar: 'Madrid',
      dj_id: testDjId,
      cliente_id: testClienteId,
      horas: 5,
      cache_total: 1000,
      parte_dj: 500, // Sum = 800, but cache_total = 1000
      parte_agencia: 300
    };

    const response = await request(app)
      .post('/api/eventos')
      .send(invalidEvento)
      .expect(400);

    assert.strictEqual(response.body.success, false);
    assert(response.body.errors.some(e => e.field === 'cache_total'));
  });

  it('POST /api/eventos - should reject missing required fields', async () => {
    const invalidEvento = {
      fecha: '2025-12-31',
      mes: 'diciembre'
      // Missing evento, ciudad_lugar, dj_id, etc.
    };

    const response = await request(app)
      .post('/api/eventos')
      .send(invalidEvento)
      .expect(400);

    assert.strictEqual(response.body.success, false);
    assert(Array.isArray(response.body.errors));
    assert(response.body.errors.length > 0);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET /api/eventos/:id - READ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('GET /api/eventos/:id - should get evento by valid ID', async () => {
    if (!testEventoId) {
      // Create evento first if not exists
      const createResponse = await request(app)
        .post('/api/eventos')
        .send({
          fecha: '2025-12-31',
          mes: 'diciembre',
          evento: 'Test Get Event',
          ciudad_lugar: 'Barcelona',
          dj_id: testDjId,
          cliente_id: testClienteId,
          horas: 4,
          cache_total: 800,
          parte_dj: 560,
          parte_agencia: 240
        });
      testEventoId = createResponse.body.data.id;
    }

    const response = await request(app)
      .get(`/api/eventos/${testEventoId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert(response.body.data);
    assert.strictEqual(response.body.data.id, testEventoId);
  });

  it('GET /api/eventos/:id - should reject invalid ID format', async () => {
    const response = await request(app)
      .get('/api/eventos/invalid-id')
      .expect('Content-Type', /json/)
      .expect(400);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'ID inválido');
  });

  it('GET /api/eventos/:id - should reject negative ID', async () => {
    const response = await request(app)
      .get('/api/eventos/-5')
      .expect(400);

    assert.strictEqual(response.body.success, false);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET /api/eventos - LIST with Query Validation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('GET /api/eventos - should list eventos with valid query params', async () => {
    const response = await request(app)
      .get('/api/eventos')
      .query({ mes: 'diciembre' })
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert(Array.isArray(response.body.data));
  });

  it('GET /api/eventos - should reject invalid mes in query', async () => {
    const response = await request(app)
      .get('/api/eventos')
      .query({ mes: 'invalid_month' })
      .expect(400);

    assert.strictEqual(response.body.success, false);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUT /api/eventos/:id - UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('PUT /api/eventos/:id - should update evento with valid data', async () => {
    if (!testEventoId) {
      // Create evento first
      const createResponse = await request(app)
        .post('/api/eventos')
        .send({
          fecha: '2025-12-31',
          mes: 'diciembre',
          evento: 'Test Update Event',
          ciudad_lugar: 'Valencia',
          dj_id: testDjId,
          cliente_id: testClienteId,
          horas: 3,
          cache_total: 600,
          parte_dj: 420,
          parte_agencia: 180
        });
      testEventoId = createResponse.body.data.id;
    }

    const updateData = {
      evento: 'Updated Event Name',
      horas: 6
    };

    const response = await request(app)
      .put(`/api/eventos/${testEventoId}`)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.evento, 'Updated Event Name');
    assert.strictEqual(response.body.data.horas, 6);
  });

  it('PUT /api/eventos/:id - should reject invalid update data', async () => {
    const invalidUpdate = {
      horas: -5 // Negative hours
    };

    const response = await request(app)
      .put(`/api/eventos/${testEventoId || 1}`)
      .send(invalidUpdate)
      .expect(400);

    assert.strictEqual(response.body.success, false);
  });
});
