/**
 * k6 Spike Tests
 * 
 * Testes de pico (spike) para simular tráfego súbito
 * 
 * Executar:
 * k6 run k6/spike-tests.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

// Configuração de spike test
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Normal: 10 usuários
    { duration: '1s', target: 100 },  // SPIKE: 10 a 100 usuários em 1s
    { duration: '30s', target: 100 }, // Mantém: 100 usuários por 30s
    { duration: '1s', target: 10 },   // Volta: 100 a 10 usuários em 1s
    { duration: '10s', target: 10 },  // Normal: 10 usuários
  ],
  thresholds: {
    http_req_failed: ['rate<0.3'], // Taxa de erro < 30% (tolerante para spike)
    errors: ['rate<0.3'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Teste de spike: Health Check
  const healthCheck = http.get(`${BASE_URL}/api/health`)
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
  })
  errorRate.add(healthCheck.status !== 200)
  sleep(0.1) // Sleep mínimo para maximizar carga
}

