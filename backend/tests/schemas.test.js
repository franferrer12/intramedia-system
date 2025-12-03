import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createEventoSchema,
  updateEventoSchema,
  eventoIdSchema,
  eventoSchema
} from '../src/schemas/evento.schema.js';
import {
  createContractSchema,
  updateContractSchema,
  signContractSchema,
  updateStatusSchema
} from '../src/schemas/contract.schema.js';
import {
  createDJSchema,
  updateDJSchema
} from '../src/schemas/dj.schema.js';
import {
  createClienteSchema,
  updateClienteSchema
} from '../src/schemas/cliente.schema.js';

describe('Zod Schemas Validation', () => {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENTO SCHEMAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Evento Schema', () => {
    it('should validate correct evento data', () => {
      const validEvento = {
        fecha: '2025-12-15',
        mes: 'diciembre',
        evento: 'Boda María y Juan',
        ciudad_lugar: 'Madrid, España',
        dj_id: 1,
        cliente_id: 2,
        categoria_id: 3,
        horas: 6,
        cache_total: 1000,
        parte_dj: 700,
        parte_agencia: 300,
        reserva: 200,
        cobrado_cliente: false,
        pagado_dj: false,
        costo_alquiler: 0,
        otros_costos: 0
      };

      const result = eventoSchema.safeParse(validEvento);
      assert.strictEqual(result.success, true);
    });

    it('should reject evento with invalid fecha format', () => {
      const invalidEvento = {
        fecha: '15-12-2025', // Wrong format
        mes: 'diciembre',
        evento: 'Test Event',
        ciudad_lugar: 'Madrid',
        dj_id: 1,
        cliente_id: 2,
        horas: 6,
        cache_total: 1000,
        parte_dj: 700,
        parte_agencia: 300
      };

      const result = createEventoSchema.safeParse(invalidEvento);
      assert.strictEqual(result.success, false);
    });

    it('should reject evento with invalid mes', () => {
      const invalidEvento = {
        fecha: '2025-12-15',
        mes: 'invalid_month',
        evento: 'Test Event',
        ciudad_lugar: 'Madrid',
        dj_id: 1,
        cliente_id: 2,
        horas: 6,
        cache_total: 1000,
        parte_dj: 700,
        parte_agencia: 300
      };

      const result = createEventoSchema.safeParse(invalidEvento);
      assert.strictEqual(result.success, false);
    });

    it('should reject when cache_total does not match sum', () => {
      const invalidEvento = {
        fecha: '2025-12-15',
        mes: 'diciembre',
        evento: 'Test Event',
        ciudad_lugar: 'Madrid',
        dj_id: 1,
        cliente_id: 2,
        horas: 6,
        cache_total: 1000,
        parte_dj: 500, // Sum = 800, but cache_total = 1000
        parte_agencia: 300
      };

      const result = createEventoSchema.safeParse(invalidEvento);
      assert.strictEqual(result.success, false);
    });

    it('should validate eventoIdSchema with numeric string', () => {
      const result = eventoIdSchema.safeParse({ id: '123' });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.id, 123);
    });

    it('should reject eventoIdSchema with non-numeric string', () => {
      const result = eventoIdSchema.safeParse({ id: 'abc' });
      assert.strictEqual(result.success, false);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONTRACT SCHEMAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Contract Schema', () => {
    it('should validate correct contract data', () => {
      const validContract = {
        contract_type: 'service',
        party_a_name: 'Intra Media SL',
        party_a_id: 'B12345678',
        party_a_address: 'Calle Principal 123, Madrid',
        party_b_name: 'Juan Pérez',
        party_b_id: '12345678A',
        party_b_address: 'Calle Secundaria 456, Barcelona',
        party_b_email: 'juan@example.com',
        party_b_phone: '+34612345678',
        title: 'Contrato de Servicios DJ',
        content: 'Este es el contenido completo del contrato con todos los términos y condiciones necesarios...',
        total_amount: 1500,
        currency: 'EUR',
        start_date: '2025-12-01',
        created_by: 1
      };

      const result = createContractSchema.safeParse(validContract);
      assert.strictEqual(result.success, true);
    });

    it('should reject contract with invalid email', () => {
      const invalidContract = {
        contract_type: 'service',
        party_a_name: 'Company',
        party_a_id: 'B12345678',
        party_a_address: 'Address 123',
        party_b_name: 'John Doe',
        party_b_id: '12345678A',
        party_b_address: 'Address 456',
        party_b_email: 'invalid-email', // Invalid
        party_b_phone: '+34612345678',
        title: 'Test Contract',
        content: 'Contract content here...',
        total_amount: 1000,
        start_date: '2025-12-01',
        created_by: 1
      };

      const result = createContractSchema.safeParse(invalidContract);
      assert.strictEqual(result.success, false);
    });

    it('should reject contract when end_date is before start_date', () => {
      const invalidContract = {
        contract_type: 'service',
        party_a_name: 'Company',
        party_a_id: 'B12345678',
        party_a_address: 'Address 123',
        party_b_name: 'John Doe',
        party_b_id: '12345678A',
        party_b_address: 'Address 456',
        party_b_email: 'john@example.com',
        party_b_phone: '+34612345678',
        title: 'Test Contract',
        content: 'Contract content here...',
        total_amount: 1000,
        start_date: '2025-12-01',
        end_date: '2025-11-01', // Before start_date!
        created_by: 1
      };

      const result = createContractSchema.safeParse(invalidContract);
      assert.strictEqual(result.success, false);
    });

    it('should validate signContractSchema', () => {
      const validSign = {
        party: 'a',
        signatureData: {
          signature: 'base64_encoded_signature_data_here_minimum_50_chars_long',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0',
          timestamp: new Date().toISOString()
        }
      };

      const result = signContractSchema.safeParse(validSign);
      assert.strictEqual(result.success, true);
    });

    it('should reject cancelled status without reason', () => {
      const invalidStatus = {
        status: 'cancelled'
        // Missing reason
      };

      const result = updateStatusSchema.safeParse(invalidStatus);
      assert.strictEqual(result.success, false);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DJ SCHEMAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('DJ Schema', () => {
    it('should validate correct DJ data', () => {
      const validDJ = {
        nombre: 'Carlos DJ',
        email: 'carlos@example.com',
        telefono: '+34612345678',
        nombre_artistico: 'DJ Carlos',
        tipo: 'externo',
        instagram: '@djcarlos',
        activo: true
      };

      const result = createDJSchema.safeParse(validDJ);
      assert.strictEqual(result.success, true);
    });

    it('should reject DJ with invalid email', () => {
      const invalidDJ = {
        nombre: 'Carlos DJ',
        email: 'not-an-email',
        telefono: '+34612345678'
      };

      const result = createDJSchema.safeParse(invalidDJ);
      assert.strictEqual(result.success, false);
    });

    it('should reject DJ with invalid tipo', () => {
      const invalidDJ = {
        nombre: 'Carlos DJ',
        email: 'carlos@example.com',
        telefono: '+34612345678',
        tipo: 'invalid_type' // Should be 'interno' or 'externo'
      };

      const result = createDJSchema.safeParse(invalidDJ);
      assert.strictEqual(result.success, false);
    });

    it('should validate update DJ schema', () => {
      const updateData = {
        nombre: 'Carlos Updated',
        porcentaje_comision: 15,
        activo: false
      };

      const result = updateDJSchema.safeParse(updateData);
      assert.strictEqual(result.success, true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLIENTE SCHEMAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Cliente Schema', () => {
    it('should validate correct cliente data', () => {
      const validCliente = {
        nombre: 'María López',
        email: 'maria@example.com',
        telefono: '+34612345678',
        tipo: 'particular',
        ciudad: 'Madrid',
        activo: true
      };

      const result = createClienteSchema.safeParse(validCliente);
      assert.strictEqual(result.success, true);
    });

    it('should reject empresa without company name', () => {
      const invalidCliente = {
        nombre: 'Contact Name',
        email: 'contact@example.com',
        telefono: '+34612345678',
        tipo: 'empresa'
        // Missing 'empresa' field required for tipo='empresa'
      };

      const result = createClienteSchema.safeParse(invalidCliente);
      assert.strictEqual(result.success, false);
    });

    it('should validate empresa with company name', () => {
      const validCliente = {
        nombre: 'Contact Name',
        email: 'contact@example.com',
        telefono: '+34612345678',
        tipo: 'empresa',
        empresa: 'Example Corp SL' // Required for tipo='empresa'
      };

      const result = createClienteSchema.safeParse(validCliente);
      assert.strictEqual(result.success, true);
    });

    it('should validate cliente with valoracion in range 1-5', () => {
      const validCliente = {
        nombre: 'Test Cliente',
        email: 'test@example.com',
        telefono: '+34612345678',
        tipo: 'particular',
        valoracion: 5
      };

      const result = createClienteSchema.safeParse(validCliente);
      assert.strictEqual(result.success, true);
    });

    it('should reject cliente with valoracion out of range', () => {
      const invalidCliente = {
        nombre: 'Test Cliente',
        email: 'test@example.com',
        telefono: '+34612345678',
        tipo: 'particular',
        valoracion: 6 // Out of range (1-5)
      };

      const result = createClienteSchema.safeParse(invalidCliente);
      assert.strictEqual(result.success, false);
    });
  });
});
