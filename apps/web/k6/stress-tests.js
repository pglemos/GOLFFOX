/**
 * k6 Stress Tests
 * 
 * Testes de stress para identificar limites do sistema
 * 
 * Executar:
 * k6 run k6/stress-tests.js
 * 
 * Com opções:
 * k6 run --vus 50 --duration 2m k6/stress-tests.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Métricas customizadas
const errorRate = new Rate('errors')
const apiResponseTime = new Trend('api_response_time')

// Configuração de stress test
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up: 0 a 50 usuários em 1min
    { duration: '2m', target: 50 },  // Estável: 50 usuários por 2min
    { duration: '1m', target: 100 }, // Ramp up: 50 a 100 usuários em 1min
    { duration: '2m', target: 100 },  // Estável: 100 usuários por 2min
    { duration: '1m', target: 0 },    // Ramp down: 100 a 0 usuários em 1min
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% das requisições devem ser < 5s (mais tolerante)
    http_req_failed: ['rate<0.2'],     // Taxa de erro < 20% (mais tolerante em stress)
    errors: ['rate<0.2'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || ''

function createAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'x-user-role': 'admin',
  }
}

export default function () {
  // Teste de stress: Health Check (endpoint mais leve)
  const healthCheck = http.get(`${BASE_URL}/api/health`)
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
  })
  errorRate.add(healthCheck.status !== 200)
  apiResponseTime.add(healthCheck.timings.duration)
  sleep(0.5)

  // Teste de stress: KPIs (endpoint mais pesado)
  if (ADMIN_TOKEN) {
    const kpis = http.get(`${BASE_URL}/api/admin/kpis`, {
      headers: createAuthHeaders(),
    })
    check(kpis, {
      'kpis status is 200 or 503': (r) => r.status === 200 || r.status === 503, // 503 é aceitável em stress
    })
    errorRate.add(kpis.status >= 500 && kpis.status !== 503)
    apiResponseTime.add(kpis.timings.duration)
    sleep(0.5)
  }

  // Teste de stress: Listar Usuários
  if (ADMIN_TOKEN) {
    const usersList = http.get(`${BASE_URL}/api/admin/usuarios-list`, {
      headers: createAuthHeaders(),
    })
    check(usersList, {
      'users list status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    })
    errorRate.add(usersList.status >= 500 && usersList.status !== 503)
    apiResponseTime.add(usersList.timings.duration)
    sleep(0.5)
  }
}

