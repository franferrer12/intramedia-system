import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * K6 Smoke Test
 * Quick validation that system handles minimal load
 */

export const options = {
  vus: 5,                    // 5 virtual users
  duration: '1m',            // Run for 1 minute
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.01'],     // Less than 1% errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export default function () {
  // Test root endpoint
  const rootRes = http.get(BASE_URL);
  check(rootRes, {
    'root status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test login
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

  const success = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        return JSON.parse(r.body).token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (success && loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).token;

    // Test authenticated endpoint
    const meRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    check(meRes, {
      'me status 200': (r) => r.status === 200,
    });
  }

  sleep(2);
}
