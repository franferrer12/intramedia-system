import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests complete user authentication journey
 */

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';

test.describe('Authentication Flow', () => {
  test('complete login flow', async ({ request }) => {
    // Step 1: Login
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@intramedia.com',
        password: 'admin123'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeTruthy();
    expect(loginData.user).toBeTruthy();
    expect(loginData.user.username).toBe('admin');

    const token = loginData.token;

    // Step 2: Access protected resource with token
    const meResponse = await request.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(meResponse.ok()).toBeTruthy();
    const userData = await meResponse.json();
    expect(userData.username).toBe('admin');
    expect(userData.id).toBeTruthy();

    // Step 3: Logout
    const logoutResponse = await request.post(`${API_URL}/api/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(logoutResponse.ok()).toBeTruthy();
  });

  test('login with invalid credentials should fail', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@intramedia.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error || data.message).toBeTruthy();
  });

  test('accessing protected route without token should fail', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/auth/me`);

    expect(response.status()).toBe(401);
  });

  test('accessing protected route with invalid token should fail', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });

    expect(response.status()).toBe(401);
  });
});
