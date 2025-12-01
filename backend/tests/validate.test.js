import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { validate, validateId, validatePagination, sanitizeBody } from '../src/middleware/validate.js';
import { z } from 'zod';

describe('Validation Middleware', () => {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALIDATE MIDDLEWARE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('validate()', () => {
    it('should validate body successfully', async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().positive()
      });

      const req = {
        body: { name: 'John', age: 25 }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.deepStrictEqual(req.body, { name: 'John', age: 25 });
    });

    it('should return 400 for invalid body', async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().positive()
      });

      const req = {
        body: { name: 'Jo', age: -5 } // Too short name, negative age
      };
      const res = {
        status: mock.fn(function(code) {
          assert.strictEqual(code, 400);
          return this;
        }),
        json: mock.fn((data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.message, 'Error de validación');
          assert(Array.isArray(data.errors));
        })
      };
      const next = mock.fn();

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.strictEqual(res.json.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls.length, 0); // Should not call next
    });

    it('should validate params successfully', async () => {
      const schema = z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
      });

      const req = {
        params: { id: '123' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validate({ params: schema });
      await middleware(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(req.params.id, 123); // Transformed to number
    });

    it('should validate query successfully', async () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
      });

      const req = {
        query: { page: '2', limit: '20' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validate({ query: schema });
      await middleware(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(req.query.page, 2);
      assert.strictEqual(req.query.limit, 20);
    });

    it('should validate multiple parts (body + params)', async () => {
      const bodySchema = z.object({
        name: z.string()
      });
      const paramsSchema = z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
      });

      const req = {
        body: { name: 'Test' },
        params: { id: '42' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validate({ body: bodySchema, params: paramsSchema });
      await middleware(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(req.body.name, 'Test');
      assert.strictEqual(req.params.id, 42);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALIDATE ID MIDDLEWARE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('validateId()', () => {
    it('should validate numeric ID successfully', () => {
      const req = {
        params: { id: '123' }
      };
      const res = {};
      const next = mock.fn();

      validateId(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(req.params.id, 123);
    });

    it('should reject non-numeric ID', () => {
      const req = {
        params: { id: 'abc' }
      };
      const res = {
        status: mock.fn(function(code) {
          assert.strictEqual(code, 400);
          return this;
        }),
        json: mock.fn((data) => {
          assert.strictEqual(data.success, false);
          assert.strictEqual(data.message, 'ID inválido');
        })
      };
      const next = mock.fn();

      validateId(req, res, next);

      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls.length, 0);
    });

    it('should reject negative ID', () => {
      const req = {
        params: { id: '-5' }
      };
      const res = {
        status: mock.fn(function(code) {
          return this;
        }),
        json: mock.fn()
      };
      const next = mock.fn();

      validateId(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
    });

    it('should reject ID exceeding max PostgreSQL INT', () => {
      const req = {
        params: { id: '2147483648' } // Max INT + 1
      };
      const res = {
        status: mock.fn(function(code) {
          assert.strictEqual(code, 400);
          return this;
        }),
        json: mock.fn((data) => {
          assert.strictEqual(data.message, 'ID fuera de rango');
        })
      };
      const next = mock.fn();

      validateId(req, res, next);

      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls.length, 0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALIDATE PAGINATION MIDDLEWARE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('validatePagination()', () => {
    it('should use default values when not provided', () => {
      const req = {
        query: {}
      };
      const res = {};
      const next = mock.fn();

      const middleware = validatePagination();
      middleware(req, res, next);

      assert.strictEqual(req.query.page, 1);
      assert.strictEqual(req.query.limit, 20);
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should parse valid pagination params', () => {
      const req = {
        query: { page: '3', limit: '50' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validatePagination();
      middleware(req, res, next);

      assert.strictEqual(req.query.page, 3);
      assert.strictEqual(req.query.limit, 50);
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should enforce maxLimit', () => {
      const req = {
        query: { page: '1', limit: '200' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validatePagination({ maxLimit: 100 });
      middleware(req, res, next);

      assert.strictEqual(req.query.limit, 100); // Capped at maxLimit
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should handle invalid page as default', () => {
      const req = {
        query: { page: 'invalid', limit: '20' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validatePagination();
      middleware(req, res, next);

      assert.strictEqual(req.query.page, 1); // Default
      assert.strictEqual(req.query.limit, 20);
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should handle negative page as default', () => {
      const req = {
        query: { page: '-5', limit: '20' }
      };
      const res = {};
      const next = mock.fn();

      const middleware = validatePagination();
      middleware(req, res, next);

      assert.strictEqual(req.query.page, 1); // Default
    });

    it('should use custom defaults', () => {
      const req = {
        query: {}
      };
      const res = {};
      const next = mock.fn();

      const middleware = validatePagination({
        defaultPage: 2,
        defaultLimit: 50
      });
      middleware(req, res, next);

      assert.strictEqual(req.query.page, 2);
      assert.strictEqual(req.query.limit, 50);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SANITIZE BODY MIDDLEWARE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('sanitizeBody()', () => {
    it('should trim string values', () => {
      const req = {
        body: {
          name: '  John Doe  ',
          email: ' test@example.com ',
          age: 25
        }
      };
      const res = {};
      const next = mock.fn();

      sanitizeBody(req, res, next);

      assert.strictEqual(req.body.name, 'John Doe');
      assert.strictEqual(req.body.email, 'test@example.com');
      assert.strictEqual(req.body.age, 25); // Numbers unchanged
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should trim strings in arrays', () => {
      const req = {
        body: {
          tags: ['  tag1  ', ' tag2 ', 'tag3']
        }
      };
      const res = {};
      const next = mock.fn();

      sanitizeBody(req, res, next);

      assert.deepStrictEqual(req.body.tags, ['tag1', 'tag2', 'tag3']);
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should handle empty body', () => {
      const req = {
        body: {}
      };
      const res = {};
      const next = mock.fn();

      sanitizeBody(req, res, next);

      assert.deepStrictEqual(req.body, {});
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should handle null body', () => {
      const req = {
        body: null
      };
      const res = {};
      const next = mock.fn();

      sanitizeBody(req, res, next);

      assert.strictEqual(req.body, null);
      assert.strictEqual(next.mock.calls.length, 1);
    });

    it('should preserve nested objects', () => {
      const req = {
        body: {
          user: {
            name: '  John  ',
            address: {
              city: ' Madrid '
            }
          }
        }
      };
      const res = {};
      const next = mock.fn();

      sanitizeBody(req, res, next);

      // Only top-level strings are trimmed
      assert.strictEqual(next.mock.calls.length, 1);
    });
  });
});
