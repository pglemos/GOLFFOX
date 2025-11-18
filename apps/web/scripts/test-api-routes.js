/**
 * Script de Teste Remoto das API Routes
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.VERCEL_URL || 'golffox.vercel.app'
const PROTOCOL = BASE_URL.includes('localhost') ? 'http' : 'https'
const PORT = BASE_URL.includes('localhost') ? 3000 : 443

const API_ROUTES_TO_TEST = [
  { path: '/api/health', method: 'GET', auth: false },
  { path: '/api/admin/kpis', method: 'GET', auth: true, role: 'admin' },
  { path: '/api/admin/audit-log?limit=10', method: 'GET', auth: true, role: 'admin' },
  { path: '/api/auth/csrf', method: 'GET', auth: false },
]

async function makeRequest(path, method = 'GET', auth = false) {
  return new Promise((resolve, reject) => {
    const url = `${PROTOCOL}://${BASE_URL}${path}`
    const urlObj = new URL(url)
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (PROTOCOL === 'https' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'GolfFox-Verification-Script/1.0',
      }
    }

    if (auth) {
      // Para testes reais, precisaríamos de um token válido
      // Por enquanto, apenas verificamos se a rota existe
      options.headers['x-test-mode'] = 'true'
    }

    const client = PROTOCOL === 'https' ? https : http
    
    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          ok: res.statusCode >= 200 && res.statusCode < 400
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

async function testRoute(route) {
  try {
    const result = await makeRequest(route.path, route.method, route.auth)
    return {
      ...route,
      status: result.status,
      ok: result.ok,
      error: null
    }
  } catch (error) {
    return {
      ...route,
      status: null,
      ok: false,
      error: error.message
    }
  }
}

async function main() {
  console.log('🧪 Testando API Routes...\n')
  console.log(`Base URL: ${PROTOCOL}://${BASE_URL}\n`)

  const results = []
  for (const route of API_ROUTES_TO_TEST) {
    console.log(`Testando ${route.method} ${route.path}...`)
    const result = await testRoute(route)
    results.push(result)
    
    if (result.ok) {
      console.log(`✅ ${route.path}: ${result.status} OK`)
    } else if (result.status) {
      console.log(`⚠️  ${route.path}: ${result.status} ${result.status === 401 || result.status === 403 ? '(Esperado - requer auth)' : ''}`)
    } else {
      console.log(`❌ ${route.path}: ${result.error}`)
    }
  }

  console.log('\n📋 RESUMO:\n')
  const ok = results.filter(r => r.ok).length
  const total = results.length
  console.log(`APIs funcionando: ${ok}/${total}`)

  const summary = {
    baseUrl: `${PROTOCOL}://${BASE_URL}`,
    results: results,
    timestamp: new Date().toISOString()
  }

  require('fs').writeFileSync(
    'api-routes-test-results.json',
    JSON.stringify(summary, null, 2)
  )

  console.log('\n💾 Resultados salvos em: api-routes-test-results.json')
}

main().catch(console.error)

