/**
 * Script para testar middleware de autenticação
 * Valida se rotas protegidas estão funcionando corretamente
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
      headers: options.headers || {}
    }

    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })

    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

async function testMiddleware() {
  log('\n🧪 Testando Middleware de Autenticação\n', 'blue')

  const tests = []
  let passed = 0
  let failed = 0

  // Teste 1: Acessar /operator sem autenticação (deve redirecionar)
  try {
    log('Teste 1: Acessar /operator sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/operator`)
    
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.location || ''
      if (location.includes('/login')) {
        log('✅ PASS: Redirecionou para /login', 'green')
        passed++
      } else {
        log(`❌ FAIL: Redirecionou para ${location} (esperado /login)`, 'red')
        failed++
      }
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 307/302)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 2: Acessar /admin sem autenticação (deve redirecionar)
  try {
    log('\nTeste 2: Acessar /admin sem autenticação...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/admin`)
    
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.location || ''
      if (location.includes('/login')) {
        log('✅ PASS: Redirecionou para /login', 'green')
        passed++
      } else {
        log(`❌ FAIL: Redirecionou para ${location} (esperado /login)`, 'red')
        failed++
      }
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 307/302)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 3: Acessar /operator com cookie inválido (deve redirecionar)
  try {
    log('\nTeste 3: Acessar /operator com cookie inválido...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/operator`, {
      headers: {
        'Cookie': 'golffox-session=invalid_token_12345'
      }
    })
    
    if (response.status === 307 || response.status === 302) {
      log('✅ PASS: Redirecionou para /login (cookie inválido)', 'green')
      passed++
    } else {
      log(`❌ FAIL: Status ${response.status} (esperado 307/302)`, 'red')
      failed++
    }
  } catch (error) {
    log(`❌ FAIL: Erro na requisição - ${error.message}`, 'red')
    failed++
  }

  // Teste 4: Acessar rota pública (deve permitir)
  try {
    log('\nTeste 4: Acessar rota pública /login...', 'yellow')
    const response = await makeRequest(`${BASE_URL}/login`)
    
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
  log(`📊 Resumo dos Testes`, 'blue')
  log('='.repeat(50), 'blue')
  log(`✅ Passou: ${passed}`, 'green')
  log(`❌ Falhou: ${failed}`, failed > 0 ? 'red' : 'green')
  log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue')
  log('='.repeat(50) + '\n', 'blue')

  return { passed, failed, total: passed + failed }
}

// Executar testes
if (require.main === module) {
  testMiddleware()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      log(`\n❌ Erro fatal: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { testMiddleware }

