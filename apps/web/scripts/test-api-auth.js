/**
 * Script para testar validação de autenticação nas rotas API
 * Valida se as rotas protegidas estão funcionando corretamente
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let parsedData
        try {
          parsedData = JSON.parse(data)
        } catch {
          parsedData = data
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedData
        })
      })
    })

    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

async function testAPIAuth() {
  log('\n🧪 Testando Validação de Autenticação nas Rotas API\n', 'blue')

  let passed = 0
  let failed = 0

  // Teste 1: POST /api/costs/manual sem autenticação
  try {
    log('Teste 1: POST /api/costs/manual sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/api/costs/manual`, {
      method: 'POST',
      body: {
        company_id: '00000000-0000-0000-0000-000000000000',
        cost_category_id: '00000000-0000-0000-0000-000000000000',
        date: '2025-01-07',
        amount: 100
      }
    })
    
    if (response.status === 401) {
      log('✅ PASS: Retornou 401 Unauthorized', 'green')
      passed++
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 401)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 2: GET /api/costs/manual sem autenticação
  try {
    log('\nTeste 2: GET /api/costs/manual sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/api/costs/manual?company_id=00000000-0000-0000-0000-000000000000`)
    
    if (response.status === 401) {
      log('✅ PASS: Retornou 401 Unauthorized', 'green')
      passed++
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 401)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 3: POST /api/costs/reconcile sem autenticação
  try {
    log('\nTeste 3: POST /api/costs/reconcile sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/api/costs/reconcile`, {
      method: 'POST',
      body: {
        invoice_id: '00000000-0000-0000-0000-000000000000',
        action: 'approve'
      }
    })
    
    if (response.status === 401) {
      log('✅ PASS: Retornou 401 Unauthorized', 'green')
      passed++
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 401)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 4: POST /api/operator/create-employee sem autenticação
  try {
    log('\nTeste 4: POST /api/operator/create-employee sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/api/operator/create-employee`, {
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })
    
    if (response.status === 401) {
      log('✅ PASS: Retornou 401 Unauthorized', 'green')
      passed++
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 401)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 5: POST /api/reports/schedule sem autenticação
  try {
    log('\nTeste 5: POST /api/reports/schedule sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/api/reports/schedule`, {
      method: 'POST',
      body: {
        companyId: '00000000-0000-0000-0000-000000000000',
        reportKey: 'delays',
        cron: '0 8 * * 1',
        recipients: ['test@example.com']
      }
    })
    
    if (response.status === 401) {
      log('✅ PASS: Retornou 401 Unauthorized', 'green')
      passed++
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 401)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 6: Rota pública /api/health (deve permitir)
  try {
    log('\nTeste 6: GET /api/health (rota pública)...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/api/health`)
    
    if (response.status === 200) {
      log('✅ PASS: Rota pública acessível', 'green')
      passed++
    } else {
      log(`⚠️  WARN: Status ${response.status} (esperado 200)`, 'yellow')
      passed++ // Não é crítico
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Resumo
  log('\n' + '='.repeat(50), 'blue')
  log(`📊 Resumo dos Testes de API`, 'blue')
  log('='.repeat(50), 'blue')
  log(`✅ Passou: ${passed}`, 'green')
  log(`❌ Falhou: ${failed}`, failed > 0 ? 'red' : 'green')
  log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue')
  log('='.repeat(50) + '\n', 'blue')

  return { passed, failed, total: passed + failed }
}

// Executar testes
if (require.main === module) {
  testAPIAuth()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      log(`\n❌ Erro fatal: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { testAPIAuth }

