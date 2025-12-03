import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * K6 Load Test - Authentication Endpoints
 * Tests auth performance under load
 */

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up to 20 users
    { duration: '1m', target: 50 },    // Ramp-up to 50 users
    { duration: '2m', target: 100 },   // Ramp-up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.05'],             // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export default function () {
  // Login request
  const loginPayload = JSON.stringify({
    username: 'admin',
    password: 'admin123',
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    loginParams
  );

  // Check login response
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined;
      } catch {
        return false;
      }
    },
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess && loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).token;

    // Get current user
    const meRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const meSuccess = check(meRes, {
      'me status is 200': (r) => r.status === 200,
      'me has user data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.username !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!meSuccess);
  }

  // Think time: simulate user pause between requests
  sleep(1);
}

// Setup function (runs once per VU at start)
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log('Target: 100 concurrent users');
}

// Teardown function (runs once at end)
export function teardown(data) {
  console.log('Load test completed');
}
