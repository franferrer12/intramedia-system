import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import pool from '../src/config/database.js';
import DJ from '../src/models/DJ.js';

describe('DJ Model Tests', () => {
  let testDJId;
  const timestamp = Date.now();

  after(async () => {
    // Cleanup
    if (testDJId) {
      await pool.query('DELETE FROM djs WHERE id = $1', [testDJId]);
    }
  });

  describe('create', () => {
    it('should create a new DJ', async () => {
      const djData = {
        nombre: `DJ Test ${timestamp}`,
        email: `djtest${timestamp}@example.com`,
        telefono: '+521234567890',
        observaciones: 'Test DJ for unit tests'
      };

      const dj = await DJ.create(djData);

      assert.ok(dj.id, 'DJ should have an ID');
      assert.strictEqual(dj.nombre, `DJ Test ${timestamp}`);
      assert.strictEqual(dj.email, `djtest${timestamp}@example.com`);
      assert.strictEqual(dj.telefono, '+521234567890');

      testDJId = dj.id;
    });

    it('should create DJ with minimal data', async () => {
      const dj = await DJ.create({ nombre: `Minimal DJ ${timestamp}` });

      assert.ok(dj.id);
      assert.strictEqual(dj.nombre, `Minimal DJ ${timestamp}`);

      // Cleanup
      await pool.query('DELETE FROM djs WHERE id = $1', [dj.id]);
    });
  });

  describe('findById', () => {
    it('should retrieve DJ by ID', async () => {
      const dj = await DJ.findById(testDJId);

      assert.ok(dj, 'DJ should exist');
      assert.strictEqual(dj.id, testDJId);
      assert.strictEqual(dj.nombre, `DJ Test ${timestamp}`);
    });

    it('should return undefined for non-existent ID', async () => {
      const dj = await DJ.findById(999999);
      assert.strictEqual(dj, undefined);
    });
  });

  describe('update', () => {
    it('should update DJ observaciones', async () => {
      const updated = await DJ.update(testDJId, { observaciones: 'Updated notes' });

      assert.strictEqual(updated.observaciones, 'Updated notes');
    });

    it('should update DJ contact info', async () => {
      const updated = await DJ.update(testDJId, {
        telefono: '+529876543210',
        email: `updated${timestamp}@example.com`
      });

      assert.strictEqual(updated.telefono, '+529876543210');
      assert.strictEqual(updated.email, `updated${timestamp}@example.com`);
    });
  });

  describe('findAll', () => {
    it('should retrieve all active DJs', async () => {
      const djs = await DJ.findAll();

      assert.ok(Array.isArray(djs), 'Should return an array');
      assert.ok(djs.length > 0, 'Should have at least one DJ');
      // All DJs should be active
      assert.ok(djs.every(d => d.activo), 'All DJs should be active');
    });
  });

  describe('findByEmail', () => {
    it('should find DJ by email', async () => {
      const dj = await DJ.findByEmail(`updated${timestamp}@example.com`);

      assert.ok(dj);
      assert.strictEqual(dj.id, testDJId);
    });

    it('should return undefined for non-existent email', async () => {
      const dj = await DJ.findByEmail('nonexistent@example.com');
      assert.strictEqual(dj, undefined);
    });
  });

  describe('getFinancialStatsById', () => {
    it('should retrieve financial stats for a DJ', async () => {
      const stats = await DJ.getFinancialStatsById(testDJId);

      // May be undefined if no eventos exist for this DJ
      if (stats) {
        assert.ok('dj_id' in stats);
      }
    });
  });

  describe('getEventos', () => {
    it('should retrieve eventos for a DJ', async () => {
      const eventos = await DJ.getEventos(testDJId);

      assert.ok(Array.isArray(eventos), 'Should return an array');
      // May be empty if DJ has no eventos
    });
  });
});

console.log('✅ DJ Model Tests completed');
