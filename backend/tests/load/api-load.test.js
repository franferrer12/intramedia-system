import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * K6 Load Test - API Endpoints
 * Tests complete API performance under realistic load
 */

// Custom metrics
const errorRate = new Rate('errors');
const readLatency = new Trend('read_latency');
const writeLatency = new Trend('write_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },    // Warm-up: 20 users
    { duration: '2m', target: 50 },    // Ramp-up: 50 users
    { duration: '3m', target: 100 },   // Peak: 100 users
    { duration: '2m', target: 100 },   // Sustained: 100 users
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    http_req_failed: ['rate<0.05'],                  // Error rate < 5%
    errors: ['rate<0.05'],
    read_latency: ['p(95)<500'],                      // Read operations < 500ms
    write_latency: ['p(95)<1000'],                    // Write operations < 1s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';
let authToken;

// Setup: Get auth token
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    console.log('✓ Authentication successful');
    return { token: body.token };
  } else {
    console.error('✗ Authentication failed');
    return { token: null };
  }
}

export default function (data) {
  if (!data.token) {
    console.error('No auth token available');
    return;
  }

  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Group 1: Read Operations (80% of traffic)
  group('Read Operations', function () {
    // Get eventos list
    const eventosStart = Date.now();
    const eventosRes = http.get(`${BASE_URL}/api/eventos`, { headers });
    readLatency.add(Date.now() - eventosStart);

    check(eventosRes, {
      'get eventos status 200': (r) => r.status === 200,
      'get eventos has array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);

    sleep(0.5);

    // Get DJs list
    const djsStart = Date.now();
    const djsRes = http.get(`${BASE_URL}/api/djs`, { headers });
    readLatency.add(Date.now() - djsStart);

    check(djsRes, {
      'get djs status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // Get clientes list
    const clientesStart = Date.now();
    const clientesRes = http.get(`${BASE_URL}/api/clientes`, { headers });
    readLatency.add(Date.now() - clientesStart);

    check(clientesRes, {
      'get clientes status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // Get upcoming eventos
    const upcomingRes = http.get(`${BASE_URL}/api/eventos/upcoming`, {
      headers,
    });

    check(upcomingRes, {
      'get upcoming status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  // Group 2: Write Operations (20% of traffic)
  // Only 1 in 5 VUs performs write operations
  if (__VU % 5 === 0) {
    group('Write Operations', function () {
      const timestamp = Date.now();

      // Create a test cliente
      const clienteStart = Date.now();
      const createClienteRes = http.post(
        `${BASE_URL}/api/clientes`,
        JSON.stringify({
          nombre: `Load Test Cliente ${timestamp}`,
          email: `loadtest${timestamp}@test.com`,
          telefono: '+521234567890',
        }),
        { headers }
      );
      writeLatency.add(Date.now() - clienteStart);

      const createSuccess = check(createClienteRes, {
        'create cliente status 201': (r) => r.status === 201,
        'create cliente has id': (r) => {
          try {
            return JSON.parse(r.body).id !== undefined;
          } catch {
            return false;
          }
        },
      });

      errorRate.add(!createSuccess);

      if (createSuccess && createClienteRes.status === 201) {
        const clienteId = JSON.parse(createClienteRes.body).id;

        sleep(1);

        // Update the cliente
        const updateStart = Date.now();
        const updateRes = http.put(
          `${BASE_URL}/api/clientes/${clienteId}`,
          JSON.stringify({
            ciudad: 'Test City',
          }),
          { headers }
        );
        writeLatency.add(Date.now() - updateStart);

        check(updateRes, {
          'update cliente status 200': (r) => r.status === 200,
        }) || errorRate.add(1);

        sleep(1);

        // Delete the cliente (cleanup)
        const deleteRes = http.del(`${BASE_URL}/api/clientes/${clienteId}`, {
          headers,
        });

        check(deleteRes, {
          'delete cliente status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
      }
    });
  }

  // Think time: simulate user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log('Load test completed');
  console.log('Check the summary for detailed metrics');
}
