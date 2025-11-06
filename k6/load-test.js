import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    spring_list: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      exec: 'springList',
    },
    spring_one: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      exec: 'springOne',
    },
    micro_list: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      exec: 'microList',
    },
    micro_one: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      exec: 'microOne',
    },
  },
};

const SPRING = __ENV.SPRING_BASE_URL || 'http://localhost:8081/users';
const MICRO = __ENV.MICRO_BASE_URL || 'http://localhost:8082/users';

export function springList() {
  const res = http.get(`${SPRING}/users`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.1);
}

export function springOne() {
  const res = http.get(`${SPRING}/users/1`);
  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(0.1);
}

export function microList() {
  const res = http.get(`${MICRO}/users`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.1);
}

export function microOne() {
  const res = http.get(`${MICRO}/users/1`);
  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(0.1);
}
