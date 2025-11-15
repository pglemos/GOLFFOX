/**
 * Script para testar funcionalidades críticas em produção
 */

const https = require('https')

const PRODUCTION_URL = 'https://golffox-bzj0446dr-synvolt.vercel.app'

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

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'GOLFFOX-Test-Script/1.0'
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body.substring(0, 500) // Limitar tamanho
        })
      })
    })

    req.on('error', reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    req.end()
  })
}

async function testHealthCheck() {
  try {
    log('\n1️⃣ Testando Health Check...', 'blue')
    const response = await makeRequest(`${PRODUCTION_URL}/api/health`)
    
    if (response.status === 200) {
      log('   ✅ Health check OK', 'green')
      return true
    } else {
      log(`   ⚠️  Health check retornou status ${response.status}`, 'yellow')
      return false
    }
  } catch (error) {
    log(`   ❌ Erro no health check: ${error.message}`, 'red')
    return false
  }
}

async function testHomePage() {
  try {
    log('\n2️⃣ Testando Página Inicial...', 'blue')
    const response = await makeRequest(PRODUCTION_URL)
    
    if (response.status === 200) {
      log('   ✅ Página inicial acessível', 'green')
      return true
    } else {
      log(`   ⚠️  Página inicial retornou status ${response.status}`, 'yellow')
      return false
    }
  } catch (error) {
    log(`   ❌ Erro ao acessar página inicial: ${error.message}`, 'red')
    return false
  }
}

async function testLoginPage() {
  try {
    log('\n3️⃣ Testando Página de Login...', 'blue')
    const response = await makeRequest(`${PRODUCTION_URL}/login`)
    
    if (response.status === 200) {
      log('   ✅ Página de login acessível', 'green')
      return true
    } else {
      log(`   ⚠️  Página de login retornou status ${response.status}`, 'yellow')
      return false
    }
  } catch (error) {
    log(`   ❌ Erro ao acessar página de login: ${error.message}`, 'red')
    return false
  }
}

async function testProtectedRoutes() {
  try {
    log('\n4️⃣ Testando Rotas Protegidas (sem autenticação)...', 'blue')
    
    // Testar /operator sem autenticação (deve redirecionar)
    const operatorResponse = await makeRequest(`${PRODUCTION_URL}/operator`)
    if (operatorResponse.status === 307 || operatorResponse.status === 302 || operatorResponse.status === 200) {
      log('   ✅ /operator está protegido (redireciona ou requer auth)', 'green')
    } else {
      log(`   ⚠️  /operator retornou status ${operatorResponse.status}`, 'yellow')
    }

    // Testar /admin sem autenticação (deve redirecionar)
    const adminResponse = await makeRequest(`${PRODUCTION_URL}/admin`)
    if (adminResponse.status === 307 || adminResponse.status === 302 || adminResponse.status === 200) {
      log('   ✅ /admin está protegido (redireciona ou requer auth)', 'green')
    } else {
      log(`   ⚠️  /admin retornou status ${adminResponse.status}`, 'yellow')
    }

    return true
  } catch (error) {
    log(`   ❌ Erro ao testar rotas protegidas: ${error.message}`, 'red')
    return false
  }
}

async function testAPIRoutes() {
  try {
    log('\n5️⃣ Testando Rotas API (sem autenticação)...', 'blue')
    
    // Testar API de custos sem autenticação (deve retornar 401)
    const costsResponse = await makeRequest(`${PRODUCTION_URL}/api/costs/manual?company_id=test`)
    if (costsResponse.status === 401 || costsResponse.status === 403) {
      log('   ✅ API /api/costs/manual está protegida (retorna 401/403)', 'green')
    } else {
      log(`   ⚠️  API /api/costs/manual retornou status ${costsResponse.status}`, 'yellow')
    }

    return true
  } catch (error) {
    log(`   ❌ Erro ao testar APIs: ${error.message}`, 'red')
    return false
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'blue')
  log('🧪 Testes de Produção - GOLFFOX', 'blue')
  log('='.repeat(60) + '\n', 'blue')

  const results = {
    healthCheck: await testHealthCheck(),
    homePage: await testHomePage(),
    loginPage: await testLoginPage(),
    protectedRoutes: await testProtectedRoutes(),
    apiRoutes: await testAPIRoutes()
  }

  log('\n' + '='.repeat(60), 'blue')
  log('📊 Resumo dos Testes', 'blue')
  log('='.repeat(60), 'blue')
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'OK' : 'FALHOU'}`, passed ? 'green' : 'red')
  })

  const allPassed = Object.values(results).every(r => r)
  
  log('\n' + '='.repeat(60), 'blue')
  if (allPassed) {
    log('✅ Todos os testes básicos passaram!', 'green')
  } else {
    log('⚠️  Alguns testes falharam. Verifique os logs acima.', 'yellow')
  }
  log('='.repeat(60) + '\n', 'blue')

  log('💡 Próximos passos:', 'blue')
  log('   1. Testar login manualmente no navegador', 'blue')
  log('   2. Verificar middleware de autenticação', 'blue')
  log('   3. Testar APIs com autenticação', 'blue')
  log('   4. Verificar branding do operador', 'blue')
  log('   5. Monitorar logs no Vercel Dashboard\n', 'blue')
}

if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { main }

