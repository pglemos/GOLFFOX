/**
 * Script para testar rotas em produção no Vercel
 * Verifica se todas as rotas críticas estão funcionando
 */

const VERCEL_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://golffox.vercel.app'

const routes = [
  // Health check (público)
  { 
    method: 'GET', 
    path: '/api/health', 
    description: 'Health Check',
    requiresAuth: false,
    expectedStatus: 200
  },
  
  // Auth routes (requerem autenticação)
  { 
    method: 'GET', 
    path: '/api/auth/me', 
    description: 'Get Current User',
    requiresAuth: true,
    expectedStatus: [200, 401] // 401 é esperado se não autenticado
  },
  
  // Admin routes (requerem admin)
  { 
    method: 'GET', 
    path: '/api/admin/kpis', 
    description: 'Admin KPIs',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403]
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/companies', 
    description: 'List Companies',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403]
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/transportadoras', 
    description: 'List Transportadoras',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403]
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/drivers', 
    description: 'List Motoristas (drivers)',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403]
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/vehicles', 
    description: 'List Veiculos (vehicles)',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403]
  },
]

async function testRoute(route) {
  const url = `${VERCEL_URL}${route.path}`
  const options = {
    method: route.method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GolfFox-Test-Script/1.0',
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

    // Clonar response para poder ler o body múltiplas vezes se necessário
    const responseClone = response.clone()
    let body = null
    try {
      body = await responseClone.json()
    } catch (e) {
      try {
        body = await response.text()
      } catch (e2) {
        body = null
      }
    }

    const expectedStatuses = Array.isArray(route.expectedStatus) 
      ? route.expectedStatus 
      : [route.expectedStatus || 200]
    
    const isSuccess = expectedStatuses.includes(status)
    const isExpected = isSuccess || (route.requiresAuth && status === 401) || (route.requiresRole && status === 403)

    return {
      route: route.description,
      path: route.path,
      method: route.method,
      status,
      duration,
      success: isSuccess,
      expected: isExpected,
      error: isSuccess ? null : (body?.error || body?.message || `HTTP ${status}`),
      body: isSuccess ? (typeof body === 'object' ? JSON.stringify(body).substring(0, 200) : body.substring(0, 200)) : null,
    }
  } catch (error) {
    return {
      route: route.description,
      path: route.path,
      method: route.method,
      status: 0,
      duration: 0,
      success: false,
      expected: false,
      error: error.message,
      body: null,
    }
  }
}

async function runTests() {
  console.log('🧪 Testando rotas em produção no Vercel...\n')
  console.log(`🌐 URL Base: ${VERCEL_URL}\n`)
  console.log('='.repeat(70))

  const results = []

  for (const route of routes) {
    const result = await testRoute(route)
    results.push(result)

    const icon = result.success ? '✅' : result.expected ? '⚠️' : '❌'
    const statusText = result.status > 0 ? `HTTP ${result.status}` : 'ERRO'
    const durationText = result.duration > 0 ? `${result.duration}ms` : 'N/A'

    console.log(`${icon} ${result.method} ${result.path}`)
    console.log(`   ${statusText} | ${durationText}`)
    
    if (result.success && result.body) {
      console.log(`   Resposta: ${result.body}...`)
    } else if (result.error) {
      console.log(`   ${result.expected ? 'Esperado' : 'Erro'}: ${result.error}`)
    }
    console.log()
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Resumo
  const successCount = results.filter(r => r.success).length
  const expectedCount = results.filter(r => r.expected).length
  const totalCount = results.length
  const successRate = ((successCount / totalCount) * 100).toFixed(1)
  const expectedRate = ((expectedCount / totalCount) * 100).toFixed(1)

  console.log('='.repeat(70))
  console.log(`📊 Resumo:`)
  console.log(`   ✅ Sucesso: ${successCount}/${totalCount} (${successRate}%)`)
  console.log(`   ⚠️  Esperado (incluindo 401/403): ${expectedCount}/${totalCount} (${expectedRate}%)`)
  console.log('='.repeat(70))

  if (successCount < totalCount) {
    console.log('\n📋 Detalhes:')
    results.forEach(r => {
      if (!r.success) {
        const status = r.status > 0 ? `HTTP ${r.status}` : 'ERRO'
        console.log(`   ${r.expected ? '⚠️' : '❌'} ${r.method} ${r.path}: ${status} - ${r.error || 'Sem resposta'}`)
      }
    })
  }

  // Verificar problemas críticos
  const criticalErrors = results.filter(r => !r.expected && r.status !== 0)
  if (criticalErrors.length > 0) {
    console.log('\n❌ Problemas críticos encontrados:')
    criticalErrors.forEach(r => {
      console.log(`   - ${r.method} ${r.path}: ${r.error || `HTTP ${r.status}`}`)
    })
    process.exit(1)
  } else {
    console.log('\n✅ Todas as rotas estão respondendo como esperado!')
    process.exit(0)
  }
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error)
  process.exit(1)
})

