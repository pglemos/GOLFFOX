/**
 * Script completo para testar TODAS as rotas críticas no Vercel
 * Verifica se todas as rotas estão funcionando corretamente
 */

const VERCEL_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://golffox.vercel.app'

const routes = [
  // Health check (público)
  { 
    method: 'GET', 
    path: '/api/health', 
    description: 'Health Check',
    requiresAuth: false,
    expectedStatus: 200,
    critical: true
  },
  
  // Auth routes
  { 
    method: 'GET', 
    path: '/api/auth/me', 
    description: 'Get Current User',
    requiresAuth: true,
    expectedStatus: [200, 401],
    critical: true
  },
  
  // Admin routes
  { 
    method: 'GET', 
    path: '/api/admin/kpis', 
    description: 'Admin KPIs',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403],
    critical: true
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/companies', 
    description: 'List Companies',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403],
    critical: true
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/transportadoras', 
    description: 'List Transportadoras',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403],
    critical: true
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/drivers', 
    description: 'List Motoristas (drivers)',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403],
    critical: true
  },
  
  { 
    method: 'GET', 
    path: '/api/admin/vehicles', 
    description: 'List Veiculos (vehicles)',
    requiresAuth: true,
    requiresRole: 'admin',
    expectedStatus: [200, 401, 403],
    critical: true
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

    // Ler body apenas uma vez
    let bodyText = null
    let bodyJson = null
    try {
      bodyText = await response.text()
      try {
        bodyJson = JSON.parse(bodyText)
      } catch {
        // Não é JSON, manter como texto
      }
    } catch (e) {
      bodyText = null
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
      critical: route.critical || false,
      error: isSuccess ? null : (bodyJson?.error || bodyJson?.message || `HTTP ${status}`),
      bodyPreview: bodyText ? bodyText.substring(0, 150) : null,
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
      critical: route.critical || false,
      error: error.message,
      bodyPreview: null,
    }
  }
}

async function runTests() {
  console.log('🧪 Testando TODAS as rotas críticas no Vercel...\n')
  console.log(`🌐 URL Base: ${VERCEL_URL}\n`)
  console.log('='.repeat(70))

  const results = []

  for (const route of routes) {
    const result = await testRoute(route)
    results.push(result)

    const icon = result.success ? '✅' : result.expected ? '⚠️' : '❌'
    const statusText = result.status > 0 ? `HTTP ${result.status}` : 'ERRO'
    const durationText = result.duration > 0 ? `${result.duration}ms` : 'N/A'
    const criticalMark = result.critical ? '🔴' : ''

    console.log(`${icon} ${criticalMark} ${result.method} ${result.path}`)
    console.log(`   ${statusText} | ${durationText}`)
    
    if (result.success && result.bodyPreview) {
      console.log(`   Resposta: ${result.bodyPreview}...`)
    } else if (result.error) {
      console.log(`   ${result.expected ? 'Esperado' : 'Erro'}: ${result.error}`)
    }
    console.log()
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  // Resumo
  const successCount = results.filter(r => r.success).length
  const expectedCount = results.filter(r => r.expected).length
  const criticalSuccessCount = results.filter(r => r.critical && r.success).length
  const criticalTotalCount = results.filter(r => r.critical).length
  const totalCount = results.length
  const successRate = ((successCount / totalCount) * 100).toFixed(1)
  const expectedRate = ((expectedCount / totalCount) * 100).toFixed(1)
  const criticalRate = criticalTotalCount > 0 
    ? ((criticalSuccessCount / criticalTotalCount) * 100).toFixed(1)
    : 'N/A'

  console.log('='.repeat(70))
  console.log(`📊 Resumo:`)
  console.log(`   ✅ Sucesso: ${successCount}/${totalCount} (${successRate}%)`)
  console.log(`   ⚠️  Esperado (incluindo 401/403): ${expectedCount}/${totalCount} (${expectedRate}%)`)
  console.log(`   🔴 Críticas OK: ${criticalSuccessCount}/${criticalTotalCount} (${criticalRate}%)`)
  console.log('='.repeat(70))

  // Verificar problemas
  const unexpectedErrors = results.filter(r => !r.expected && r.status !== 0)
  const criticalErrors = results.filter(r => r.critical && !r.success && !r.expected)

  if (unexpectedErrors.length > 0) {
    console.log('\n❌ Problemas inesperados encontrados:')
    unexpectedErrors.forEach(r => {
      console.log(`   - ${r.method} ${r.path}: ${r.error || `HTTP ${r.status}`}`)
    })
  }

  if (criticalErrors.length > 0) {
    console.log('\n🔴 ERROS CRÍTICOS:')
    criticalErrors.forEach(r => {
      console.log(`   - ${r.method} ${r.path}: ${r.error || `HTTP ${r.status}`}`)
    })
    process.exit(1)
  } else if (unexpectedErrors.length > 0) {
    console.log('\n⚠️  Alguns problemas foram encontrados, mas não são críticos.')
    process.exit(0)
  } else {
    console.log('\n✅ Todas as rotas estão respondendo corretamente!')
    process.exit(0)
  }
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error)
  process.exit(1)
})

