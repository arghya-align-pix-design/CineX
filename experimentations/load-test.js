import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp-up to 20 virtual users
    { duration: '30s', target: 50 }, // Sustained load of 50 concurrent users
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],   // Error rate below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';

export default function () {
  // 1. Health check request
  const healthRes = http.get(`${BASE_URL}/actuator/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // 2. Fetch movies catalog request
  const moviesRes = http.get(`${BASE_URL}/consumer/movies`);
  check(moviesRes, {
    'movies list status is 200': (r) => r.status === 200,
  });

  // 3. Prometheus metrics endpoint check
  const metricsRes = http.get(`${BASE_URL}/actuator/prometheus`);
  check(metricsRes, {
    'prometheus endpoint active': (r) => r.status === 200,
  });

  sleep(1);
}
