import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';
import pool from '../src/config/database.js';

describe('DJs API Integration Tests', () => {
  let authToken;
  let testDJId;
  const timestamp = Date.now();

  before(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@intramedia.com',
        password: 'admin123'
      });

    if (loginResponse.status === 200 && loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }
  });

  after(async () => {
    // Cleanup test data
    if (testDJId) {
      await pool.query('DELETE FROM djs WHERE id = $1', [testDJId]);
    }
  });

  describe('POST /api/djs', () => {
    it('should create a new DJ', async () => {
      const djData = {
        nombre: `Test DJ API ${timestamp}`,
        email: `djapi${timestamp}@example.com`,
        telefono: '+521234567890',
        genero_musical: 'Electronic',
        observaciones: 'Test DJ for integration tests'
      };

      const response = await request(app)
        .post('/api/djs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(djData)
        .expect(201);

      assert.ok(response.body.id, 'Response should have ID');
      assert.strictEqual(response.body.nombre, djData.nombre);
      assert.strictEqual(response.body.email, djData.email);

      testDJId = response.body.id;
    });

    it('should fail without auth token', async () => {
      const response = await request(app)
        .post('/api/djs')
        .send({ nombre: 'Test DJ' })
        .expect(401);

      assert.ok(response.body.error || response.body.message);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/djs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty body
        .expect(400);

      assert.ok(response.body.error || response.body.message);
    });
  });

  describe('GET /api/djs', () => {
    it('should retrieve all DJs', async () => {
      const response = await request(app)
        .get('/api/djs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(Array.isArray(response.body));
      assert.ok(response.body.length > 0);
    });

    it('should filter by genero_musical', async () => {
      const response = await request(app)
        .get('/api/djs?genero_musical=Electronic')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(Array.isArray(response.body));
      if (response.body.length > 0) {
        assert.strictEqual(response.body[0].genero_musical, 'Electronic');
      }
    });
  });

  describe('GET /api/djs/:id', () => {
    it('should retrieve DJ by ID', async () => {
      const response = await request(app)
        .get(`/api/djs/${testDJId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(response.body.id, testDJId);
      assert.strictEqual(response.body.nombre, `Test DJ API ${timestamp}`);
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app)
        .get('/api/djs/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/djs/:id', () => {
    it('should update DJ', async () => {
      const updateData = {
        genero_musical: 'House',
        telefono: '+529876543210'
      };

      const response = await request(app)
        .put(`/api/djs/${testDJId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      assert.strictEqual(response.body.genero_musical, 'House');
      assert.strictEqual(response.body.telefono, '+529876543210');
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app)
        .put('/api/djs/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ genero_musical: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/djs/:id', () => {
    it('should soft delete DJ', async () => {
      // Create a temp DJ to delete
      const tempDJ = await request(app)
        .post('/api/djs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: `Temp DJ ${timestamp}`,
          email: `tempdj${timestamp}@example.com`
        })
        .expect(201);

      const tempId = tempDJ.body.id;

      // Delete it
      await request(app)
        .delete(`/api/djs/${tempId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's not in the list anymore
      await request(app)
        .get(`/api/djs/${tempId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/djs/:id/eventos', () => {
    it('should retrieve eventos for a DJ', async () => {
      const response = await request(app)
        .get(`/api/djs/${testDJId}/eventos`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(Array.isArray(response.body));
      // May be empty if DJ has no eventos yet
    });
  });
});

console.log('✅ DJs API Integration Tests completed');
