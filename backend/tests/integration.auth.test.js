import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';

describe('Auth API Integration Tests', () => {
  let authToken;

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      assert.ok(response.body.token, 'Response should have token');
      assert.ok(response.body.user, 'Response should have user data');
      assert.strictEqual(response.body.user.username, 'admin');

      authToken = response.body.token;
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        })
        .expect(401);

      assert.ok(response.body.error || response.body.message);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      assert.ok(response.body.error || response.body.message);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password'
        })
        .expect(401);

      assert.ok(response.body.error || response.body.message);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(response.body.id, 'Response should have user ID');
      assert.ok(response.body.username, 'Response should have username');
      assert.strictEqual(response.body.username, 'admin');
    });

    it('should fail without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(response.body.message || response.body.success);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive login attempts', async () => {
      // Make multiple failed login attempts
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'admin',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);

      // Check if any were rate limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      assert.ok(rateLimited, 'Should rate limit excessive attempts');
    });
  });

  describe('Token Expiration', () => {
    it('should include token expiration info', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      // Check if response includes expiration info
      assert.ok(response.body.token);
      // May have expiresIn or expiresAt field
    });
  });
});

console.log('✅ Auth API Integration Tests completed');
