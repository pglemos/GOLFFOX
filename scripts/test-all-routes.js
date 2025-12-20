/**
 * Script para testar todas as rotas críticas da API
 * Verifica se as rotas estão funcionando corretamente após as mudanças
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const routes = [
  // Health check
  { method: 'GET', path: '/api/health', description: 'Health Check' },
  
  // Auth routes
  { method: 'GET', path: '/api/auth/me', description: 'Get Current User', requiresAuth: true },
  
  // Admin routes (requerem autenticação admin)
  { method: 'GET', path: '/api/admin/kpis', description: 'Admin KPIs', requiresAuth: true, requiresRole: 'admin' },
  { method: 'GET', path: '/api/admin/companies', description: 'List Companies', requiresAuth: true, requiresRole: 'admin' },
  { method: 'GET', path: '/api/admin/transportadoras', description: 'List Transportadoras', requiresAuth: true, requiresRole: 'admin' },
  { method: 'GET', path: '/api/admin/motoristas', description: 'List Motoristas', requiresAuth: true, requiresRole: 'admin' },
  { method: 'GET', path: '/api/admin/veiculos', description: 'List Veiculos', requiresAuth: true, requiresRole: 'admin' },
]

async function testRoute(route) {
  const url = `${BASE_URL}${route.path}`
  const options = {
    method: route.method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // Se requer autenticação, adicionar token (se disponível)
  if (route.requiresAuth) {
    const token = process.env.TEST_AUTH_TOKEN
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }
  }

  try {
    const startTime = Date.now()
    const response = await fetch(url, options)
    const duration = Date.now() - startTime
    const status = response.status

    let body = null
    try {
      body = await response.json()
    } catch (e) {
      body = await response.text()
    }

    const isSuccess = status >= 200 && status < 300

    return {
      route: route.description,
      path: route.path,
      method: route.method,
      status,
      duration,
      success: isSuccess,
      error: isSuccess ? null : (body?.error || body?.message || `HTTP ${status}`),
    }
  } catch (error) {
    return {
      route: route.description,
      path: route.path,
      method: route.method,
      status: 0,
      duration: 0,
      success: false,
      error: error.message,
    }
  }
}

async function runTests() {
  console.log('🧪 Testando rotas críticas da API...\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  const results = []

  for (const route of routes) {
    const result = await testRoute(route)
    results.push(result)

    const icon = result.success ? '✅' : '❌'
    const statusText = result.status > 0 ? `HTTP ${result.status}` : 'ERRO'
    const durationText = result.duration > 0 ? `${result.duration}ms` : 'N/A'

    console.log(`${icon} ${result.method} ${result.path}`)
    console.log(`   ${statusText} | ${durationText}`)
    if (result.error) {
      console.log(`   Erro: ${result.error}`)
    }
    console.log()
  }

  // Resumo
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  const successRate = ((successCount / totalCount) * 100).toFixed(1)

  console.log('='.repeat(60))
  console.log(`📊 Resumo: ${successCount}/${totalCount} rotas passaram (${successRate}%)`)
  console.log('='.repeat(60))

  if (successCount < totalCount) {
    console.log('\n❌ Algumas rotas falharam:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.method} ${r.path}: ${r.error || `HTTP ${r.status}`}`)
      })
    process.exit(1)
  } else {
    console.log('\n✅ Todas as rotas estão funcionando corretamente!')
    process.exit(0)
  }
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error)
  process.exit(1)
})

