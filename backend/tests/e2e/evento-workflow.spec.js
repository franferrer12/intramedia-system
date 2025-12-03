import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Complete Evento Workflow
 * Tests the full lifecycle of creating and managing an evento
 */

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';

test.describe('Evento Complete Workflow', () => {
  let authToken;
  let djId;
  let clienteId;
  let eventoId;
  const timestamp = Date.now();

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test('complete evento lifecycle', async ({ request }) => {
    // Step 1: Create a DJ
    const djResponse = await request.post(`${API_URL}/api/djs`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        nombre: `DJ E2E ${timestamp}`,
        email: `dje2e${timestamp}@test.com`,
        telefono: '+521234567890',
        genero_musical: 'Electronic'
      }
    });

    expect(djResponse.status()).toBe(201);
    const djData = await djResponse.json();
    djId = djData.id;
    expect(djId).toBeTruthy();

    // Step 2: Create a Cliente
    const clienteResponse = await request.post(`${API_URL}/api/clientes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        nombre: `Cliente E2E ${timestamp}`,
        email: `clientee2e${timestamp}@test.com`,
        telefono: '+529876543210'
      }
    });

    expect(clienteResponse.status()).toBe(201);
    const clienteData = await clienteResponse.json();
    clienteId = clienteData.id;
    expect(clienteId).toBeTruthy();

    // Step 3: Create an Evento
    const eventoResponse = await request.post(`${API_URL}/api/eventos`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        evento: `Evento E2E ${timestamp}`,
        fecha: '2025-12-31',
        mes: '2025-12',
        dj_id: djId,
        cliente_id: clienteId,
        horas: 4,
        cache_total: 10000,
        parte_dj: 6000,
        parte_agencia: 4000,
        ciudad_lugar: 'Test City'
      }
    });

    expect(eventoResponse.status()).toBe(201);
    const eventoData = await eventoResponse.json();
    eventoId = eventoData.id;
    expect(eventoId).toBeTruthy();
    expect(eventoData.evento).toBe(`Evento E2E ${timestamp}`);

    // Step 4: Retrieve the Evento
    const getEventoResponse = await request.get(`${API_URL}/api/eventos/${eventoId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getEventoResponse.ok()).toBeTruthy();
    const retrievedEvento = await getEventoResponse.json();
    expect(retrievedEvento.id).toBe(eventoId);
    expect(retrievedEvento.dj_id).toBe(djId);
    expect(retrievedEvento.cliente_id).toBe(clienteId);

    // Step 5: Update the Evento
    const updateResponse = await request.put(`${API_URL}/api/eventos/${eventoId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        cache_total: 12000,
        parte_dj: 7000,
        parte_agencia: 5000
      }
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updatedEvento = await updateResponse.json();
    expect(parseFloat(updatedEvento.cache_total)).toBe(12000);

    // Step 6: Get DJ's eventos
    const djEventosResponse = await request.get(`${API_URL}/api/djs/${djId}/eventos`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(djEventosResponse.ok()).toBeTruthy();
    const djEventos = await djEventosResponse.json();
    expect(Array.isArray(djEventos)).toBeTruthy();
    expect(djEventos.some(e => e.id === eventoId)).toBeTruthy();

    // Step 7: Get Cliente's eventos (if endpoint exists)
    // This step is optional depending on API availability

    // Step 8: Delete the Evento (soft delete)
    const deleteResponse = await request.delete(`${API_URL}/api/eventos/${eventoId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(deleteResponse.ok()).toBeTruthy();

    // Step 9: Verify evento is deleted
    const getDeletedResponse = await request.get(`${API_URL}/api/eventos/${eventoId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getDeletedResponse.status()).toBe(404);

    // Cleanup: Delete DJ and Cliente
    await request.delete(`${API_URL}/api/djs/${djId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    await request.delete(`${API_URL}/api/clientes/${clienteId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  });

  test('evento creation without required fields should fail', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/eventos`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        evento: 'Test Event'
        // Missing required fields
      }
    });

    expect(response.status()).toBe(400);
  });

  test('evento update without authentication should fail', async ({ request }) => {
    const response = await request.put(`${API_URL}/api/eventos/1`, {
      data: {
        cache_total: 5000
      }
    });

    expect(response.status()).toBe(401);
  });
});
