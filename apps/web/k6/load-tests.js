/**
 * k6 Load Tests
 * 
 * Testes de carga para APIs críticas do GolfFox
 * 
 * Executar:
 * k6 run k6/load-tests.js
 * 
 * Com opções:
 * k6 run --vus 10 --duration 30s k6/load-tests.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Métricas customizadas
const errorRate = new Rate('errors')
const apiResponseTime = new Trend('api_response_time')

// Configuração
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up: 0 a 10 usuários em 30s
    { duration: '1m', target: 10 },  // Estável: 10 usuários por 1min
    { duration: '30s', target: 20 },  // Ramp up: 10 a 20 usuários em 30s
    { duration: '1m', target: 20 },  // Estável: 20 usuários por 1min
    { duration: '30s', target: 0 },   // Ramp down: 20 a 0 usuários em 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem ser < 2s
    http_req_failed: ['rate<0.1'],     // Taxa de erro < 10%
    errors: ['rate<0.1'],              // Taxa de erro customizada < 10%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || ''

// Função para criar requisição autenticada
function createAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'x-user-role': 'admin',
  }
}

export default function () {
  // Teste 1: Health Check
  const healthCheck = http.get(`${BASE_URL}/api/health`)
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  })
  errorRate.add(healthCheck.status !== 200)
  apiResponseTime.add(healthCheck.timings.duration)
  sleep(1)

  // Teste 2: Listar Usuários (GET /api/admin/users-list)
  if (ADMIN_TOKEN) {
    const usersList = http.get(`${BASE_URL}/api/admin/users-list`, {
      headers: createAuthHeaders(),
    })
    check(usersList, {
      'users list status is 200': (r) => r.status === 200,
      'users list has data': (r) => {
        try {
          const json = JSON.parse(r.body)
          return json.success === true && Array.isArray(json.users)
        } catch {
          return false
        }
      },
      'users list response time < 2000ms': (r) => r.timings.duration < 2000,
    })
    errorRate.add(usersList.status !== 200)
    apiResponseTime.add(usersList.timings.duration)
    sleep(1)
  }

  // Teste 3: KPIs (GET /api/admin/kpis)
  if (ADMIN_TOKEN) {
    const kpis = http.get(`${BASE_URL}/api/admin/kpis`, {
      headers: createAuthHeaders(),
    })
    check(kpis, {
      'kpis status is 200': (r) => r.status === 200,
      'kpis has data': (r) => {
        try {
          const json = JSON.parse(r.body)
          return json.success === true
        } catch {
          return false
        }
      },
      'kpis response time < 3000ms': (r) => r.timings.duration < 3000,
    })
    errorRate.add(kpis.status !== 200)
    apiResponseTime.add(kpis.timings.duration)
    sleep(1)
  }

  // Teste 4: Listar Empresas (GET /api/admin/companies)
  if (ADMIN_TOKEN) {
    const companies = http.get(`${BASE_URL}/api/admin/companies`, {
      headers: createAuthHeaders(),
    })
    check(companies, {
      'companies status is 200': (r) => r.status === 200,
      'companies response time < 2000ms': (r) => r.timings.duration < 2000,
    })
    errorRate.add(companies.status !== 200)
    apiResponseTime.add(companies.timings.duration)
    sleep(1)
  }
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'k6/results.json': JSON.stringify(data),
  }
}

