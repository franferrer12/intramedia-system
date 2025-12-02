import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import pool from '../src/config/database.js';
import Contract from '../src/models/Contract.js';

describe('Contract Model Tests', () => {
  let testContractId;
  let testClienteId;
  const testUserId = 1; // Assuming user 1 exists from seed data
  const timestamp = Date.now();

  before(async () => {
    // Create a test cliente
    const clienteResult = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`Test Cliente Contract ${timestamp}`, `contract${timestamp}@test.com`, '1234567890']
    );
    testClienteId = clienteResult.rows[0].id;
  });

  after(async () => {
    // Cleanup
    if (testContractId) {
      await pool.query('DELETE FROM contract_history WHERE contract_id = $1', [testContractId]);
      await pool.query('DELETE FROM contracts WHERE id = $1', [testContractId]);
    }
    await pool.query('DELETE FROM clientes WHERE id = $1', [testClienteId]);
  });

  describe('create', () => {
    it('should create a new contract', async () => {
      const contractData = {
        contract_type: 'service',
        cliente_id: testClienteId,
        party_a_name: 'IntraMedia Agency',
        party_a_id: '12345678A',
        party_a_address: 'Calle Principal 123',
        party_b_name: 'Test Cliente Contract',
        party_b_id: '87654321B',
        party_b_address: 'Avenida Test 456',
        party_b_email: 'contract@test.com',
        party_b_phone: '1234567890',
        title: 'Test Service Contract',
        description: 'Contract for testing purposes',
        content: 'This is the contract content for testing',
        total_amount: 5000,
        currency: 'EUR',
        payment_terms: 'Net 30',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        created_by: testUserId
      };

      const contract = await Contract.create(contractData);

      assert.ok(contract.id, 'Contract should have an ID');
      assert.strictEqual(contract.contract_type, 'service');
      assert.strictEqual(contract.title, 'Test Service Contract');
      assert.strictEqual(contract.status, 'draft'); // Default status

      testContractId = contract.id;
    });
  });

  describe('getById', () => {
    it('should retrieve a contract by ID', async () => {
      const contract = await Contract.getById(testContractId);

      assert.ok(contract, 'Contract should exist');
      assert.strictEqual(contract.id, testContractId);
      assert.strictEqual(contract.title, 'Test Service Contract');
    });

    it('should return null for non-existent ID', async () => {
      const contract = await Contract.getById(999999);
      assert.strictEqual(contract, null);
    });
  });

  describe('getAll', () => {
    it('should retrieve contracts with pagination', async () => {
      const result = await Contract.getAll({ page: 1, limit: 10 });

      assert.ok('contracts' in result, 'Should have contracts property');
      assert.ok('pagination' in result, 'Should have pagination property');
      assert.ok(Array.isArray(result.contracts), 'Contracts should be an array');
      assert.ok(result.contracts.length > 0, 'Should have at least one contract');
    });

    it('should filter contracts by type', async () => {
      const result = await Contract.getAll({
        page: 1,
        limit: 10,
        contract_type: 'service'
      });

      assert.ok(Array.isArray(result.contracts));
      if (result.contracts.length > 0) {
        assert.strictEqual(result.contracts[0].contract_type, 'service');
      }
    });

    it('should filter contracts by cliente_id', async () => {
      const result = await Contract.getAll({
        page: 1,
        limit: 10,
        cliente_id: testClienteId
      });

      assert.ok(Array.isArray(result.contracts));
      if (result.contracts.length > 0) {
        assert.strictEqual(result.contracts[0].cliente_id, testClienteId);
      }
    });
  });

  describe('update', () => {
    it('should update contract details', async () => {
      const updated = await Contract.update(
        testContractId,
        {
          title: 'Updated Test Contract',
          description: 'Updated description'
        },
        testUserId
      );

      assert.strictEqual(updated.title, 'Updated Test Contract');
      assert.strictEqual(updated.description, 'Updated description');
    });

    it('should update contract amount', async () => {
      const updated = await Contract.update(
        testContractId,
        { total_amount: 6000 },
        testUserId
      );

      assert.strictEqual(parseFloat(updated.total_amount), 6000);
    });
  });

  describe('updateStatus', () => {
    it('should update contract status', async () => {
      const updated = await Contract.updateStatus(
        testContractId,
        'pending_signature',
        testUserId,
        'Ready for signature'
      );

      assert.strictEqual(updated.status, 'pending_signature');
    });

    it('should record status change in history', async () => {
      const history = await Contract.getHistory(testContractId);

      assert.ok(Array.isArray(history));
      assert.ok(history.length > 0);
      assert.ok(history.some(h => h.action === 'status_changed'));
    });
  });

  describe('getHistory', () => {
    it('should retrieve contract history', async () => {
      const history = await Contract.getHistory(testContractId);

      assert.ok(Array.isArray(history), 'History should be an array');
      assert.ok(history.length > 0, 'Should have at least one history entry');
      assert.ok(history[0].action, 'History should have action');
      assert.ok(history[0].changed_at, 'History should have timestamp');
    });
  });
});

console.log('✅ Contract Model Tests completed');
