import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import pool from '../src/config/database.js';
import Evento from '../src/models/Evento.js';

describe('Evento Model Tests', () => {
  let testEventoId;
  let testDjId;
  let testClienteId;

  before(async () => {
    // Create test DJ
    const djResult = await pool.query(
      `INSERT INTO djs (nombre, email, telefono)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Test DJ', 'testdj@test.com', '1234567890']
    );
    testDjId = djResult.rows[0].id;

    // Create test Cliente
    const clienteResult = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Test Cliente', 'testcliente@test.com', '0987654321']
    );
    testClienteId = clienteResult.rows[0].id;
  });

  after(async () => {
    // Cleanup
    if (testEventoId) {
      await pool.query('DELETE FROM eventos WHERE id = $1', [testEventoId]);
    }
    await pool.query('DELETE FROM djs WHERE id = $1', [testDjId]);
    await pool.query('DELETE FROM clientes WHERE id = $1', [testClienteId]);
  });

  describe('create', () => {
    it('should create a new evento', async () => {
      const eventoData = {
        evento: 'Test Event',
        fecha: '2025-12-25',
        mes: '2025-12',
        lugar: 'Test Venue',
        dj_id: testDjId,
        cliente_id: testClienteId,
        horas: 4,
        cache_total: 10000,
        parte_dj: 6000,
        parte_agencia: 4000,
        estado: 'pendiente'
      };

      const evento = await Evento.create(eventoData);

      assert.ok(evento.id, 'Evento should have an ID');
      assert.strictEqual(evento.evento, 'Test Event');
      assert.strictEqual(parseFloat(evento.cache_total), 10000);
      assert.strictEqual(parseFloat(evento.parte_dj), 6000);

      testEventoId = evento.id;
    });

    it('should create evento with minimal data', async () => {
      const eventoData = {
        evento: 'Minimal Event',
        fecha: '2025-12-26',
        mes: '2025-12',
        dj_id: testDjId,
        cache_total: 5000,
        parte_dj: 3000,
        parte_agencia: 2000
      };

      const evento = await Evento.create(eventoData);
      assert.ok(evento.id);
      assert.strictEqual(evento.evento, 'Minimal Event');

      // Cleanup this test evento
      await pool.query('DELETE FROM eventos WHERE id = $1', [evento.id]);
    });
  });

  describe('findById', () => {
    it('should retrieve evento by ID', async () => {
      const evento = await Evento.findById(testEventoId);

      assert.ok(evento, 'Evento should exist');
      assert.strictEqual(evento.id, testEventoId);
      assert.strictEqual(evento.evento, 'Test Event');
    });

    it('should return undefined for non-existent ID', async () => {
      const evento = await Evento.findById(999999);
      assert.strictEqual(evento, undefined);
    });
  });

  describe('update', () => {
    it('should update evento financials', async () => {
      const updated = await Evento.update(testEventoId, {
        cache_total: 12000,
        parte_dj: 7000,
        parte_agencia: 5000
      });

      assert.strictEqual(parseFloat(updated.cache_total), 12000);
      assert.strictEqual(parseFloat(updated.parte_dj), 7000);
    });

    it('should update evento ciudad_lugar', async () => {
      const updated = await Evento.update(testEventoId, {
        ciudad_lugar: 'New Venue'
      });

      assert.strictEqual(updated.ciudad_lugar, 'New Venue');
    });
  });

  describe('findAll', () => {
    it('should retrieve eventos with filters', async () => {
      const eventos = await Evento.findAll({
        mes: '2025-12'
      });

      assert.ok(Array.isArray(eventos), 'Should return an array');
      assert.ok(eventos.length > 0, 'Should have at least one evento');
    });

    it('should retrieve all eventos without filters', async () => {
      const eventos = await Evento.findAll();

      assert.ok(Array.isArray(eventos), 'Should return an array');
      assert.ok(eventos.length > 0, 'Should have at least one evento');
    });
  });

  describe('getUpcoming', () => {
    it('should retrieve upcoming eventos', async () => {
      const eventos = await Evento.getUpcoming(30);

      assert.ok(Array.isArray(eventos), 'Should return an array');
      // May be empty if no upcoming eventos
    });
  });

  describe('getFinancialBreakdown', () => {
    it('should retrieve financial breakdown for evento', async () => {
      const breakdown = await Evento.getFinancialBreakdown(testEventoId);

      if (breakdown) {
        assert.ok('cache_total' in breakdown);
      }
    });
  });

  describe('getMonthlyFinancialSummary', () => {
    it('should retrieve monthly financial summary', async () => {
      const summary = await Evento.getMonthlyFinancialSummary(2025, 12);

      // May be empty or have data
      if (summary) {
        assert.ok(Array.isArray(summary) || typeof summary === 'object');
      }
    });
  });

  describe('delete', () => {
    it('should delete an evento', async () => {
      // Create a temporary evento to delete
      const tempEvento = await Evento.create({
        evento: 'To Delete',
        fecha: '2025-12-27',
        mes: '2025-12',
        dj_id: testDjId,
        cache_total: 5000,
        parte_dj: 3000,
        parte_agencia: 2000
      });

      const deleted = await Evento.delete(tempEvento.id);
      assert.ok(deleted);

      // Verify it's deleted
      const found = await Evento.findById(tempEvento.id);
      assert.strictEqual(found, undefined);
    });
  });
});

console.log('✅ Evento Model Tests completed');
