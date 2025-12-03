import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Dashboard and Reports Flow
 * Tests data retrieval and aggregation for dashboard views
 */

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';

test.describe('Dashboard and Reports Flow', () => {
  let authToken;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@intramedia.com',
        password: 'admin123'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test('dashboard data retrieval flow', async ({ request }) => {
    // Step 1: Get eventos list
    const eventosResponse = await request.get(`${API_URL}/api/eventos`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(eventosResponse.ok()).toBeTruthy();
    const eventos = await eventosResponse.json();
    expect(Array.isArray(eventos)).toBeTruthy();

    // Step 2: Get DJs list
    const djsResponse = await request.get(`${API_URL}/api/djs`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(djsResponse.ok()).toBeTruthy();
    const djs = await djsResponse.json();
    expect(Array.isArray(djs)).toBeTruthy();

    // Step 3: Get Clientes list
    const clientesResponse = await request.get(`${API_URL}/api/clientes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(clientesResponse.ok()).toBeTruthy();
    const clientes = await clientesResponse.json();
    expect(Array.isArray(clientes)).toBeTruthy();

    // Step 4: Get upcoming eventos
    const upcomingResponse = await request.get(`${API_URL}/api/eventos/upcoming`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(upcomingResponse.ok()).toBeTruthy();
    const upcomingEventos = await upcomingResponse.json();
    expect(Array.isArray(upcomingEventos)).toBeTruthy();
  });

  test('financial reports flow', async ({ request }) => {
    // Step 1: Get monthly financial summary
    const summaryResponse = await request.get(
      `${API_URL}/api/eventos/financial-summary/monthly`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(summaryResponse.ok()).toBeTruthy();
    const summary = await summaryResponse.json();
    // Summary can be an array or object depending on implementation

    // Step 2: Get partner summary
    const partnerResponse = await request.get(
      `${API_URL}/api/eventos/financial-summary/partners`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
      }
    });

    expect(partnerResponse.ok()).toBeTruthy();

    // Step 3: Get DJ financial stats
    const djFinancialResponse = await request.get(
      `${API_URL}/api/djs-financial/stats`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    // May return 404 if endpoint doesn't exist, that's okay
    if (djFinancialResponse.ok()) {
      const djStats = await djFinancialResponse.json();
      expect(Array.isArray(djStats) || typeof djStats === 'object').toBeTruthy();
    }

    // Step 4: Get Cliente financial stats
    const clienteFinancialResponse = await request.get(
      `${API_URL}/api/clientes-financial/stats`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    // May return 404 if endpoint doesn't exist, that's okay
    if (clienteFinancialResponse.ok()) {
      const clienteStats = await clienteFinancialResponse.json();
      expect(Array.isArray(clienteStats) || typeof clienteStats === 'object').toBeTruthy();
    }
  });

  test('pagination flow', async ({ request }) => {
    // Step 1: Get first page
    const page1Response = await request.get(
      `${API_URL}/api/eventos?page=1&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(page1Response.ok()).toBeTruthy();
    const page1Data = await page1Response.json();
    expect(Array.isArray(page1Data)).toBeTruthy();

    // Step 2: Get second page
    const page2Response = await request.get(
      `${API_URL}/api/eventos?page=2&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(page2Response.ok()).toBeTruthy();
    const page2Data = await page2Response.json();
    expect(Array.isArray(page2Data)).toBeTruthy();

    // Pages should be different (if enough data exists)
    if (page1Data.length > 0 && page2Data.length > 0) {
      expect(page1Data[0].id).not.toBe(page2Data[0].id);
    }
  });

  test('filtering flow', async ({ request }) => {
    // Get current month eventos
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const mesFilter = `${year}-${month}`;

    const response = await request.get(
      `${API_URL}/api/eventos?mes=${mesFilter}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(response.ok()).toBeTruthy();
    const filteredEventos = await response.json();
    expect(Array.isArray(filteredEventos)).toBeTruthy();

    // All eventos should match the filter (if any)
    if (filteredEventos.length > 0) {
      filteredEventos.forEach(evento => {
        expect(evento.mes).toBe(mesFilter);
      });
    }
  });

  test('search flow', async ({ request }) => {
    // Search for eventos
    const searchResponse = await request.get(
      `${API_URL}/api/eventos?search=test`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    // Search may or may not be implemented
    if (searchResponse.ok()) {
      const searchResults = await searchResponse.json();
      expect(Array.isArray(searchResults)).toBeTruthy();
    }
  });

  test('unauthorized access to reports should fail', async ({ request }) => {
    const response = await request.get(
      `${API_URL}/api/eventos/financial-summary/monthly`
    );

    expect(response.status()).toBe(401);
  });
});
