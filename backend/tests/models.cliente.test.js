import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import pool from '../src/config/database.js';
import Cliente from '../src/models/Cliente.js';

describe('Cliente Model Tests', () => {
  let testClienteId;
  const timestamp = Date.now();

  after(async () => {
    // Cleanup
    if (testClienteId) {
      await pool.query('DELETE FROM clientes WHERE id = $1', [testClienteId]);
    }
  });

  describe('create', () => {
    it('should create a new cliente', async () => {
      const clienteData = {
        nombre: `Cliente Test ${timestamp}`,
        ciudad: 'Test City',
        contacto: 'John Doe',
        email: `cliente${timestamp}@test.com`,
        telefono: '+521234567890',
        observaciones: 'Test observations'
      };

      const cliente = await Cliente.create(clienteData);

      assert.ok(cliente.id, 'Cliente should have an ID');
      assert.strictEqual(cliente.nombre, `Cliente Test ${timestamp}`);
      assert.strictEqual(cliente.email, `cliente${timestamp}@test.com`);
      assert.strictEqual(cliente.ciudad, 'Test City');

      testClienteId = cliente.id;
    });

    it('should create cliente with minimal data', async () => {
      const cliente = await Cliente.create({ nombre: `Minimal Cliente ${timestamp}` });

      assert.ok(cliente.id);
      assert.strictEqual(cliente.nombre, `Minimal Cliente ${timestamp}`);

      // Cleanup
      await pool.query('DELETE FROM clientes WHERE id = $1', [cliente.id]);
    });
  });

  describe('findById', () => {
    it('should retrieve cliente by ID', async () => {
      const cliente = await Cliente.findById(testClienteId);

      assert.ok(cliente, 'Cliente should exist');
      assert.strictEqual(cliente.id, testClienteId);
      assert.strictEqual(cliente.nombre, `Cliente Test ${timestamp}`);
    });

    it('should return undefined for non-existent ID', async () => {
      const cliente = await Cliente.findById(999999);
      assert.strictEqual(cliente, undefined);
    });
  });

  describe('update', () => {
    it('should update cliente contact info', async () => {
      const updated = await Cliente.update(testClienteId, {
        telefono: '+529876543210',
        email: `updated${timestamp}@test.com`
      });

      assert.strictEqual(updated.telefono, '+529876543210');
      assert.strictEqual(updated.email, `updated${timestamp}@test.com`);
    });

    it('should update cliente ciudad', async () => {
      const updated = await Cliente.update(testClienteId, {
        ciudad: 'New City'
      });

      assert.strictEqual(updated.ciudad, 'New City');
    });
  });

  describe('findAll', () => {
    it('should retrieve all active clientes', async () => {
      const clientes = await Cliente.findAll();

      assert.ok(Array.isArray(clientes), 'Should return an array');
      assert.ok(clientes.length > 0, 'Should have at least one cliente');
      // All clientes should be active
      assert.ok(clientes.every(c => c.activo), 'All clientes should be active');
    });
  });

  describe('findOrCreate', () => {
    it('should find existing cliente', async () => {
      const cliente = await Cliente.findOrCreate(`Cliente Test ${timestamp}`);

      assert.ok(cliente);
      assert.strictEqual(cliente.id, testClienteId);
    });

    it('should create non-existent cliente', async () => {
      const cliente = await Cliente.findOrCreate(`New Unique Cliente ${timestamp}`, 'New City');

      assert.ok(cliente.id);
      assert.strictEqual(cliente.nombre, `New Unique Cliente ${timestamp}`);

      // Cleanup
      await pool.query('DELETE FROM clientes WHERE id = $1', [cliente.id]);
    });
  });

  describe('getFinancialStatsById', () => {
    it('should retrieve financial stats for a cliente', async () => {
      const stats = await Cliente.getFinancialStatsById(testClienteId);

      // May be undefined if no eventos exist for this cliente
      if (stats) {
        assert.ok('cliente_id' in stats);
      }
    });
  });
});

console.log('✅ Cliente Model Tests completed');
