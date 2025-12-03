import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';
import pool from '../src/config/database.js';

describe('Clientes API Integration Tests', () => {
  let authToken;
  let testClienteId;
  const timestamp = Date.now();

  before(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    if (loginResponse.status === 200 && loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }
  });

  after(async () => {
    // Cleanup test data
    if (testClienteId) {
      await pool.query('DELETE FROM clientes WHERE id = $1', [testClienteId]);
    }
  });

  describe('POST /api/clientes', () => {
    it('should create a new cliente', async () => {
      const clienteData = {
        nombre: `Test Cliente API ${timestamp}`,
        ciudad: 'Test City',
        contacto: 'John Doe',
        email: `api${timestamp}@test.com`,
        telefono: '+521234567890'
      };

      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clienteData)
        .expect(201);

      assert.ok(response.body.id, 'Response should have ID');
      assert.strictEqual(response.body.nombre, clienteData.nombre);
      assert.strictEqual(response.body.email, clienteData.email);

      testClienteId = response.body.id;
    });

    it('should fail without auth token', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .send({ nombre: 'Test' })
        .expect(401);

      assert.ok(response.body.error || response.body.message);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty body
        .expect(400);

      assert.ok(response.body.error || response.body.message);
    });
  });

  describe('GET /api/clientes', () => {
    it('should retrieve all clientes', async () => {
      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(Array.isArray(response.body));
      assert.ok(response.body.length > 0);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/clientes?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(Array.isArray(response.body));
      assert.ok(response.body.length <= 5);
    });
  });

  describe('GET /api/clientes/:id', () => {
    it('should retrieve cliente by ID', async () => {
      const response = await request(app)
        .get(`/api/clientes/${testClienteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(response.body.id, testClienteId);
      assert.strictEqual(response.body.nombre, `Test Cliente API ${timestamp}`);
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app)
        .get('/api/clientes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/clientes/:id', () => {
    it('should update cliente', async () => {
      const updateData = {
        ciudad: 'Updated City',
        telefono: '+529876543210'
      };

      const response = await request(app)
        .put(`/api/clientes/${testClienteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      assert.strictEqual(response.body.ciudad, 'Updated City');
      assert.strictEqual(response.body.telefono, '+529876543210');
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app)
        .put('/api/clientes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ciudad: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('should soft delete cliente', async () => {
      // Create a temp cliente to delete
      const tempCliente = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: `Temp Cliente ${timestamp}`,
          email: `temp${timestamp}@test.com`
        })
        .expect(201);

      const tempId = tempCliente.body.id;

      // Delete it
      await request(app)
        .delete(`/api/clientes/${tempId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's not in the list anymore
      const getResponse = await request(app)
        .get(`/api/clientes/${tempId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

console.log('✅ Clientes API Integration Tests completed');
