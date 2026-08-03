import http from 'k6/http';
import { check } from 'k6';

// requires docker, run this command in the same directory as this file: docker run --rm -i grafana/k6 run - < load-test.js
export const options = {
  // 50 concurrent virtual users
  vus: 50,
  // Run the load for 30 seconds
  duration: '30s',
  // Threshold: average response time must stay under 500ms
  thresholds: {
    http_req_duration: ['avg<500'],
  },
};

export default function () {
  // Randomly alternate between /clubs and /events
  const endpoint = Math.random() < 0.5 ? '/clubs' : '/events/this-week';
  const url = `https://api.campusconnectyorku.com${endpoint}`;

  const res = http.get(url);

  // Validate HTTP 200 response
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}